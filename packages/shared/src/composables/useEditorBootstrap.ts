import { onMounted, onUnmounted, ref } from 'vue';
import { i18n } from '../i18n';
import { useToast } from '../ui/useToast';
import type { createSharedProjects } from '../utils/useSharedProjects';

export interface EditorBootstrapOptions {
  projects: ReturnType<typeof createSharedProjects>;
  hasUnsavedChanges: () => boolean;
  /**
   * Chamado quando o editor abre sem link (share/remix/preview).
   * Normalmente cria um projeto novo; apps com roteamento próprio podem tratar aqui.
   */
  onFreshStart?: () => void;
}

/**
 * Inicialização comum dos editores do CLIC:
 * 1. Abre projetos por link (`?share=`, `?remix=`, `?preview=`).
 * 2. Avisa antes de fechar a aba com alterações não salvas.
 * O login não recarrega a página (ver `AuthMenu`), então não há estado a restaurar.
 * Devolve o estado do aviso de link inválido.
 */
export function useEditorBootstrap(options: EditorBootstrapOptions) {
  const { projects } = options;
  const toast = useToast();
  const showInvalidShareModal = ref(false);

  async function openFromLink(): Promise<boolean> {
    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get('share');
    const remixToken = params.get('remix');
    const previewId = params.get('preview');
    if (!shareToken && !remixToken && !previewId) return false;

    if (shareToken || remixToken) {
      const success = shareToken
        ? await projects.loadSharedProject(shareToken)
        : await projects.loadRemixProject(remixToken!);
      if (!success) showInvalidShareModal.value = true;
    } else {
      const success = await projects.loadPreviewProject(previewId!);
      if (!success) toast.error(i18n.global.t('messages.preview_denied'));
    }

    window.history.replaceState({}, document.title, window.location.pathname);
    return true;
  }

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (!options.hasUnsavedChanges()) return;
    e.preventDefault();
    // @ts-ignore: propriedade depreciada, mas exigida pelo Chrome para exibir o aviso
    e.returnValue = '';
    return '';
  };

  onMounted(async () => {
    const openedFromLink = await openFromLink();
    if (!openedFromLink) options.onFreshStart?.();

    window.addEventListener('beforeunload', handleBeforeUnload);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  return { showInvalidShareModal };
}
