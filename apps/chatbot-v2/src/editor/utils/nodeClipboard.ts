import { ref } from 'vue';
import type { ChatNode, NodeType } from '../../shared/types/chatbot';
import { NODE_CONFIG } from './nodeConfig';

/**
 * Bloco copiado (Ctrl+C / "Copiar"), guardado no armazenamento local do navegador:
 * vale para outro projeto e outra aba, só neste navegador. Não vai para o JSON nem para o servidor.
 * O armazenamento pode estar indisponível (janela privada, bloqueio): aí copiar não tem efeito.
 */
const STORAGE_KEY = 'clic.novelo.copiedNode';

interface CopiedNode { app: 'novelo'; version: 1; node: ChatNode }

function isKnownType(type: unknown): type is NodeType {
  return typeof type === 'string' && type in NODE_CONFIG && type !== 'start';
}

export function readCopiedNode(): ChatNode | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<CopiedNode>;
    const node = data?.node;
    if (data?.app !== 'novelo' || !node || !isKnownType(node.type) || typeof node.data !== 'object' || !node.data) return null;
    return node;
  } catch {
    return null;
  }
}

/** Há um bloco para colar (atualiza também quando outra aba copia). */
export const hasCopiedNode = ref(readCopiedNode() !== null);

export function copyNode(node: ChatNode): boolean {
  if (node.type === 'start') return false;
  try {
    const payload: CopiedNode = { app: 'novelo', version: 1, node: JSON.parse(JSON.stringify(node)) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    hasCopiedNode.value = true;
    return true;
  } catch {
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) hasCopiedNode.value = readCopiedNode() !== null;
  });
}
