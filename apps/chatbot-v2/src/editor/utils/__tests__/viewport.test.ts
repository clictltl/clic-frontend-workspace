import { describe, it, expect } from 'vitest';
import { flowOrder, nodesToFrameOnOpen, smallFlowViewport, zoomToFit, type Rect } from '../viewport';
import { connect } from '../../../shared/domain/graph';
import { setup } from '../../../shared/domain/__tests__/helpers';

const VIEW = { width: 1000, height: 700 };
const rect = (x: number, y: number): Rect => ({ x, y, width: 260, height: 120 });

describe('viewport on open', () => {
  it('computes the zoom that fits a rectangle with padding', () => {
    expect(zoomToFit({ x: 0, y: 0, width: 700, height: 300 }, VIEW, 0.2)).toBeCloseTo(1000 / (700 * 1.4));
  });

  it('follows the conversation order from the Start block', () => {
    const { project, start, message, add } = setup();
    const a = add('message');
    const b = add('message');
    connect(project, message.id, 'out', b.id);
    expect(flowOrder(project)).toEqual([start.id, message.id, b.id]);
    expect(flowOrder(project)).not.toContain(a.id); // solto: fora da conversa
  });

  it('frames everything when it fits with a readable zoom', () => {
    const { project, start, message } = setup();
    const rects = { [start.id]: rect(0, 0), [message.id]: rect(320, 0) };
    expect(nodesToFrameOnOpen(project, rects, VIEW)).toBeNull();
  });

  it('frames only the beginning of a large flow', () => {
    const { project, start, message, add } = setup();
    const rects: Record<string, Rect> = { [start.id]: rect(0, 0), [message.id]: rect(320, 0) };
    let previous = message.id;
    for (let i = 0; i < 10; i++) {
      const next = add('message');
      connect(project, previous, 'out', next.id);
      rects[next.id] = rect(640 + i * 320, 0);
      previous = next.id;
    }
    const subset = nodesToFrameOnOpen(project, rects, VIEW)!;
    expect(subset[0]).toBe(start.id);
    expect(subset.length).toBeGreaterThan(1);
    expect(subset.length).toBeLessThan(Object.keys(rects).length);
  });
});

describe('smallFlowViewport', () => {
  const view = { width: 1000, height: 700 };
  it('opens a small flow at 100%, at the left and near the top', () => {
    expect(smallFlowViewport({ x: 250, y: 150, width: 600, height: 130 }, view)).toEqual({ x: 80 - 250, y: 120 - 150, zoom: 1 });
  });
  it('returns null when the flow does not fit at 100%', () => {
    expect(smallFlowViewport({ x: 0, y: 0, width: 900, height: 100 }, view)).toBeNull();
  });
});
