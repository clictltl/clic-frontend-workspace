import { ref } from 'vue';

/** Bloco sob o cursor durante uma conexão (contorno de "liga aqui"). Estado de UI, fora do JSON. */
export const connectTargetNodeId = ref<string | null>(null);
