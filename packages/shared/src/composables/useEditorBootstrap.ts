import { onMounted, onUnmounted, ref } from 'vue';
import { telemetryService } from '../analytics/telemetry';
import { i18n } from '../i18n';
import { useToast } from '../ui/useToast';
import type { createSharedProjects } from '../utils/useSharedProjects';
import type { useSharedAssetStore } from '../utils/useSharedAssetStore';

export interface EditorBootstrapOptions {
  /** Slug do app (ex.: 'chatbot'): isola o backup de login no sessionStorage. */
  appSlug: string;
  projects: ReturnType<typeof createSharedProjects>;
  assetStore: ReturnType<typeof useSharedAssetStore>;
  getProjectData: () => unknown;
  loadProject: (data: any, markAsUnsaved: boolean) => void;
  hasUnsavedChanges: () => boolean;
  markAsSaved: () => void;
  /**
   * Chamado quando o editor abre sem link (share/remix/preview) e sem backup de login.
   * Normalmente cria um projeto novo; apps com roteamento próprio podem tratar aqui.
   */
  onFreshStart?: () => void;
}

/**
 * Inicialização comum dos editores do CLIC:
 * 1. Abre projetos por link (`?share=`, `?remix=`, `?preview=`).
 * 2. Restaura o backup feito antes do login (projeto, arquivos locais e sessão de telemetria).
 * 3. Avisa antes de fechar a aba com alterações não salvas.
 * Devolve o `handleLoginSuccess` para o `AuthMenu` e o estado do aviso de link inválido.
 */
export function useEditorBootstrap(options: EditorBootstrapOptions) {
  const { appSlug, projects, assetStore } = options;
  const backupKey = `clic-${appSlug}:login-backup`;
  const toast = useToast();
  const showInvalidShareModal = ref(false);

  async function handleLoginSuccess() {
    await assetStore.persistToDisk();

    sessionStorage.setItem(backupKey, JSON.stringify({
      id: projects.currentProjectId.value,
      name: projects.currentProjectName.value,
      data: options.getProjectData(),
      wasDirty: options.hasUnsavedChanges(),
      telemetryQueue: telemetryService.getOfflineQueue(),
      telemetrySession: telemetryService.getSessionInfo()
    }));

    // Evita o aviso de perda de dados no recarregamento
    options.markAsSaved();
    window.location.reload();
  }

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

  async function restoreLoginBackup(): Promise<boolean> {
    const raw = sessionStorage.getItem(backupKey);
    if (!raw) return false;

    try {
      const saved = JSON.parse(raw);

      if (saved.telemetryQueue && saved.telemetrySession) {
        telemetryService.resumeSession(
          saved.telemetrySession.sessionId,
          saved.telemetrySession.projectUuid,
          saved.telemetrySession.appType,
          saved.telemetryQueue
        );
      }

      await assetStore.restoreFromDisk();
      options.loadProject(saved.data, !!saved.wasDirty);
      projects.currentProjectId.value = saved.id;
      projects.currentProjectName.value = saved.name || '';

      sessionStorage.removeItem(backupKey);
      await assetStore.clearDisk();
      return true;
    } catch (err) {
      // Backup inválido: descarta para não ficar preso e segue com um projeto novo
      console.error('[CLIC] Erro ao restaurar backup local:', err);
      sessionStorage.removeItem(backupKey);
      return false;
    }
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
    const restored = await restoreLoginBackup();
    if (!openedFromLink && !restored) options.onFreshStart?.();

    window.addEventListener('beforeunload', handleBeforeUnload);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  return { showInvalidShareModal, handleLoginSuccess };
}
