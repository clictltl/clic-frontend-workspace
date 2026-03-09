import { useSharedAssetStore } from '@clic/shared';
import { useProjectStore } from './projectStore';

// Criamos a instância configurada especificamente para o Graph Builder
export const assetStore = useSharedAssetStore({
  appName: 'graph-builder',
  
  // Callback para o motor ler os assets atuais do projeto
  getAssets: () => {
    // Pegamos a instância do Pinia de forma reativa no momento da chamada
    const projectStore = useProjectStore();
    return projectStore.project.assets || {};
  },
  
  // Callback para o motor saber se pode deletar um arquivo
  isAssetUsed: (_assetId, _excludeElementId) => {
    // Como o texto vive no JSON e ainda não temos imagens,
    // nenhum asset está "em uso" por padrão neste momento.
    // FUTURO: Quando os nós tiverem imagens, faremos a checagem aqui!
    // Ex: return useProjectStore().project.nodes.some(n => n.imageId === assetId);
    return false;
  }
});