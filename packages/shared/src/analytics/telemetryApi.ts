import { clicFetch } from '../utils/api';

export const telemetryApi = {
  get baseUrl() {
    return window.CLIC_CORE?.rest_root ?? '/wp-json/clic/v1/emoji-coder/';
  },

  get nonce() {
    return window.CLIC_AUTH?.nonce ?? '';
  },

  async getSessions(startDate: string, endDate: string) {
    try {
      const res = await clicFetch(`${this.baseUrl}telemetry/sessions?start_date=${startDate}&end_date=${endDate}`, {
        method: 'GET',
        headers: { 'X-WP-Nonce': this.nonce }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Error fetching sessions');
      return data; // { success, meta, sessions }
    } catch (err) {
      console.error('[Telemetry API] getSessions error:', err);
      throw err;
    }
  },

  async getSessionTimeline(sessionId: string) {
    try {
      const res = await clicFetch(`${this.baseUrl}telemetry/sessions/${sessionId}/timeline`, {
        method: 'GET',
        headers: { 'X-WP-Nonce': this.nonce }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Error fetching timeline');
      return data.timeline;
    } catch (err) {
      console.error('[Telemetry API] getSessionTimeline error:', err);
      throw err;
    }
  }
};