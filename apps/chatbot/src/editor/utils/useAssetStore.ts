import { useSharedAssetStore } from '@clic/shared';
import { useProjectStore } from '@/shared/stores/projectStore';

// Criamos uma instância do store compartilhado, configurada especificamente para as regras do Chatbot
export const assetStore = useSharedAssetStore({
  appName: 'chatbot',
  getAssets: () => useProjectStore().document.assets,
  isAssetUsed: (assetId, excludeElementId) => {
    return useProjectStore().document.blocks.some(block => {
      if (excludeElementId && block.id === excludeElementId) return false;
      return block.assetId === assetId;
    });
  }
});

// Wrapper para manter a mesma assinatura (compatibilidade com o app atual)
export function useAssetStore() {
  return {
    ...assetStore,
    // Fixamos as opções de upload padrão do Chatbot
    addAssetFile: (file: File) => assetStore.addAssetFile(file, {
      maxSizeMB: 2,
      allowedMimeTypes:['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      compressImages: true
    })
  };
}