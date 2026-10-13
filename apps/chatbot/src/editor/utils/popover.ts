import { nextTick, onMounted, ref, watch, type Ref } from 'vue';

const GAP = 8;

/**
 * Posiciona um popover `position: fixed` junto a um elemento, sempre dentro da tela:
 * abre abaixo (alinhado à direita do âncora); se não couber, abre acima.
 */
export function placePopover(anchor: DOMRect, size: { width: number; height: number }) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = anchor.bottom + GAP;
  const fitsBelow = top + size.height <= vh - GAP;
  const fitsAbove = anchor.top - GAP - size.height >= GAP;
  if (!fitsBelow && fitsAbove) top = anchor.top - GAP - size.height;
  top = Math.max(GAP, Math.min(top, vh - size.height - GAP));

  const left = Math.max(GAP, Math.min(anchor.right - size.width, vw - size.width - GAP));

  return { top: `${top}px`, left: `${left}px` };
}

/**
 * Menu aberto num ponto (clique direito, toque longo): canto superior esquerdo no ponto,
 * ou centralizado acima dele (`above`). Se não couber, vira para o outro lado e, por fim,
 * encosta na borda da tela.
 */
export function placeMenuAtPoint(
  point: { x: number; y: number },
  size: { width: number; height: number },
  placement: 'point' | 'above' = 'point'
) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left: number;
  let top: number;

  if (placement === 'above') {
    left = point.x - size.width / 2;
    top = point.y - size.height - GAP;
    if (top < GAP) top = point.y + GAP; // Sem espaço em cima: abre embaixo
  } else {
    left = point.x + size.width > vw - GAP ? point.x - size.width : point.x;
    top = point.y + size.height > vh - GAP ? point.y - size.height : point.y;
  }

  left = Math.max(GAP, Math.min(left, vw - size.width - GAP));
  top = Math.max(GAP, Math.min(top, vh - size.height - GAP));
  return { top: `${top}px`, left: `${left}px` };
}

/**
 * Estilo `position: fixed` de um menu que se mede depois de montado e se encaixa na tela.
 * Fica invisível até a primeira medida, para não "piscar" fora do lugar.
 */
export function useMenuPosition(
  menu: Ref<HTMLElement | null>,
  point: () => { x: number; y: number },
  placement: 'point' | 'above' = 'point'
) {
  const style = ref<Record<string, string>>({ top: `${point().y}px`, left: `${point().x}px`, visibility: 'hidden' });

  async function update() {
    await nextTick();
    if (!menu.value) return;
    const { width, height } = menu.value.getBoundingClientRect();
    style.value = { ...placeMenuAtPoint(point(), { width, height }, placement), visibility: 'visible' };
  }

  onMounted(update);
  watch(point, update);
  return style;
}
