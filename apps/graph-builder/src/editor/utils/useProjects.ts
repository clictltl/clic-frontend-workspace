import { createSharedProjects } from '@clic/shared';
import { useProjectStore } from '@/shared/stores/projectStore';
import { assetStore } from '@/shared/stores/assetStore';

// Instanciamos o motor de nuvem passando como o Graph Builder lê e salva dados no Pinia
export const projectsInstance = createSharedProjects({
  appSlug: 'graph-builder', // Nome que a API REST vai buscar (/wp-json/clic/v1/graph-builder/...)
  getProjectData: () => useProjectStore().project,
  setProjectData: (data: any) => useProjectStore().loadProject(data),
  markAsSaved: () => {
    // Futuro: se você quiser controlar alterações não salvas no Grafo, a lógica vem aqui
  },
  assetStore
});

export function useProjects() {
  return projectsInstance;
}