import { computed } from 'vue';
import { createSharedProjects } from '@clic/shared';
import { useProjectStore } from '@/shared/stores/projectStore';
import { assetStore } from '@/shared/stores/assetStore';

// Instanciamos o motor de nuvem passando como o Graph Builder lê e salva dados no Pinia
export const projectsInstance = createSharedProjects({
  appSlug: 'graph-builder',
  getProjectData: () => useProjectStore().project,
  setProjectData: (data: any) => useProjectStore().loadProject(data),
  markAsSaved: () => useProjectStore().markAsSaved(),
  assetStore
});

export function useProjects() {
  const projectStore = useProjectStore();
  
  return {
    ...projectsInstance,
    // Exportamos como "computed" para manter a reatividade no Vue
    hasUnsavedChanges: computed(() => projectStore.hasUnsavedChanges)
  };
}