import { getSmoothStepPath, Position } from '@vue-flow/core';

/**
 * TRAÇADO DAS CONEXÕES
 *
 * Toda saída fica na borda direita e toda entrada na borda esquerda. Para a frente,
 * usamos o "smooth step" do Vue Flow. Quando o destino está atrás (laços como
 * "jogar de novo"), o smooth step passa por baixo dos blocos; aqui a linha corre por um
 * trilho fora dos blocos e chega ao destino pela esquerda, numa faixa própria para não
 * sobrepor outras voltas.
 */

export interface Box { x: number; y: number; width: number; height: number }
export interface Point { x: number; y: number }

export interface EdgeGeometry {
  sourceX: number; sourceY: number;
  targetX: number; targetY: number;
  sourceBox?: Box | null; // Bloco de origem (sem ele, a volta usa só os pontos)
  targetBox?: Box | null;
  lane?: number;          // Faixa da volta (0, 1, 2…)
}

const RADIUS = 12;
/** Volta só quando o destino está atrás da saída (com folga para a curva de entrada). */
export const BACKWARD_MIN_GAP = 0;
const STUB = 20;     // Trecho reto ao sair/entrar no bloco
const CLEARANCE = 24; // Distância da volta até a borda do bloco
const LANE_GAP = 12;  // Afastamento entre faixas
export const MAX_LANES = 5;
/** Largura fixa dos blocos no canvas (`.custom-node`). */
export const NODE_WIDTH = 260;

export function isBackward(sourceX: number, targetX: number): boolean {
  return targetX < sourceX + BACKWARD_MIN_GAP;
}

/**
 * Pontos da volta: sai à direita, corre na horizontal por um trilho fora dos blocos e entra
 * no destino pela esquerda. Trilhos possíveis: rente à origem (abaixo ou acima) ou por fora
 * dos dois blocos. Vale o que não atravessa o destino com o menor percurso vertical; assim,
 * com o destino abaixo a volta passa abaixo da origem, e com ele acima, acima da origem.
 */
export function backEdgePoints(g: EdgeGeometry): Point[] {
  const offset = (g.lane ?? 0) * LANE_GAP;
  const margin = CLEARANCE + offset;
  const exitX = g.sourceX + STUB + offset;
  const entryX = g.targetX - STUB - offset;

  const s = g.sourceBox ?? { x: g.sourceX, y: g.sourceY, width: 0, height: 0 };
  const t = g.targetBox ?? { x: g.targetX, y: g.targetY, width: 0, height: 0 };
  const sBottom = Math.max(s.y + s.height, g.sourceY);
  const sTop = Math.min(s.y, g.sourceY);

  const tracks = [
    sBottom + margin,                                   // rente à origem, por baixo
    sTop - margin,                                      // rente à origem, por cima
    Math.max(sBottom, t.y + t.height, g.targetY) + margin, // por fora, por baixo
    Math.min(sTop, t.y, g.targetY) - margin              // por fora, por cima
  ];
  const crossesTarget = (y: number) => y > t.y - CLEARANCE && y < t.y + t.height + CLEARANCE;
  const cost = (y: number) => Math.abs(y - g.sourceY) + Math.abs(y - g.targetY);
  const y = tracks
    .filter(track => !crossesTarget(track))
    .reduce((best, track) => (cost(track) < cost(best) ? track : best));

  return [
    { x: g.sourceX, y: g.sourceY },
    { x: exitX, y: g.sourceY },
    { x: exitX, y },
    { x: entryX, y },
    { x: entryX, y: g.targetY },
    { x: g.targetX, y: g.targetY }
  ];
}

/** Polilinha ortogonal em SVG com cantos arredondados (o raio diminui em trechos curtos). */
export function roundedPath(points: Point[], radius = RADIUS): string {
  if (points.length < 2) return '';
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!;
    const corner = points[i]!;
    const next = points[i + 1]!;
    const r = Math.min(radius, distance(prev, corner) / 2, distance(corner, next) / 2);
    const from = towards(corner, prev, r);
    const to = towards(corner, next, r);
    d += ` L ${from.x} ${from.y} Q ${corner.x} ${corner.y} ${to.x} ${to.y}`;
  }
  const last = points[points.length - 1]!;
  return `${d} L ${last.x} ${last.y}`;
}

/** Caminho SVG da conexão (para a frente ou volta). */
export function edgePath(g: EdgeGeometry): string {
  if (isBackward(g.sourceX, g.targetX)) return roundedPath(backEdgePoints(g));
  // Com pouco espaço entre os blocos, o trecho reto encolhe para a curva não dar "gancho"
  const stub = Math.max(4, Math.min(STUB, (g.targetX - g.sourceX) / 2));
  const [path] = getSmoothStepPath({
    sourceX: g.sourceX, sourceY: g.sourceY, sourcePosition: Position.Right,
    targetX: g.targetX, targetY: g.targetY, targetPosition: Position.Left,
    borderRadius: 16, offset: stub
  });
  return path;
}

/** Caixa de um nó do Vue Flow (posição absoluta e tamanho medido). */
export function nodeBox(node: { computedPosition: Point; dimensions: { width: number; height: number } } | null | undefined): Box | null {
  if (!node) return null;
  return { ...node.computedPosition, ...node.dimensions };
}

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Ponto a `length` de `from` na direção de `to`. */
function towards(from: Point, to: Point, length: number): Point {
  const total = distance(from, to) || 1;
  return { x: from.x + ((to.x - from.x) / total) * length, y: from.y + ((to.y - from.y) / total) * length };
}

/**
 * Faixa de cada conexão de volta, a partir das posições salvas. Voltas só se sobrepõem
 * quando saem do mesmo bloco ou chegam no mesmo bloco: nesses casos cada uma ganha uma
 * faixa; uma volta sozinha fica na faixa 0, rente aos blocos. Conexões para a frente não entram.
 */
export function assignBackEdgeLanes(
  edges: { id: string; sourceNode: string; targetNode: string }[],
  positions: Record<string, Point | undefined>,
  nodeWidth = NODE_WIDTH
): Record<string, number> {
  const backward = edges
    .filter(e => {
      const source = positions[e.sourceNode];
      const target = positions[e.targetNode];
      // Saída na borda direita da origem; entrada na borda esquerda do destino
      return !!source && !!target && isBackward(source.x + nodeWidth, target.x);
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const fromSource: Record<string, number> = {};
  const intoTarget: Record<string, number> = {};
  const lanes: Record<string, number> = {};
  for (const edge of backward) {
    const bySource = fromSource[edge.sourceNode] ?? 0;
    const byTarget = intoTarget[edge.targetNode] ?? 0;
    lanes[edge.id] = Math.min(Math.max(bySource, byTarget), MAX_LANES - 1);
    fromSource[edge.sourceNode] = bySource + 1;
    intoTarget[edge.targetNode] = byTarget + 1;
  }
  return lanes;
}

/** Destaque da conexão quando há um bloco selecionado. */
export type EdgeEmphasis = 'normal' | 'highlight' | 'dim';

/** Dados que o canvas passa para cada conexão do Vue Flow. */
export interface FlowEdgeData {
  color: string | undefined;
  lane: number;
  emphasis: EdgeEmphasis;
}
