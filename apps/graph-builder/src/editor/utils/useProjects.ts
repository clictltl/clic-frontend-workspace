import { createSharedProjects } from '@clic/shared';
import { useProjectStore } from '@/shared/stores/projectStore';
import { assetStore } from '@/shared/stores/assetStore';

const sharedProjectsInstance = createSharedProjects({
  appSlug: 'graph-builder',
  getProjectData: () => useProjectStore().project,
  setProjectData: (data: any, markAsUnsaved?: boolean) => useProjectStore().loadProject(data, markAsUnsaved),
  markAsSaved: () => useProjectStore().markAsSaved(),
  assetStore
});

export function useProjects() {
  return sharedProjectsInstance;
}