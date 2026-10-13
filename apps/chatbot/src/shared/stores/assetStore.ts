import { useSharedAssetStore } from '@clic/shared';
import { useProjectStore } from './projectStore';
import { findAssetUsages } from '../domain/usages';

// Instância do store compartilhado de assets, configurada para o Chatbot v2
export const assetStore = useSharedAssetStore({
  appName: 'chatbot',
  getAssets: () => useProjectStore().project.assets,
  isAssetUsed: (assetId, excludeElementId) =>
    findAssetUsages(useProjectStore().project, assetId).some(nodeId => nodeId !== excludeElementId)
});

/** Mesmas regras de upload de imagem do Chatbot v1. */
export const IMAGE_UPLOAD_OPTIONS = {
  maxSizeMB: 2,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  compressImages: true
};

/**
 * Valida, comprime e registra a imagem em `project.assets` (fora de uma action).
 * Quem chama deve referenciar o ID numa action logo em seguida, para o asset
 * entrar no mesmo diff/evento de telemetria do gesto do aluno.
 */
export function addImageAsset(file: File): Promise<string> {
  return assetStore.addAssetFile(file, IMAGE_UPLOAD_OPTIONS);
}
