import { IMAGE_UPLOAD_OPTIONS } from '../../shared/stores/assetStore';

/**
 * Abre o seletor de arquivos do sistema e resolve com a imagem escolhida,
 * ou `null` se o usuário cancelar.
 */
export function pickImageFile(): Promise<File | null> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = IMAGE_UPLOAD_OPTIONS.allowedMimeTypes.join(',');
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null), { once: true });
    input.addEventListener('cancel', () => resolve(null), { once: true });
    input.click();
  });
}
