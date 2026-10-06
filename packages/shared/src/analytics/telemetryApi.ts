import { clicFetch } from '../utils/api';
import { getNonce } from '../auth/auth';
import type { TelemetrySessionsResponse, TelemetryEvent } from '../types/telemetry';

/**
 * Remove eventos gravados em dobro. Um lote reenviado depois de uma resposta perdida
 * gera cópias exatas (mesmo instante, ação e payload); aplicar um patch duas vezes
 * duplicaria blocos ou nós no replay. Mantém a ordem recebida do servidor.
 */
export function dedupeTimeline(events: TelemetryEvent[]): TelemetryEvent[] {
  const seen = new Set<string>();
  return events.filter(ev => {
    const key = `${ev.client_timestamp}|${ev.event_type}|${ev.action_name}|${JSON.stringify(ev.payload)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const telemetryApi = {
  get baseUrl() {
    return window.CLIC_CORE?.rest_root ?? '/wp-json/clic/v1/emoji-coder/';
  },

  async getSessions(startDate: string, endDate: string): Promise<TelemetrySessionsResponse> {
    try {
      const res = await clicFetch(`${this.baseUrl}telemetry/sessions?start_date=${startDate}&end_date=${endDate}`, {
        method: 'GET',
        headers: { 'X-WP-Nonce': getNonce() }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Error fetching sessions');
      return data as TelemetrySessionsResponse;
    } catch (err) {
      console.error('[Telemetry API] getSessions error:', err);
      throw err;
    }
  },

  async getSessionTimeline(sessionId: string): Promise<TelemetryEvent[]> {
    try {
      const res = await clicFetch(`${this.baseUrl}telemetry/sessions/${sessionId}/timeline`, {
        method: 'GET',
        headers: { 'X-WP-Nonce': getNonce() }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Error fetching timeline');
      return dedupeTimeline(data.timeline as TelemetryEvent[]);
    } catch (err) {
      console.error('[Telemetry API] getSessionTimeline error:', err);
      throw err;
    }
  }
};