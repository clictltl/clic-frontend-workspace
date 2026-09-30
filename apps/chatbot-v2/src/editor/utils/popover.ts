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
