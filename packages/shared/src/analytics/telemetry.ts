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

    this.queue.push({
      event_type: type,
      action_name: actionName,
      payload: payload,
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
   * Restaura uma fila salva (usado na transição de Login)
   */
  public restoreQueue(rescuedQueue: TelemetryEvent[]) {
    if (rescuedQueue && Array.isArray(rescuedQueue)) {
      this.queue = [...rescuedQueue, ...this.queue];
    }
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
    const eventsToSend = [...this.queue];
    
    // Limpa a fila principal. Se der erro abaixo, a gente devolve.
    this.queue = []; 

    const body = JSON.stringify({
      project_uuid: this.projectUuid,
      session_id: this.sessionId,
      app_type: this.appType,
      events: eventsToSend
    });

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': this.nonce
        },
        body,
        keepalive: isClosingTab 
      });

      // 4. PROTEÇÃO CONTRA 401/403/500: Se o WP rejeitou, lança erro para cair no catch
      if (!res.ok) {
        throw new Error(`Server rejected telemetry with status: ${res.status}`);
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
        this.flush(true);
      }
    });
  }
}

// Exporta como Singleton para ser o mesmo objeto na aplicação inteira
export const telemetryService = new TelemetryManager();