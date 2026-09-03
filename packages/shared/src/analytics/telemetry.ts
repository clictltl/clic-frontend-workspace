import { useAuth } from '../auth/auth';

export interface TelemetryEvent {
  event_type: 'mutation' | 'semantic' | 'system';
  action_name: string;
  payload: any;
  timestamp: string;
}

class TelemetryManager {
  private queue: TelemetryEvent[] = [];
  private sessionId: string = '';
  private projectUuid: string = '';
  private appType: string = '';
  private ignoreNextStart = false;
  
  // Configurações de API e Sincronização
  private endpoint: string = '';
  private nonce: string = '';
  private syncIntervalTime = 15000; // 15 segundos
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;

  constructor() {
    this.setupWindowUnload();
  }

  /**
   * Configura os dados de autenticação para as chamadas REST.
   * Deve ser chamado assim que o app carrega (ou junto com o setup da API).
   */
  public configApi(endpoint: string, nonce: string) {
    this.endpoint = endpoint;
    this.nonce = nonce;
  }

  /**
   * Inicia uma nova sessão (Frame Zero). Chamado ao carregar um projeto.
   */
  public startSession(projectUuid: string, appType: string, initialProjectData: any) {
    if (this.ignoreNextStart) {
      this.ignoreNextStart = false;
      return;
    }

    // Se já havia uma sessão rodando, tenta enviar o que sobrou
    if (this.queue.length > 0) {
      this.flush();
    }

    this.sessionId = crypto.randomUUID();
    this.projectUuid = projectUuid;
    this.appType = appType;

    // Dispara o Frame Zero
    this.addEvent('system', 'project_loaded', {
      initial_state: initialProjectData
    });

    this.startAutoSync();
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

  /**
   * Método interno para empilhar o evento com timestamp milimétrico
   */
  private addEvent(type: 'mutation' | 'semantic' | 'system', actionName: string, payload: any) {
    if (!this.sessionId) return; // Ignora se não houver sessão ativa

    let safePayload = {};

    try {
      // O stringify nativamente remove Funções e propriedades inválidas de forma segura.
      // Substituímos o structuredClone por ele para suportar Proxies do Vue e Eventos sem quebrar o app.
      safePayload = JSON.parse(JSON.stringify(payload));
    } catch (e) {
      console.warn(`[CLIC Telemetry] Payload não serializável ignorado na ação: ${actionName}`);
      safePayload = { error: 'unserializable_payload' };
    }

    this.queue.push({
      event_type: type,
      action_name: actionName,
      payload: safePayload,
      timestamp: new Date().toISOString() // ISO 8601 com milissegundos
    });
  }

  /**
   * Retorna a fila atual (Usado para o arquivo .zip de exportação offline)
   */
  public getOfflineQueue(): TelemetryEvent[] {
    return [...this.queue];
  }

  /**
   * Retorna a identidade atual (usado para salvar o backup antes do login)
   */
  public getSessionInfo() {
    return {
      sessionId: this.sessionId,
      projectUuid: this.projectUuid,
      appType: this.appType
    };
  }

  /**
   * Retoma uma sessão interrompida pelo recarregamento da página (Login)
   */
  public resumeSession(sessionId: string, projectUuid: string, appType: string, rescuedQueue: TelemetryEvent[]) {
    this.sessionId = sessionId;
    this.projectUuid = projectUuid;
    this.appType = appType;
    
    if (rescuedQueue && Array.isArray(rescuedQueue)) {
      this.queue = rescuedQueue;
    }
    
    this.ignoreNextStart = true; // <-- ATIVA O ESCUDO! O próximo startSession será ignorado.
    this.startAutoSync();
  }

  /**
   * Envia os logs para o servidor e limpa a fila
   */
  public async flush(isClosingTab = false) {
    // 1. Aborta se a fila estiver vazia, faltando dados, ou já estiver enviando
    if (this.queue.length === 0 || !this.projectUuid || !this.endpoint || this.isFlushing) return;
    
    // 2. Aborta (mas mantém na fila) se não houver internet
    if (!navigator.onLine) return;

    // 3. PROTEÇÃO OFFLINE/ANÔNIMO: Aborta se o usuário não estiver logado.
    // Se não estiver logado, aborta o envio, mas mantém a fila intacta na RAM.
    const auth = useAuth();
    if (!auth.state.loggedIn) return;

    this.isFlushing = true;
    let eventsToSend: TelemetryEvent[] = [];
    
    try {
      // 1. JITTER SUAVE (1s a 4s): Invisível para o usuário, espalha a carga do servidor.
      // Se for fechamento de aba (isClosingTab = true), ignora o atraso e manda na hora.
      if (!isClosingTab) {
        const jitter = Math.floor(Math.random() * 3000) + 1000;
        await new Promise(resolve => setTimeout(resolve, jitter));
      }

      if (this.queue.length === 0) return;

      // 2. CHUNKING: Manda de 50 em 50 para não pesar. Na saída, tenta mandar tudo.
      const chunkSize = isClosingTab ? this.queue.length : 50;
      eventsToSend = this.queue.splice(0, chunkSize);

      const body = JSON.stringify({
        project_uuid: this.projectUuid,
        session_id: this.sessionId,
        app_type: this.appType,
        events: eventsToSend
      });

      // keepalive: true garante que o envio termine mesmo se a criança fechar o navegador no meio
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': this.nonce
        },
        body,
        keepalive: isClosingTab 
      });

      // 3. PROTEÇÃO CONTRA 401/403/500: Se o WP rejeitou, lança erro para cair no catch
      if (!res.ok) {
        throw new Error(`Server rejected telemetry with status: ${res.status}`);
      }

      // 4. RECURSÃO RÁPIDA: Se sobrou dados na fila, agenda o resto para daqui 1 segundo.
      if (this.queue.length > 0 && !isClosingTab) {
        setTimeout(() => {
          this.isFlushing = false;
          this.flush();
        }, 1000);
        return; 
      }

    } catch (error) {
      console.warn('[CLIC Telemetry] Falha ao sincronizar. Retornando logs para a fila.', error);
      // Se falhou (ex: instabilidade ou sessão expirada), devolvemos os logs para a fila!
      this.queue = [...eventsToSend, ...this.queue];
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Inicia o envio em background a cada X segundos
   */
  private startAutoSync() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(() => {
      this.flush();
    }, this.syncIntervalTime);
  }

  /**
   * Garante o envio do último lote caso o aluno feche a aba sem avisar
   */
  private setupWindowUnload() {
    window.addEventListener('beforeunload', () => {
      if (this.queue.length > 0) {
        // Envia silenciosamente o que sobrou. O keepalive cuidará do resto.
        this.flush(true); 
      }
    });
  }
}

// Exporta como Singleton para ser o mesmo objeto na aplicação inteira
export const telemetryService = new TelemetryManager();