import type { ClicAsset } from '@clic/shared';

/**
 * CONFIGURAÇÃO DO AMBIENTE
 * Define as regras do "mundo" da tartaruga/emoji e a biblioteca ativa.
 */
export interface ProjectConfig {
  libraryId: string | null;
  gridWidth: number;
  gridHeight: number;
  startX?: number;
  startY?: number;
  targetCells?: Record<string, string>;
  tutorialSavedWorkspaces?: Record<number, any>;
  activeChallengeIndex?: number;
}

/**
 * PROJETO EMOJI CODER: O arquivo salvo (JSON Limpo)
 */
export interface EmojiProject {
  title: string;
  meta: {
    id: string;
    name: string;
    version: string;
    createdAt: string;
    updatedAt: string;
  };
  config: ProjectConfig;
  blocksWorkspace: any;               // O estado visual dos blocos (Blockly JSON)
  compiledAST: any[];                 // A lista de comandos gerados para a tartaruga executar
  assets: Record<string, ClicAsset>;  // Para futuros fundos de tela (Backgrounds) customizados
}