import { useSharedAssetStore } from '@clic/shared';
import { assets, blocks } from './projectData';

// Criamos uma instância do store compartilhado, configurada especificamente para as regras do Chatbot
export const assetStore = useSharedAssetStore({
  appName: 'chatbot',
  getAssets: () => assets.value,
  isAssetUsed: (assetId, excludeElementId) => {
    return blocks.value.some(block => {
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