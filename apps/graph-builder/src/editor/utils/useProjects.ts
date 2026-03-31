import { createSharedProjects } from '@clic/shared';
import { useProjectStore } from '@/shared/stores/projectStore';
import { assetStore } from '@/shared/stores/assetStore';

const sharedProjectsInstance = createSharedProjects({
  appSlug: 'graph-builder',
  getProjectData: () => useProjectStore().project,
  setProjectData: (data: any, markAsUnsaved?: boolean) => useProjectStore().loadProject(data, markAsUnsaved),
  markAsSaved: () => useProjectStore().markAsSaved(),
  assetStore,
  // Filtra e retorna apenas os IDs das categorias que possuem formulário ativo no JSON
  getActiveFormReferences: () => {
    return useProjectStore().project.categories
      .filter(c => c.formConfig?.enabled)
      .map(c => c.id);
  }
});

export function useProjects() {
  return sharedProjectsInstance;
}