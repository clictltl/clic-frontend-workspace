import * as Blockly from 'blockly/core';
import type { BlockLibrary, TranslateFn } from './types';
import { walkAST } from './ASTBuilder';

import { turtleGrade4 } from './turtle-grade-4';
import { turtleGrade4Advanced } from './turtle-grade-4-advanced';
import { turtleGrade5 } from './turtle-grade-5';

const libraries: Record<string, BlockLibrary> = {
  'turtle-grade-4': turtleGrade4,
  'turtle-grade-4-advanced': turtleGrade4Advanced,
  'turtle-grade-5': turtleGrade5
};

export function loadLibrary(libraryId: string, t: TranslateFn): BlockLibrary {
  const lib = libraries[libraryId];
  if (!lib) throw new Error(`Library ${libraryId} not found`);
  
  lib.registerBlocks(t);
  lib.registerParsers();
  
  return lib;
}

export function compileWorkspaceToAST(workspace: Blockly.Workspace): any[] {
  const topBlocks = workspace.getTopBlocks(true);
  const ast: any[] = [];

  // 1. Extrai todas as Funções primeiro (Ficam no topo do AST JSON)
  const defBlocks = topBlocks.filter(b => b.type === 'procedures_defnoreturn');
  for (const block of defBlocks) {
    const nodes = walkAST(block);
    ast.push(...nodes); 
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