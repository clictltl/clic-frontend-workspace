import { describe, it, expect } from 'vitest';
import { dedupeTimeline } from '../telemetryApi';
import { sanitizeTrackedUrl } from '../matomo';
import type { TelemetryEvent } from '../../types/telemetry';

function event(id: number, action: string, timestamp: string, payload: any = {}): TelemetryEvent {
  return {
    id,
    event_type: 'mutation',
    action_name: action,
    payload,
    client_timestamp: timestamp,
    created_at: `created-${id}`,
    _relativeTime: 0
  };
}

describe('dedupeTimeline', () => {
  it('remove cópias reenviadas e mantém a ordem', () => {
    const timeline = [
      event(1, 'project_loaded', '2026-10-06T10:00:00.000Z'),
      event(2, 'addNode', '2026-10-06T10:00:01.000Z', { id: 'n1' }),
      event(3, 'editNode', '2026-10-06T10:00:02.000Z', { id: 'n1' }),
      event(4, 'addNode', '2026-10-06T10:00:01.000Z', { id: 'n1' }), // reenvio: id e created_at diferentes
    ];

    expect(dedupeTimeline(timeline).map(e => e.id)).toEqual([1, 2, 3]);
  });

  it('mantém eventos diferentes no mesmo milissegundo', () => {
    const timeline = [
      event(1, 'addNode', '2026-10-06T10:00:01.000Z', { id: 'n1' }),
      event(2, 'addNode', '2026-10-06T10:00:01.000Z', { id: 'n2' }),
      event(3, 'removeNode', '2026-10-06T10:00:01.000Z', { id: 'n1' }),
    ];

    expect(dedupeTimeline(timeline)).toHaveLength(3);
  });
});

describe('sanitizeTrackedUrl', () => {
  it('remove a query e o hash', () => {
    expect(sanitizeTrackedUrl('https://clic.org/app/chatbot/editor?share=abc123#lib=x'))
      .toBe('https://clic.org/app/chatbot/editor');
  });

  it('mascara o token do runtime e do formulário', () => {
    expect(sanitizeTrackedUrl('https://clic.org/app/chatbot/p/abc123')).toBe('https://clic.org/app/chatbot/p/:token');
    expect(sanitizeTrackedUrl('https://clic.org/app/graph-builder/form/xyz/')).toBe('https://clic.org/app/graph-builder/form/:token/');
  });
});
