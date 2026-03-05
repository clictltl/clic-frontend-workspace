export type AssetSource = 'local' | 'remote';

export interface ClicAsset {
  id: string;
  type: string;         // MIME Type real do arquivo (ex: image/png, text/markdown)
  originalName: string; // Nome original para exibição
  size: number;         // Tamanho em bytes
  hash: string;         // SHA-256 para evitar arquivos duplicados
  source: AssetSource;
  url?: string;         // URL pública quando hospedado no WordPress
  externalId?: number;  // ID do anexo no banco de dados do WordPress
}