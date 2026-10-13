import { describe, it, expect } from 'vitest';
import { getSmoothStepPath, Position } from '@vue-flow/core';
import { assignBackEdgeLanes, backEdgePoints, edgePath, isBackward, roundedPath, NODE_WIDTH, type Box } from '../edgePath';

const box = (x: number, y: number, height = 100): Box => ({ x, y, width: NODE_WIDTH, height });

describe('edgePath', () => {
  it('keeps the smooth step path for forward edges', () => {
    const g = { sourceX: 300, sourceY: 50, targetX: 500, targetY: 120 };
    const [expected] = getSmoothStepPath({ ...g, sourcePosition: Position.Right, targetPosition: Position.Left, borderRadius: 16 });
    expect(isBackward(g.sourceX, g.targetX)).toBe(false);
    expect(edgePath(g)).toBe(expected);
  });

  it('passes just above the source when the target is above', () => {
    const source = box(600, 200, 120); // topo em y = 200; borda direita em x = 860
    const target = box(0, 0, 150);
    const points = backEdgePoints({ sourceX: 860, sourceY: 260, targetX: 0, targetY: 75, sourceBox: source, targetBox: target });

    expect(points).toHaveLength(6);
    expect(points[1]!.x).toBeGreaterThan(860);   // sai para a direita
    expect(points[2]!.y).toBe(200 - 24);         // logo acima da origem
    expect(points[4]!.x).toBeLessThan(0);        // chega pela esquerda
    expect(points[5]).toEqual({ x: 0, y: 75 });
  });

  it('passes just below the source when the target is below, without wrapping under it', () => {
    const points = backEdgePoints({
      sourceX: 860, sourceY: 60, targetX: 0, targetY: 460,
      sourceBox: box(600, 0, 120), targetBox: box(0, 400, 120)
    });
    expect(points).toHaveLength(6);
    expect(points[2]!.y).toBe(144); // 120 + 24: passa acima do destino e desce até a entrada
  });

  it('switches side instead of zigzagging when the track would cross the target', () => {
    // Destino acima, mas alto: a linha acima da origem cortaria o destino
    const points = backEdgePoints({
      sourceX: 860, sourceY: 260, targetX: 0, targetY: 150,
      sourceBox: box(600, 200, 100), targetBox: box(0, 0, 300)
    });
    expect(points).toHaveLength(6);
    expect(points[2]!.y).toBe(300 + 24); // por baixo da origem (bottom 300), fora do destino
  });

  it('goes around both nodes when every track next to the source crosses the target', () => {
    // Destino alto na mesma fileira cobre os dois lados da origem
    const points = backEdgePoints({
      sourceX: 860, sourceY: 150, targetX: 0, targetY: 150,
      sourceBox: box(600, 100, 100), targetBox: box(0, 0, 300)
    });
    expect(points).toHaveLength(6);
    expect([324, -24]).toContain(points[2]!.y);
  });

  it('separates lanes so loops do not share the same track', () => {
    const g = { sourceX: 560, sourceY: 60, targetX: 0, targetY: 60, sourceBox: box(300, 0), targetBox: box(0, 0) };
    const lane0 = backEdgePoints({ ...g, lane: 0 });
    const lane1 = backEdgePoints({ ...g, lane: 1 });
    expect(lane1[1]!.x).toBeGreaterThan(lane0[1]!.x);
    expect(lane1[2]!.y).toBeGreaterThan(lane0[2]!.y);
    expect(lane1[4]!.x).toBeLessThan(lane0[4]!.x);
  });

  it('rounds corners without overshooting short segments', () => {
    const d = roundedPath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 100 }]);
    expect(d).toBe('M 0 0 L 5 0 Q 10 0 10 5 L 10 100');
  });

  it('gives extra lanes only to loops sharing a source or a target', () => {
    const positions = { a: { x: 600, y: 0 }, b: { x: 0, y: 0 }, c: { x: 600, y: 200 }, d: { x: 1000, y: 0 }, e: { x: 1500, y: 0 } };
    const lanes = assignBackEdgeLanes([
      { id: 'a-b', sourceNode: 'a', targetNode: 'b' },
      { id: 'c-b', sourceNode: 'c', targetNode: 'b' }, // mesmo destino que a-b
      { id: 'a-d', sourceNode: 'a', targetNode: 'd' }, // para a frente
      { id: 'e-d', sourceNode: 'e', targetNode: 'd' }  // volta sozinha
    ], positions);
    expect(lanes).toEqual({ 'a-b': 0, 'c-b': 1, 'e-d': 0 });
  });
});
