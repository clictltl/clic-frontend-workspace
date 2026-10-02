import { createSharedProjects, i18n } from '@clic/shared';
import { useProjectStore } from '../../shared/stores/projectStore';
import { assetStore } from '../../shared/stores/assetStore';
import { ProjectLoadError, type ProjectLoadErrorCode } from '../../shared/domain/project';

const LOAD_ERROR_KEYS: Record<ProjectLoadErrorCode, string> = {
  INVALID_PROJECT: 'chatbot.messages.invalid_project',
  UNSUPPORTED_VERSION: 'chatbot.messages.unsupported_version'
};

/**
 * Carrega um projeto no store. Devolve a mensagem de erro traduzida se ele for recusado
 * (o projeto atual é mantido); outros erros são relançados.
 */
export function tryLoadProject(data: unknown, markAsUnsaved = false): string | null {
  try {
    useProjectStore().loadProject(data, markAsUnsaved);
    return null;
  } catch (err) {
    if (err instanceof ProjectLoadError) return i18n.global.t(LOAD_ERROR_KEYS[err.code]);
    throw err;
  }
}

const sharedProjectsInstance = createSharedProjects({
  appSlug: 'chatbot',
  getProjectData: () => useProjectStore().getProjectData(),
  // Lança erro se o JSON for recusado: o shared mantém o projeto atual (e o vínculo com a nuvem)
  setProjectData: (data: unknown, markAsUnsaved?: boolean) => {
    const rejection = tryLoadProject(data, markAsUnsaved);
    if (rejection) throw new Error(rejection);
  },
  markAsSaved: () => useProjectStore().markAsSaved(),
  assetStore
});

export function useProjects() {
  return sharedProjectsInstance;
}
