import { ref } from 'vue';

/** Nó que está "falando" no teste em andamento (destacado no canvas). Estado de UI, fora do JSON. */
export const testActiveNodeId = ref<string | null>(null);
