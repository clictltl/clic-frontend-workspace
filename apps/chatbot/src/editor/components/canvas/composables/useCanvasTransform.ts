/**
 * COMPOSABLE: TRANSFORMAÇÕES DO CANVAS
 * 
 * Responsável por gerenciar pan (arraste) e zoom do canvas.
 * Inclui zoom ancorado no mouse, centro e toques (Pinch).
 */

import { ref, type Ref } from 'vue';

export interface UseCanvasTransformOptions {
  canvasRef: Ref<HTMLDivElement | null>;
  initialZoom?: number;
}

export function useCanvasTransform(options: UseCanvasTransformOptions) {
  const { canvasRef, initialZoom = 100 } = options;

  // Estado do pan
  const panOffset = ref({ x: 0, y: 0 });
  const isPanning = ref(false);
  const panStart = ref({ x: 0, y: 0 });

  // Estado do zoom
  const zoom = ref(initialZoom);
  const lastZoom = ref(initialZoom);
  const wheelZoomAnchor = ref<{ x: number; y: number } | null>(null);

  // Estado da pinça (Touch)
  const initialPinchDistance = ref<number | null>(null);
  const initialPinchZoom = ref(initialZoom);
  const pinchCenter = ref<{ x: number; y: number } | null>(null);

  /**
   * Ajusta panOffset para que o ponto do "mundo" sob (anchorClientX/Y) fique fixo na tela,
   * mesmo mudando o zoom.
   */
  function keepPointUnderAnchor(
    oldZoomPct: number,
    newZoomPct: number,
    anchorClientX: number,
    anchorClientY: number
  ) {
    const rect = canvasRef.value?.getBoundingClientRect();
    if (!rect) return;

    const oldZoom = oldZoomPct / 100;
    const newZoom = newZoomPct / 100;

    // Posição da âncora em coordenadas do canvas (tela, relativa ao canvas)
    const ax = anchorClientX - rect.left;
    const ay = anchorClientY - rect.top;

    // Coordenadas do "mundo" (antes do zoom) que estavam sob a âncora
    const worldX = (ax - panOffset.value.x) / oldZoom;
    const worldY = (ay - panOffset.value.y) / oldZoom;

    // Atualiza panOffset para manter worldX/worldY sob a mesma âncora após o zoom
    panOffset.value = {
      x: ax - worldX * newZoom,
      y: ay - worldY * newZoom
    };
  }

  /**
   * Aumenta o zoom em 10%
   */
  function zoomIn() {
    const newZoom = Math.min(150, zoom.value + 10);
    
    // Ancora no centro do canvas
    const rect = canvasRef.value?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      keepPointUnderAnchor(zoom.value, newZoom, centerX, centerY);
    }
    
    zoom.value = newZoom;
    lastZoom.value = newZoom;
  }

  /**
   * Diminui o zoom em 10%
   */
  function zoomOut() {
    const newZoom = Math.max(25, zoom.value - 10);
    
    // Ancora no centro do canvas
    const rect = canvasRef.value?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      keepPointUnderAnchor(zoom.value, newZoom, centerX, centerY);
    }
    
    zoom.value = newZoom;
    lastZoom.value = newZoom;
  }

  /**
   * Define o zoom para um valor específico (usado pelo slider externo)
   */
  function setZoom(newZoom: number) {
    // Se o zoom foi acionado pelo Ctrl+Wheel: ancora no mouse
    if (wheelZoomAnchor.value) {
      keepPointUnderAnchor(zoom.value, newZoom, wheelZoomAnchor.value.x, wheelZoomAnchor.value.y);
      wheelZoomAnchor.value = null;
      zoom.value = newZoom;
      lastZoom.value = newZoom;
      return;
    }

    // Caso contrário (slider/toolbar/etc): ancora no centro do canvas
    const rect = canvasRef.value?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      keepPointUnderAnchor(zoom.value, newZoom, centerX, centerY);
    }
    
    zoom.value = newZoom;
    lastZoom.value = newZoom;
  }

  /**
   * Handler para zoom com Ctrl + Wheel
   */
  function handleWheel(event: WheelEvent) {
    if (isPanning.value) return;

    event.preventDefault();

    // deltaY > 0 geralmente = scroll pra baixo (zoom out)
    const delta = -event.deltaY * 0.1;
    const newZoom = Math.max(25, Math.min(150, zoom.value + delta));

    // Ancora no mouse
    wheelZoomAnchor.value = { x: event.clientX, y: event.clientY };
    setZoom(newZoom);
  }

  /**
   * Inicia o pan do canvas
   */
  function startPan(clientX: number, clientY: number) {
    isPanning.value = true;
    panStart.value = { x: clientX, y: clientY };
  }

  /**
   * Atualiza a posição durante o pan
   */
  function updatePan(clientX: number, clientY: number) {
    if (!isPanning.value) return;

    const dx = clientX - panStart.value.x;
    const dy = clientY - panStart.value.y;
    
    panOffset.value = {
      x: panOffset.value.x + dx,
      y: panOffset.value.y + dy
    };
    
    panStart.value = { x: clientX, y: clientY };
  }

  /**
   * Finaliza o pan
   */
  function endPan() {
    isPanning.value = false;
  }

  // --- MÉTODOS DE PINÇA (TOUCH) ---
  function getPinchDistance(touches: TouchList) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getPinchCenter(touches: TouchList) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  }

  function startPinch(touches: TouchList) {
    if (touches.length !== 2) return;
    initialPinchDistance.value = getPinchDistance(touches);
    initialPinchZoom.value = zoom.value;
    pinchCenter.value = getPinchCenter(touches);
    isPanning.value = false; // Cancela pan normal durante pinça
  }

  function updatePinch(touches: TouchList) {
    if (touches.length !== 2 || !initialPinchDistance.value || !pinchCenter.value) return;

    const currentDistance = getPinchDistance(touches);
    const currentCenter = getPinchCenter(touches);

    const scale = currentDistance / initialPinchDistance.value;
    const newZoom = Math.max(25, Math.min(150, initialPinchZoom.value * scale));

    // Aplica Zoom ancorado no centro da pinça
    keepPointUnderAnchor(zoom.value, newZoom, currentCenter.x, currentCenter.y);
    zoom.value = newZoom;
    lastZoom.value = newZoom;

    // Aplica Arrastar (Pan) junto com a pinça
    const dx = currentCenter.x - pinchCenter.value.x;
    const dy = currentCenter.y - pinchCenter.value.y;
    
    panOffset.value = {
      x: panOffset.value.x + dx,
      y: panOffset.value.y + dy
    };

    // Atualiza estado para o próximo frame de touchmove
    initialPinchDistance.value = currentDistance;
    initialPinchZoom.value = newZoom;
    pinchCenter.value = currentCenter;
  }

  function endPinch() {
    initialPinchDistance.value = null;
    pinchCenter.value = null;
  }

  /**
   * Obtém a posição do centro do canvas em coordenadas do mundo
   */
  function getCanvasCenterWorldPosition(): { x: number; y: number } {
    const rect = canvasRef.value?.getBoundingClientRect();
    if (!rect) return { x: 120, y: 120 };

    const zoomScale = zoom.value / 100;
    
    // Centro da área visível (tela -> mundo)
    const x = (rect.width / 2 - panOffset.value.x) / zoomScale;
    const y = (rect.height / 2 - panOffset.value.y) / zoomScale;

    return { x, y };
  }

  return {
    // Estado
    panOffset,
    isPanning,
    zoom,
    
    // Métodos de zoom
    zoomIn,
    zoomOut,
    setZoom,
    handleWheel,
    
    // Métodos de pan
    startPan,
    updatePan,
    endPan,

    // Métodos de pinça
    startPinch,
    updatePinch,
    endPinch,
    
    // Utilidades
    getCanvasCenterWorldPosition
  };
}
