/**
 * ASSETS: Gerenciamento de arquivos (Imagens, PDF)
 * Referência por ID.
 */
export type AssetSource = 'local' | 'remote';

export interface Asset {
  id: string;
  type: string;         // Ex: 'image/png' ou 'text/markdown'
  originalName: string;
  source: AssetSource;
  
  url?: string;         // WP URL
  wpId?: number;
  
  blobUrl?: string;     // Preview de imagens locais
  file?: File;          // Arquivo binário (para exportação)
  
  textContent?: string; // Cache de conteúdo de texto (para não precisar ler Blob toda hora) 
}

/**
 * CATEGORIA: O agrupador visual (ex: "Introdução", "Conceitos Básicos")
 * No Editor: Uma coluna.
 * No Grafo: Define a cor dos nós.
 */
export interface Category {
  id: string;
  name: string;
  color: string;       // Ex: "#FF5733"
  order: number;       // Posição da coluna no Editor
}

/**
 * NÓ (VALUE): O conteúdo educacional.
 * No Editor: Um cartão dentro da coluna.
 * No Grafo: Uma bolinha conectada.
 */
export interface Node {
  id: string;
  categoryId: string;
  title: string;
  contentAssetId?: string; 
  order: number;
}

/**
 * ARESTA (CONNECTION): A relação entre dois conceitos.
 */
export interface Edge {
  id: string;
  source: string;      // ID do Node de origem
  target: string;      // ID do Node de destino
}

/**
 * PROJETO: O arquivo salvo (.json)
 */
export interface GraphProject {
  meta: {
    id: string;
    name: string;
    version: string;
    createdAt: string;
    updatedAt: string;
  };
  categories: Category[];
  nodes: Node[];
  edges: Edge[];
  assets: Record<string, Asset>;
}