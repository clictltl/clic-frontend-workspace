import { ref } from 'vue';

/**
 * Blocos destacados no canvas a partir do painel de variáveis ("usada em N blocos"):
 * ajuda a investigar onde a variável aparece. Estado de UI, fora do JSON.
 */
export const highlightedVariableId = ref<string | null>(null);
export const highlightedNodeIds = ref<string[]>([]);

export function highlightBlocks(variableId: string | null, nodeIds: string[] = []) {
  highlightedVariableId.value = variableId;
  highlightedNodeIds.value = variableId ? nodeIds : [];
}

export function clearHighlight() {
  highlightBlocks(null);
}
