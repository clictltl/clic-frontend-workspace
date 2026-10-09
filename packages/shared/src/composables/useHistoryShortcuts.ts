import { onMounted, onUnmounted } from 'vue';
import { useToast } from '../ui/useToast';
import { i18n } from '../i18n';

/**
 * Desfazer/refazer com o aviso "Desfez: …" / "Refez: …".
 * Usado pelos atalhos de teclado e pelos botões visíveis, para os dois se comportarem igual.
 * @param store A store do Pinia que já possui o piniaInteractionHistoryPlugin configurado.
 */
export function useHistoryActions(store: any) {
  const toast = useToast();
  const t = i18n.global.t;

  function undo() {
    if (!store.canUndo) return;
    const actionLabel = store.undo();
    toast.info(`${t('global.undo')}: ${t(actionLabel)}`);
  }

  function redo() {
    if (!store.canRedo) return;
    const actionLabel = store.redo();
    toast.info(`${t('global.redo')}: ${t(actionLabel)}`);
  }

  return { undo, redo };
}

/**
 * Injeta os atalhos de teclado de Undo/Redo (Ctrl+Z / Ctrl+Shift+Z) no ciclo de vida do componente.
 * @param store A store do Pinia que já possui o piniaInteractionHistoryPlugin configurado.
 */
export function useHistoryShortcuts(store: any) {
  const { undo, redo } = useHistoryActions(store);

  const handleKeyDown = (e: KeyboardEvent) => {
    // Ignora o atalho se o usuário estiver digitando dentro de um campo de texto
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
}
