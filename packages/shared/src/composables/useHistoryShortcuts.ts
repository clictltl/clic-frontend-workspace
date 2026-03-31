import { onMounted, onUnmounted } from 'vue';
import { useToast } from '../ui/useToast';

/**
 * Injeta os atalhos de teclado de Undo/Redo (Ctrl+Z / Ctrl+Shift+Z) no ciclo de vida do componente.
 * @param store A store do Pinia que já possui o piniaInteractionHistoryPlugin configurado.
 */
export function useHistoryShortcuts(store: any) {
  const toast = useToast();

  const handleKeyDown = (e: KeyboardEvent) => {
    // Ignora o atalho se o usuário estiver digitando dentro de um campo de texto
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();

      if (e.shiftKey) {
        if (store.canRedo) {
          const actionLabel = store.redo();
          toast.info(`Refez: ${actionLabel}`);
        }
      } else {
        if (store.canUndo) {
          const actionLabel = store.undo();
          toast.info(`Desfez: ${actionLabel}`); 
        }
      }
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
}