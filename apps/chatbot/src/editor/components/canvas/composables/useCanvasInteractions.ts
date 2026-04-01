/**
 * COMPOSABLE: INTERAÇÕES DO CANVAS
 * 
 * Coordena todas as interações de mouse/touch e teclado no canvas.
 * Gerencia arraste de blocos, cursor tracking, e eventos.
 */

import { ref, type Ref } from 'vue';
import type { Block } from '@/shared/types/chatbot';
import { useProjectStore } from '@/shared/stores/projectStore';

export interface UseCanvasInteractionsOptions {
  canvasRef: Ref<HTMLDivElement | null>;
  panOffset: Ref<{ x: number; y: number }>;
  zoom: Ref<number>;
  blocks: Ref<Block[]>;
}

export function useCanvasInteractions(options: UseCanvasInteractionsOptions) {
  const { canvasRef, panOffset, zoom, blocks } = options;
  const store = useProjectStore();

  const mousePosition = ref({ x: 0, y: 0 });
  const draggedBlock = ref<string | null>(null);
  const dragStart = ref({ x: 0, y: 0, blockX: 0, blockY: 0 });

  // Guardamos o último pixel calculado para fazer o commit final
  const lastDragPos = ref({ x: 0, y: 0 });

  function screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const rect = canvasRef.value?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const zoomScale = zoom.value / 100;
    return {
      x: (clientX - rect.left - panOffset.value.x) / zoomScale,
      y: (clientY - rect.top - panOffset.value.y) / zoomScale
    };
  }

  function updateMousePosition(clientX: number, clientY: number) {
    mousePosition.value = screenToWorld(clientX, clientY);
  }

  function startBlockDrag(blockId: string, clientX: number, clientY: number) {
    draggedBlock.value = blockId;
    const block = blocks.value.find(b => b.id === blockId);
    if (block) {
      // RESET DE SEGURANÇA: Inicializa o rastro com a posição atual do bloco
      lastDragPos.value = { x: block.position.x, y: block.position.y };
      
      dragStart.value = {
        x: clientX, y: clientY, blockX: block.position.x, blockY: block.position.y
      };
    }
  }

  function updateBlockDrag(clientX: number, clientY: number) {
    if (!draggedBlock.value) return;

    const zoomScale = zoom.value / 100;
    const dx = (clientX - dragStart.value.x) / zoomScale;
    const dy = (clientY - dragStart.value.y) / zoomScale;

    const newX = dragStart.value.blockX + dx;
    const newY = dragStart.value.blockY + dy;

    lastDragPos.value = { x: newX, y: newY };

    // 60 FPS FIX: Move o bloco na tela silenciosamente (Sem Histórico)
    store.updateBlockPositionSilent(draggedBlock.value, newX, newY);
  }

  function endBlockDrag() {
    if (draggedBlock.value) {
      // COMMIT DO HISTÓRICO: Salva o Undo/Redo apenas na hora de soltar o mouse!
      store.commitBlockMove(draggedBlock.value, lastDragPos.value.x, lastDragPos.value.y);
    }
    draggedBlock.value = null;
  }

  function isDraggingBlock(): boolean { return draggedBlock.value !== null; }

  return {
    // Estado
    mousePosition,
    draggedBlock,
    
    // Métodos
    updateMousePosition,
    startBlockDrag,
    updateBlockDrag,
    endBlockDrag,
    isDraggingBlock,
    screenToWorld
  };
}
