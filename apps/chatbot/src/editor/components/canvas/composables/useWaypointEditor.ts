/**
 * COMPOSABLE: EDITOR DE WAYPOINTS
 * 
 * Responsável por criar e editar waypoints em conexões.
 * Permite arrastar segmentos para criar novos waypoints e mover waypoints existentes.
 */

import { ref, type Ref } from 'vue';
import type { Connection } from '@/shared/types/chatbot';
import { useProjectStore } from '@/shared/stores/projectStore';

export interface UseWaypointEditorOptions {
  canvasRef: Ref<HTMLDivElement | null>;
  panOffset: Ref<{ x: number; y: number }>;
  zoom: Ref<number>;
  connections: Ref<Connection[]>;
  onSelectConnection: (id: string) => void;
}

export function useWaypointEditor(options: UseWaypointEditorOptions) {
  const { canvasRef, panOffset, zoom, connections, onSelectConnection } = options;
  const store = useProjectStore();

  const draggingWaypoint = ref<{ connectionId: string; waypointIndex: number } | null>(null);
  const draggingSegment = ref<{ connectionId: string; segmentIndex: number; startPos: { x: number; y: number } } | null>(null);

  function screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const canvasBounds = canvasRef.value?.getBoundingClientRect();
    if (!canvasBounds) return { x: 0, y: 0 };
    const zoomScale = zoom.value / 100;
    return {
      x: (clientX - canvasBounds.left - panOffset.value.x) / zoomScale,
      y: (clientY - canvasBounds.top - panOffset.value.y) / zoomScale
    };
  }

  function startDragSegment(connectionId: string, segmentIndex: number, clientX: number, clientY: number) {
    draggingSegment.value = { connectionId, segmentIndex, startPos: screenToWorld(clientX, clientY) };
    onSelectConnection(connectionId);
  }

  function startDragWaypoint(connectionId: string, waypointIndex: number) {
    draggingWaypoint.value = { connectionId, waypointIndex };
  }

  function updateDrag(clientX: number, clientY: number) {
    if (!draggingSegment.value && !draggingWaypoint.value) return;

    const currentPos = screenToWorld(clientX, clientY);
    let updatedConnections =[...connections.value];

    if (draggingSegment.value) {
      const { connectionId, segmentIndex } = draggingSegment.value;
      updatedConnections = connections.value.map(c => {
        if (c.id !== connectionId) return c;
        const waypoints = c.waypoints ? [...c.waypoints] :[];
        waypoints.splice(segmentIndex, 0, currentPos);
        return { ...c, waypoints };
      });

      draggingWaypoint.value = { connectionId, waypointIndex: segmentIndex };
      draggingSegment.value = null;
    } else if (draggingWaypoint.value) {
      const { connectionId, waypointIndex } = draggingWaypoint.value;
      updatedConnections = connections.value.map(c => {
        if (c.id !== connectionId) return c;
        const waypoints = c.waypoints ?[...c.waypoints] : [];
        waypoints[waypointIndex] = currentPos;
        return { ...c, waypoints };
      });
    }

    // 60 FPS FIX: Atualiza silenciosamente na Store
    store.updateConnectionSilent(updatedConnections);
  }

  function endDrag() {
    if (draggingSegment.value || draggingWaypoint.value) {
      // COMMIT DO HISTÓRICO: Salva a rota final oficial
      store.updateConnection(store.document.connections);
    }
    draggingSegment.value = null;
    draggingWaypoint.value = null;
  }

  function isDragging(): boolean { return draggingSegment.value !== null || draggingWaypoint.value !== null; }

  return {
    // Estado
    draggingWaypoint,
    draggingSegment,
    
    // Métodos
    startDragSegment,
    startDragWaypoint,
    updateDrag,
    endDrag,
    isDragging
  };
}
