import { useAuth } from '../auth/auth';

export interface TelemetryEvent {
  event_type: 'mutation' | 'semantic' | 'system';
  action_name: string;
  payload: any;
  timestamp: string;
}

/** Sessão de telemetria. Cada evento da fila aponta para a sua, para nunca ir no envelope de outra. */
interface TelemetrySessionRef {
  sessionId: string;
  projectUuid: string;
  appType: string;
  /** Fechada: não aceita eventos novos (cadeia de patches interrompida ou sessão descartada). */
  closed: boolean;
  /** Devolve o estado atual do projeto, para recomeçar a cadeia com um novo Frame Zero. */
  getCurrentState?: () => any;
}

interface QueuedEvent {
  session: TelemetrySessionRef;
  json: string;    // Evento já serializado: o corpo é montado por concatenação
  bytes: number;   // Tamanho em UTF-8, como o servidor mede
  sending: boolean;
}

type SendResult = 'ok' | 'retry' | 'split' | 'permanent' | 'app_rejected';

// Limites do POST /telemetry no servidor: 1 MB de corpo bruto e 200 eventos. Folga para o envelope.
export const MAX_BATCH_BYTES = 900_000;
export const MAX_BATCH_EVENTS = 200;
// Navegadores aceitam ~64 KB somados entre todas as requisições keepalive pendentes
const KEEPALIVE_BUDGET_BYTES = 60_000;
// Teto da fila em memória (aluno sem login acumula eventos que não podem sair)
const MAX_QUEUE_BYTES = 8_000_000;
const SYNC_INTERVAL_MS = 20_000;
const MAX_BACKOFF_MS = 300_000;
const BATCH_GAP_MS = 1_000;
const LOGIN_DELAY_MIN_MS = 5_000;
const LOGIN_DELAY_MAX_MS = 45_000;
// Recomeços de sessão por descarte permitidos por página, para nunca virar laço
const MAX_RESTARTS = 3;

const encoder = new TextEncoder();
const byteLength = (s: string) => encoder.encode(s).length;
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class TelemetryManager {
  private queue: QueuedEvent[] = [];
  private queueBytes = 0;
  private session: TelemetrySessionRef | null = null;
  private ignoreNextStart = false;

  private endpoint = '';
  private nonce = '';

  private timer: ReturnType<typeof setTimeout> | null = null;
  private isFlushing = false;
  private failures = 0;
  private restarts = 0;
  private keepaliveBytesInFlight = 0;
  // Desligada na página toda (app recusado pelo servidor ou recomeços esgotados)
  private disabled = false;

  // Reduzidos quando o servidor recusa um lote por tamanho (413) com limite menor que o nosso
  private maxBatchBytes = MAX_BATCH_BYTES;
  private maxBatchEvents = MAX_BATCH_EVENTS;

  constructor() {
    if (typeof window === 'undefined') return;
    // Último momento confiável para enviar: a aba fica oculta antes de quase toda saída
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flushOnHide();
    });
    window.addEventListener('pagehide', () => this.flushOnHide());
  }

  /**
   * Configura os dados de autenticação para as chamadas REST.
   */
  public configApi(endpoint: string, nonce: string) {
    this.endpoint = endpoint;
    this.nonce = nonce;
  }

  /**
   * Inicia uma nova sessão (Frame Zero). Chamado ao carregar um projeto.
   * `getCurrentState` permite recomeçar a cadeia se algum evento precisar ser descartado.
   */
  public startSession(projectUuid: string, appType: string, initialProjectData: any, getCurrentState?: () => any) {
    if (this.ignoreNextStart) {
      this.ignoreNextStart = false;
      if (this.session) this.session.getCurrentState = getCurrentState;
      return;
    }
    if (this.disabled) return;

    // Os eventos da sessão anterior continuam na fila, presos à própria sessão
    this.session = {
      sessionId: crypto.randomUUID(),
      projectUuid,
      appType,
      closed: false,
      getCurrentState
    };

    this.addEvent('system', 'project_loaded', { initial_state: initialProjectData });
    this.scheduleNext(this.cycleDelay());
  }

  /**
   * Adiciona um evento de mutação (ex: do Pinia ou Blockly)
   */
  public addMutation(actionName: string, payload: any) {
    this.addEvent('mutation', actionName, payload);
  }

  /**
   * Adiciona um evento semântico/comportamental (ex: cliques, erros, play)
   */
  public addSemantic(actionName: string, payload: any = {}) {
    this.addEvent('semantic', actionName, payload);
  }

  private addEvent(type: TelemetryEvent['event_type'], actionName: string, payload: any) {
    const session = this.session;
    if (this.disabled || !session || session.closed) return;

    let safePayload = {};
    try {
      // O stringify remove Funções e propriedades inválidas e suporta Proxies do Vue
      safePayload = JSON.parse(JSON.stringify(payload));
    } catch (e) {
      console.warn(`[CLIC Telemetry] Payload não serializável ignorado na ação: ${actionName}`);
      safePayload = { error: 'unserializable_payload' };
    }

    const event: TelemetryEvent = {
      event_type: type,
      action_name: actionName,
      payload: safePayload,
      timestamp: new Date().toISOString() // ISO 8601 com milissegundos
    };
    this.enqueue(session, event);
  }

  private enqueue(session: TelemetrySessionRef, event: TelemetryEvent) {
    const json = JSON.stringify(event);
    const bytes = byteLength(json);
    const isFrameZero = event.action_name === 'project_loaded';

    // Evento que sozinho não cabe num lote nunca seria aceito pelo servidor
    if (bytes + this.envelopeBytes(session) > this.maxBatchBytes) {
      console.warn(`[CLIC Telemetry] Evento grande demais descartado: ${event.action_name} (${bytes} bytes)`);
      if (isFrameZero) {
        // Sem Frame Zero as mutações não servem para o replay: desliga a sessão
        session.closed = true;
      } else {
        this.restartChain(session);
      }
      return;
    }

    // Fila cheia: corta o fim da sessão, mantendo a cadeia consistente até ali
    if (this.queueBytes + bytes > MAX_QUEUE_BYTES) {
      console.warn('[CLIC Telemetry] Fila cheia. Novos eventos desta sessão serão ignorados.');
      session.closed = true;
      return;
    }

    this.queue.push({ session, json, bytes, sending: false });
    this.queueBytes += bytes;
  }

  /**
   * Retorna os eventos pendentes da sessão atual (backup antes do login)
   */
  public getOfflineQueue(): TelemetryEvent[] {
    return this.queue
      .filter(item => item.session === this.session)
      .map(item => JSON.parse(item.json));
  }

  /**
   * Retorna a identidade atual (usado para salvar o backup antes do login)
   */
  public getSessionInfo() {
    return {
      sessionId: this.session?.sessionId ?? '',
      projectUuid: this.session?.projectUuid ?? '',
      appType: this.session?.appType ?? ''
    };
  }

  /**
   * Retoma uma sessão interrompida pelo recarregamento da página (Login)
   */
  public resumeSession(sessionId: string, projectUuid: string, appType: string, rescuedQueue: TelemetryEvent[]) {
    if (!sessionId) return;

    this.session = { sessionId, projectUuid, appType, closed: false };
    if (Array.isArray(rescuedQueue)) {
      rescuedQueue.forEach(event => this.enqueue(this.session!, event));
    }

    this.ignoreNextStart = true; // O próximo startSession (o load do projeto restaurado) é ignorado
    // Espalha o envio da turma inteira que acabou de fazer login
    this.scheduleNext(randomBetween(LOGIN_DELAY_MIN_MS, LOGIN_DELAY_MAX_MS));
  }

  /**
   * Envia a fila para o servidor, em lotes, um de cada vez.
   */
  public async flush() {
    if (this.isFlushing) return;
    if (!this.canSend()) {
      // Mantém o ciclo vivo (ex.: offline ou sem login agora, mas não daqui a pouco)
      if (this.session) this.scheduleNext(this.cycleDelay());
      return;
    }
    this.isFlushing = true;

    try {
      let batch = this.nextBatch(this.maxBatchBytes);
      while (batch.length > 0) {
        const result = await this.sendBatch(batch, false);

        if (result === 'retry') {
          this.failures++;
          break;
        }
        this.failures = 0;

        batch = this.nextBatch(this.maxBatchBytes);
        if (batch.length > 0 && result !== 'split') await wait(BATCH_GAP_MS);
        if (!this.canSend()) break;
      }
    } finally {
      this.isFlushing = false;
      if (this.session) this.scheduleNext(this.cycleDelay());
    }
  }

  /**
   * Aba oculta (troca de aba, fechamento, tela bloqueada): o que cabe no orçamento do keepalive
   * vai primeiro, porque sobrevive ao fechamento; o resto segue pelo envio normal.
   */
  private flushOnHide() {
    if (!this.canSend()) return;

    let budget = KEEPALIVE_BUDGET_BYTES - this.keepaliveBytesInFlight;
    let batch = this.nextBatch(budget);
    while (batch.length > 0) {
      const bytes = this.batchBytes(batch);
      budget -= bytes;
      this.keepaliveBytesInFlight += bytes;
      this.sendBatch(batch, true).finally(() => {
        this.keepaliveBytesInFlight -= bytes;
      });
      batch = this.nextBatch(budget);
    }

    // Adianta o ciclo em vez de somar um envio extra
    this.flush();
  }

  private canSend() {
    if (this.disabled || !this.endpoint || this.queue.length === 0) return false;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
    // Sem login a fila fica na memória até o aluno entrar
    return useAuth().state.loggedIn;
  }

  /** Monta o próximo lote: eventos ainda não enviados, da mesma sessão, dentro dos limites. */
  private nextBatch(maxBytes: number): QueuedEvent[] {
    const start = this.queue.findIndex(item => !item.sending);
    if (start === -1) return [];

    const first = this.queue[start]!;
    const batch: QueuedEvent[] = [];
    let total = this.envelopeBytes(first.session);

    for (let i = start; i < this.queue.length; i++) {
      const item = this.queue[i]!;
      if (item.sending) continue;
      if (item.session !== first.session) break;
      if (batch.length >= this.maxBatchEvents) break;
      // +1 da vírgula entre eventos
      if (total + item.bytes + 1 > maxBytes) break;
      batch.push(item);
      total += item.bytes + 1;
    }
    return batch;
  }

  private envelopeBytes(session: TelemetrySessionRef) {
    return byteLength(this.buildBody(session, []));
  }

  private batchBytes(batch: QueuedEvent[]) {
    return byteLength(this.buildBody(batch[0]!.session, batch));
  }

  private buildBody(session: TelemetrySessionRef, batch: QueuedEvent[]) {
    const envelope = JSON.stringify({
      project_uuid: session.projectUuid,
      session_id: session.sessionId,
      app_type: session.appType,
      events: []
    });
    // Troca o "[]" final pelos eventos já serializados
    return envelope.slice(0, -3) + '[' + batch.map(item => item.json).join(',') + ']}';
  }

  private async sendBatch(batch: QueuedEvent[], keepalive: boolean): Promise<SendResult> {
    batch.forEach(item => { item.sending = true; });

    let result: SendResult;
    let errorCode = '';
    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': this.nonce
        },
        body: this.buildBody(batch[0]!.session, batch),
        keepalive
      });

      if (res.status === 400 || res.status === 413) {
        // clic-core usa `error`; erros gerados pelo próprio WP usam `code`
        const data = await res.json().catch(() => ({}));
        errorCode = data?.error ?? data?.code ?? '';
      }
      result = this.classify(res.status, errorCode, batch.length);
    } catch (err) {
      // Falha de rede: o lote volta para a fila sem perder a ordem
      result = 'retry';
    }

    batch.forEach(item => { item.sending = false; });

    switch (result) {
      case 'ok':
        this.remove(batch);
        break;
      case 'split':
        // O servidor tem limite menor que o nosso: os próximos lotes saem com metade do que estourou
        if (errorCode !== 'PAYLOAD_TOO_LARGE') {
          this.maxBatchEvents = Math.max(1, Math.floor(batch.length / 2));
        }
        if (errorCode !== 'TOO_MANY_EVENTS') {
          this.maxBatchBytes = Math.max(1, Math.floor(this.batchBytes(batch) / 2));
        }
        break;
      case 'permanent':
        this.handlePermanentFailure(batch, errorCode);
        break;
      case 'app_rejected':
        console.warn('[CLIC Telemetry] App não registrado no servidor. Telemetria desligada.');
        this.disable();
        break;
    }
    return result;
  }

  private classify(status: number, errorCode: string, batchSize: number): SendResult {
    if (status >= 200 && status < 300) return 'ok';
    if (status === 400 && errorCode === 'APP_NOT_REGISTERED') return 'app_rejected';
    if (status === 413) return batchSize > 1 ? 'split' : 'permanent';
    if (status === 400) return 'permanent';
    // Rede, 401/403 (sessão), 408, 429, 5xx, 508 (limite da hospedagem) e o resto: tenta de novo depois
    return 'retry';
  }

  /**
   * Lote recusado para sempre. Os eventos seguintes da mesma sessão dependem dele,
   * então são descartados e a cadeia recomeça com o estado atual.
   */
  private handlePermanentFailure(batch: QueuedEvent[], errorCode: string) {
    const session = batch[0]!.session;
    console.warn(`[CLIC Telemetry] Lote recusado pelo servidor (${errorCode || 'sem código'}).`);

    const hasFrameZero = batch.some(item => JSON.parse(item.json).action_name === 'project_loaded');
    const startIndex = this.queue.indexOf(batch[0]!);
    const dropped = this.queue.filter((item, i) => item.session === session && i >= startIndex);
    this.remove(dropped);

    if (hasFrameZero) {
      // Recomeçar mandaria o mesmo Frame Zero de novo: desliga só esta sessão
      session.closed = true;
      return;
    }
    this.restartChain(session);
  }

  /** Fecha a sessão e, se ela ainda é a atual, abre outra com o estado atual como Frame Zero. */
  private restartChain(session: TelemetrySessionRef) {
    session.closed = true;
    if (session !== this.session) return;

    if (this.restarts >= MAX_RESTARTS || !session.getCurrentState) {
      if (this.restarts >= MAX_RESTARTS) {
        console.warn('[CLIC Telemetry] Muitos descartes nesta página. Telemetria desligada.');
        this.disable();
      }
      return;
    }

    this.restarts++;
    this.startSession(session.projectUuid, session.appType, session.getCurrentState(), session.getCurrentState);
  }

  private remove(items: QueuedEvent[]) {
    const set = new Set(items);
    this.queue = this.queue.filter(item => !set.has(item));
    this.queueBytes = this.queue.reduce((sum, item) => sum + item.bytes, 0);
  }

  private disable() {
    this.disabled = true;
    this.queue = [];
    this.queueBytes = 0;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  /** Ciclo normal com variação por aluno, ou espera crescente depois de falhas. */
  private cycleDelay() {
    const base = this.failures > 0
      ? Math.min(SYNC_INTERVAL_MS * 2 ** this.failures, MAX_BACKOFF_MS)
      : SYNC_INTERVAL_MS;
    return base * randomBetween(0.75, 1.25);
  }

  private scheduleNext(delayMs: number) {
    if (this.disabled) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), delayMs);
  }
}

export { TelemetryManager };

// Exporta como Singleton para ser o mesmo objeto na aplicação inteira
export const telemetryService = new TelemetryManager();
