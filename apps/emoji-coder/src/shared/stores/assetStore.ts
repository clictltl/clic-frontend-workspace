import { useSharedAssetStore } from '@clic/shared';
import { useProjectStore } from './projectStore';

// Criamos a instância configurada especificamente para o Emoji Coder
export const assetStore = useSharedAssetStore({
  appName: 'emoji-coder',
  
  // Callback para o motor ler os assets atuais do projeto
  getAssets: () => {
    // Pegamos a instância do Pinia de forma reativa no momento da chamada
    const projectStore = useProjectStore();
    return projectStore.project.assets || {};
  },
  
  // Callback para o motor saber se pode deletar um arquivo
  isAssetUsed: (_assetId, _excludeElementId) => {
    // Como ainda não temos upload de imagens/assets customizados,
    // nenhum asset está "em uso" por padrão neste momento.
    // FUTURO: Quando suportarmos fundos de tela customizados, checaremos aqui!
    // Ex: return useProjectStore().project.config.backgroundId === _assetId;
    return false;
  }
});