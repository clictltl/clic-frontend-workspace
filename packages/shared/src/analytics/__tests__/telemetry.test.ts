import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TelemetryManager, MAX_BATCH_BYTES, MAX_BATCH_EVENTS } from '../telemetry';
import { useAuth } from '../../auth/auth';

type Body = { project_uuid: string; session_id: string; app_type: string; events: any[] };

function response(status: number, body: any = { success: status < 300 }) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const fetchMock = vi.fn();
const bodies = (): Body[] => fetchMock.mock.calls.map(call => JSON.parse(call[1].body));
const actions = (body: Body) => body.events.map(e => e.action_name);

function createService(state: any = { uuid: 'p1', title: 'x' }) {
  const service = new TelemetryManager();
  service.configApi('/telemetry', 'nonce');
  service.startSession('p1', 'chatbot', state, () => state);
  return service;
}

/** Roda um flush avançando as pausas entre lotes. */
async function flush(service: TelemetryManager) {
  const done = service.flush();
  for (let i = 0; i < 20; i++) await vi.advanceTimersByTimeAsync(1_000);
  await done;
}

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => response(200));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  useAuth().state.loggedIn = true;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('montagem dos lotes', () => {
  it('limita cada lote a 200 eventos', async () => {
    const service = createService();
    for (let i = 0; i < 449; i++) service.addMutation('edit', { i });

    await flush(service);

    expect(bodies().map(b => b.events.length)).toEqual([MAX_BATCH_EVENTS, MAX_BATCH_EVENTS, 50]);
  });

  it('limita cada lote ao tamanho em bytes', async () => {
    const service = createService();
    const big = 'x'.repeat(300_000);
    for (let i = 0; i < 5; i++) service.addMutation('edit', { big });

    await flush(service);

    for (const call of fetchMock.mock.calls) {
      expect(new TextEncoder().encode(call[1].body).length).toBeLessThanOrEqual(MAX_BATCH_BYTES);
    }
    expect(bodies().flatMap(b => b.events)).toHaveLength(6);
  });

  it('conta bytes em UTF-8, não caracteres', async () => {
    const service = createService();
    // 'ç' ocupa 2 bytes: 250 mil caracteres = 500 KB
    const accented = 'ç'.repeat(250_000);
    service.addMutation('edit', { accented });
    service.addMutation('edit', { accented });

    await flush(service);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('nunca mistura sessões no mesmo envelope', async () => {
    const service = createService();
    service.addMutation('edit_a', {});
    service.startSession('p2', 'chatbot', { uuid: 'p2' });
    service.addMutation('edit_b', {});

    await flush(service);

    const [first, second] = bodies();
    expect(first!.project_uuid).toBe('p1');
    expect(actions(first!)).toEqual(['project_loaded', 'edit_a']);
    expect(second!.project_uuid).toBe('p2');
    expect(actions(second!)).toEqual(['project_loaded', 'edit_b']);
    expect(first!.session_id).not.toBe(second!.session_id);
  });

  it('não envia sem login, mas mantém a fila', async () => {
    useAuth().state.loggedIn = false;
    const service = createService();

    await flush(service);
    expect(fetchMock).not.toHaveBeenCalled();

    useAuth().state.loggedIn = true;
    await flush(service);
    expect(actions(bodies()[0]!)).toEqual(['project_loaded']);
  });
});

describe('respostas do servidor', () => {
  it('mantém o lote na fila em falhas passageiras e reenvia depois', async () => {
    const service = createService();
    fetchMock.mockImplementationOnce(async () => response(508));

    await flush(service);
    await flush(service);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(bodies()[1]).toEqual(bodies()[0]);

    await flush(service);
    expect(fetchMock).toHaveBeenCalledTimes(2); // fila vazia depois do 200
  });

  it('trata falha de rede como passageira', async () => {
    const service = createService();
    fetchMock.mockImplementationOnce(async () => { throw new TypeError('Failed to fetch'); });

    await flush(service);
    await flush(service);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('divide o lote ao meio quando recebe 413', async () => {
    const service = createService();
    for (let i = 0; i < 9; i++) service.addMutation('edit', { i });
    fetchMock.mockImplementationOnce(async () => response(413, { success: false, error: 'TOO_MANY_EVENTS' }));

    await flush(service);

    expect(bodies().map(b => b.events.length)).toEqual([10, 5, 5]);
  });

  it('reduz o limite de bytes quando o 413 é por tamanho', async () => {
    const service = createService();
    const chunk = 'x'.repeat(100_000);
    for (let i = 0; i < 4; i++) service.addMutation('edit', { chunk });
    fetchMock.mockImplementationOnce(async () => response(413, { success: false, error: 'PAYLOAD_TOO_LARGE' }));

    await flush(service);

    const [rejected, ...rest] = fetchMock.mock.calls.map(call => call[1].body.length);
    for (const size of rest) expect(size).toBeLessThanOrEqual(rejected! / 2);
    expect(bodies().slice(1).flatMap(b => b.events)).toHaveLength(5);
  });

  it('recomeça a cadeia com o estado atual quando um lote é recusado para sempre', async () => {
    const state = { uuid: 'p1', nodes: ['a'] };
    const service = createService(state);
    await flush(service); // project_loaded aceito

    service.addMutation('edit', { n: 1 });
    state.nodes.push('b');
    fetchMock.mockImplementationOnce(async () => response(400, { success: false, error: 'INVALID_PAYLOAD' }));
    await flush(service);

    const [first, rejected, restarted] = bodies();
    expect(actions(rejected!)).toEqual(['edit']);
    expect(actions(restarted!)).toEqual(['project_loaded']);
    expect(restarted!.session_id).not.toBe(first!.session_id);
    expect(restarted!.events[0].payload.initial_state.nodes).toEqual(['a', 'b']);
  });

  it('desliga a sessão, sem recomeçar, quando o lote do project_loaded é recusado', async () => {
    const service = createService();
    service.addMutation('edit', {});
    fetchMock.mockImplementation(async () => response(400, { success: false, code: 'rest_invalid_json' }));

    await flush(service);
    service.addMutation('ignored', {});
    await flush(service);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('desliga a telemetria da página quando o app não está registrado', async () => {
    const service = createService();
    fetchMock.mockImplementation(async () => response(400, { success: false, error: 'APP_NOT_REGISTERED' }));

    await flush(service);
    service.startSession('p2', 'chatbot', { uuid: 'p2' });
    await flush(service);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('desliga a telemetria depois de 3 recomeços', async () => {
    const service = createService();
    await flush(service);

    fetchMock.mockImplementation(async (_url: string, init: any) => {
      const body = JSON.parse(init.body);
      return body.events[0].action_name === 'project_loaded'
        ? response(200)
        : response(400, { success: false, error: 'INVALID_PAYLOAD' });
    });

    for (let i = 0; i < 5; i++) {
      service.addMutation('edit', { i });
      await flush(service);
    }

    const rejected = bodies().filter(b => b.events[0].action_name === 'edit');
    expect(rejected).toHaveLength(4); // 3 recomeços + a recusa que desliga
  });
});

describe('eventos grandes demais', () => {
  it('descarta a mutação e recomeça a cadeia', async () => {
    const service = createService();
    service.addMutation('huge', { data: 'x'.repeat(MAX_BATCH_BYTES) });

    await flush(service);

    const sent = bodies();
    expect(sent.flatMap(actions)).toEqual(['project_loaded', 'project_loaded']);
    expect(sent[0]!.session_id).not.toBe(sent[1]!.session_id);
  });

  it('desliga a sessão se o próprio project_loaded não cabe', async () => {
    const service = createService({ uuid: 'p1', data: 'x'.repeat(MAX_BATCH_BYTES) });
    service.addMutation('edit', {});

    await flush(service);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('aba oculta', () => {
  it('envia com keepalive só o que cabe em ~60 KB e o resto pelo envio normal', async () => {
    const service = createService();
    const chunk = 'x'.repeat(20_000);
    for (let i = 0; i < 5; i++) service.addMutation('edit', { chunk });

    (service as any).flushOnHide();
    for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(1_000);

    const keepalive = fetchMock.mock.calls.filter(call => call[1].keepalive);
    const normal = fetchMock.mock.calls.filter(call => !call[1].keepalive);
    const keepaliveBytes = keepalive.reduce((sum, call) => sum + call[1].body.length, 0);

    expect(keepalive.length).toBeGreaterThan(0);
    expect(keepaliveBytes).toBeLessThanOrEqual(60_000);
    expect(normal.length).toBeGreaterThan(0);
    expect(bodies().flatMap(b => b.events)).toHaveLength(6);
  });
});
