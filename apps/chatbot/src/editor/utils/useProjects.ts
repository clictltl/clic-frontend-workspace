import { createSharedProjects } from '@clic/shared';
import { useProjectStore } from '@/shared/stores/projectStore';
import { assetStore } from './useAssetStore';

const sharedProjectsInstance = createSharedProjects({
  appSlug: 'chatbot',
  getProjectData: () => useProjectStore().getProjectData(),
  setProjectData: (data: any, markAsUnsaved?: boolean) => useProjectStore().setProjectData(data, markAsUnsaved),
  markAsSaved: () => useProjectStore().markAsSaved(),
  assetStore
});

export function useProjects() {
  return sharedProjectsInstance;
}