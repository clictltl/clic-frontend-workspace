import type { ChatbotProject } from '../../shared/types/chatbot';

/** Enquadramento de todos os blocos: com folga nas bordas e sem ampliar além de 100% (projeto pequeno não fica gigante). */
export const FIT_VIEW_OPTIONS = { padding: 0.2, maxZoom: 1 } as const;

/** Ao abrir, o zoom não desce disso: abaixo, o texto dos blocos fica ilegível para crianças. */
export const OPEN_MIN_ZOOM = 0.75;
/** Abrindo só o começo de um fluxo grande: não aproxima além disso, para mostrar um pouco do que vem depois. */
export const OPEN_SUBSET_MAX_ZOOM = 0.85;

export interface Rect { x: number; y: number; width: number; height: number }

/** Retângulo que contém todos os retângulos. */
export function boundsOf(rects: Rect[]): Rect {
  const left = Math.min(...rects.map(r => r.x));
  const top = Math.min(...rects.map(r => r.y));
  const right = Math.max(...rects.map(r => r.x + r.width));
  const bottom = Math.max(...rects.map(r => r.y + r.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

/** Zoom que faz `bounds` caber na área visível, com a mesma folga do enquadramento. */
export function zoomToFit(bounds: Rect, view: { width: number; height: number }, padding = FIT_VIEW_OPTIONS.padding): number {
  const scale = 1 + padding * 2;
  return Math.min(view.width / (bounds.width * scale), view.height / (bounds.height * scale));
}

/** IDs dos blocos na ordem da conversa (busca em largura a partir do Início). */
export function flowOrder(project: ChatbotProject): string[] {
  const start = Object.values(project.nodes).find(n => n.type === 'start');
  if (!start) return [];
  const order = [start.id];
  const seen = new Set(order);
  for (let i = 0; i < order.length; i++) {
    for (const edge of Object.values(project.edges)) {
      if (edge.sourceNode === order[i] && !seen.has(edge.targetNode) && project.nodes[edge.targetNode]) {
        seen.add(edge.targetNode);
        order.push(edge.targetNode);
      }
    }
  }
  return order;
}

/**
 * Blocos a enquadrar ao abrir: todos, se couberem com zoom >= OPEN_MIN_ZOOM; senão, o começo
 * da conversa (Início e os seguintes) até onde couber. Projeto sem Início: todos.
 */
export function nodesToFrameOnOpen(
  project: ChatbotProject,
  rects: Record<string, Rect>,
  view: { width: number; height: number }
): string[] | null {
  const all = Object.keys(rects);
  if (!all.length || zoomToFit(boundsOf(Object.values(rects)), view) >= OPEN_MIN_ZOOM) return null;

  const order = flowOrder(project).filter(id => rects[id]);
  const chosen: string[] = [];
  for (const id of order) {
    const next = [...chosen, id];
    if (chosen.length && zoomToFit(boundsOf(next.map(n => rects[n]!)), view) < OPEN_MIN_ZOOM) break;
    chosen.push(id);
  }
  return chosen.length ? chosen : null;
}
