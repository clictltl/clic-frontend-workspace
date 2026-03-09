import { createSharedProjects } from '@clic/shared';
import { getProjectData, setProjectData, markAsSaved } from './projectData';
import { assetStore } from './useAssetStore';

const sharedProjectsInstance = createSharedProjects({
  appSlug: 'chatbot',
  getProjectData,
  setProjectData,
  markAsSaved,
  assetStore
});

export function useProjects() {
  return sharedProjectsInstance;
}