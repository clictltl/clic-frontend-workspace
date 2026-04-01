/**
 * COMPOSABLE: GERENCIAMENTO DE CONEXÕES
 * 
 * Responsável por criar, deletar e selecionar conexões.
 * Gerencia também a conexão temporária durante o arraste.
 */

import { ref } from 'vue';
import { getConnectionPath } from '../utils/pathCalculations';
import { useProjectStore } from '@/shared/stores/projectStore';

export function useConnectionManager() {
  const store = useProjectStore();

  const connectingFrom = ref<{ blockId: string; outputId?: string; element: HTMLElement } | null>(null);
  const tempConnectionPath = ref<string>('');
  const selectedConnectionId = ref<string | null>(null);

  function startConnection(blockId: string, outputId?: string) {
    const handleId = outputId ? `${blockId}-output-${outputId}` : `${blockId}-output`;
    const handleElement = document.querySelector(`[data-handle-id="${handleId}"]`) as HTMLElement;
    if (!handleElement) return;

    connectingFrom.value = { blockId, outputId, element: handleElement };
  }

  function cancelConnection() {
    connectingFrom.value = null;
    tempConnectionPath.value = '';
  }

  function updateTempConnection(mouseX: number, mouseY: number, getHandlePosition: (el: HTMLElement) => { x: number; y: number }) {
    if (!connectingFrom.value) { tempConnectionPath.value = ''; return; }
    const fromPos = getHandlePosition(connectingFrom.value.element);
    tempConnectionPath.value = getConnectionPath(fromPos.x, fromPos.y, mouseX, mouseY);
  }

  function finishConnection(toBlockId: string) {
    if (!connectingFrom.value || connectingFrom.value.blockId === toBlockId) {
      cancelConnection();
      return;
    }
    
    store.createConnection(connectingFrom.value.blockId, connectingFrom.value.outputId, toBlockId);
    cancelConnection();
  }

  function selectConnection(connectionId: string) { selectedConnectionId.value = connectionId; }
  function deselectConnection() { selectedConnectionId.value = null; }

  function deleteSelectedConnection() {
    if (!selectedConnectionId.value) return;
    deleteConnection(selectedConnectionId.value);
  }

  function deleteConnection(connectionId: string) {
    store.deleteConnection(connectionId); // Delega para a Store
    if (selectedConnectionId.value === connectionId) {
      selectedConnectionId.value = null;
    }
  }

  return {
    // Estado
    connectingFrom,
    tempConnectionPath,
    selectedConnectionId,
    
    // Métodos
    startConnection,
    cancelConnection,
    updateTempConnection,
    finishConnection,
    selectConnection,
    deselectConnection,
    deleteSelectedConnection,
    deleteConnection
  };
}
