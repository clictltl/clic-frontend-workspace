import * as Blockly from 'blockly/core';
import type { BlockLibrary, TranslateFn } from './types';
import { walkAST } from './ASTBuilder';

import { turtleGrade4 } from './turtle-grade-4';

const libraries: Record<string, BlockLibrary> = {
  'turtle-grade-4': turtleGrade4
};

export function loadLibrary(libraryId: string, t: TranslateFn): BlockLibrary {
  const lib = libraries[libraryId];
  if (!lib) throw new Error(`Library ${libraryId} not found`);
  
  lib.registerBlocks(t);
  lib.registerParsers();
  
  return lib;
}

export function compileWorkspaceToAST(workspace: Blockly.Workspace): any[] {
  const startBlock = workspace.getTopBlocks(true).find(b => b.type === 'start');
  if (!startBlock) return [];
  
  const firstActionBlock = startBlock.getNextBlock();
  if (!firstActionBlock) return [];

  return walkAST(firstActionBlock);
}