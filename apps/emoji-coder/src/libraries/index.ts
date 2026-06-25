import * as Blockly from 'blockly/core';
import type { BlockLibrary } from './types';
import { walkAST } from './ASTBuilder';

import { turtleGrade4 } from './turtle-grade-4';
import { turtleGrade4Advanced } from './turtle-grade-4-advanced';
import { turtleGrade5 } from './turtle-grade-5';
import { turtleTutorial4 } from './turtle-tutorial-4';
import { turtleTutorial5 } from './turtle-tutorial-5';
import { turtleAdvanced } from './turtle-advanced';

const libraries: Record<string, BlockLibrary> = {
  'turtle-grade-4': turtleGrade4,
  'turtle-grade-4-advanced': turtleGrade4Advanced,
  'turtle-grade-5': turtleGrade5,
  'turtle-tutorial-4': turtleTutorial4,
  'turtle-tutorial-5': turtleTutorial5,
  'turtle-advanced': turtleAdvanced
};

export function getLibrary(libraryId: string): BlockLibrary {
  const lib = libraries[libraryId];
  if (!lib) throw new Error(`Library ${libraryId} not found`);
  return lib;
}

export function compileWorkspaceToAST(workspace: Blockly.Workspace): any[] {
  const topBlocks = workspace.getTopBlocks(true);
  const ast: any[] = [];

  // 1. Extrai todas as árvores soltas que NÃO são o fluxo principal
  const floatingBlocks = topBlocks.filter(b => b.type !== 'start');
  
  for (const block of floatingBlocks) {
    const nodes = walkAST(block);
    // Delegação de Responsabilidade: O Blockly não sabe o que é função. O AST sabe!
    // Se o nó raiz resultante for uma definição, nós salvamos.
    // Blocos de ação soltos no quadro (lixo) serão sumariamente ignorados.
    if (nodes.length > 0 && nodes[0].isDefinition) {
      ast.push(...nodes); 
    }
  }

  // 2. Extrai o Fluxo Principal do Start
  const startBlock = topBlocks.find(b => b.type === 'start');
  if (startBlock) {
    const firstActionBlock = startBlock.getNextBlock();
    if (firstActionBlock) {
      const nodes = walkAST(firstActionBlock);
      ast.push(...nodes);
    }
  }

  return ast;
}