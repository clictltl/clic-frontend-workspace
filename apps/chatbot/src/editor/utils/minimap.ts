import { ref } from 'vue';

/**
 * Minimapa do canvas: começa escondido (decisão de 2026-10-09) e o botão do mapa, junto ao zoom,
 * mostra e esconde. A escolha é conveniência de cada pessoa e fica no navegador.
 */
const STORAGE_KEY = 'clic-chatbot-minimap';

function readStored(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

export const showMinimap = ref(readStored());

export function toggleMinimap() {
  showMinimap.value = !showMinimap.value;
  try { localStorage.setItem(STORAGE_KEY, showMinimap.value ? '1' : '0'); } catch { /* sem armazenamento */ }
}
