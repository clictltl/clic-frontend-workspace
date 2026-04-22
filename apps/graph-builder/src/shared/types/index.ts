import type { ClicAsset } from '@clic/shared';

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
  formConfig?: CategoryFormConfig;
}

/**
 * CONFIGURAÇÃO DE FORMULÁRIO
 * Define as regras para preenchimento dinâmico de uma categoria via formulário público.
 */
export interface CategoryFormConfig {
  enabled: boolean;             // Se o professor quer usar formulário nesta categoria
  nameFieldLabel: string;       // A pergunta do nome (ex: "Qual seu nome?")
  targetCategories: string[];   // IDs das categorias que virarão perguntas de escolha
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
  content: string; 
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
 * PROJETO: O arquivo salvo
 */
export interface GraphProject {
  title: string;
  meta: {
    id: string;
    name: string;
    version: string;
    createdAt: string;
    updatedAt: string;
  };
  categories: Record<string, Category>;
  nodes: Record<string, Node>;
  edges: Record<string, Edge>;
  assets: Record<string, ClicAsset>;
}