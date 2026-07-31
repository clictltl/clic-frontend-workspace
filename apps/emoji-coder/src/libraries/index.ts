import * as Blockly from 'blockly/core';
import type { BlockLibrary } from './types';
import { walkAST } from './ASTBuilder';

import { libAbsMovSandbox } from './abs-mov-sandbox';
import { libRelMovSandbox } from './rel-mov-sandbox';
import { libAbsRelMovSandbox } from './abs-rel-mov-sandbox';
import { libAbsMovTutorial } from './abs-mov-tutorial';
import { libRelMovTutorial } from './rel-mov-tutorial';
import { libSD1Class1 } from './sd1-class1'
import { libSD1Class2 } from './sd1-class2'
import { libSD1Class3 } from './sd1-class3'

const libraries: Record<string, BlockLibrary> = {
  'abs-mov-sandbox': libAbsMovSandbox,
  'rel-mov-sandbox': libRelMovSandbox,
  'abs-rel-mov-sandbox': libAbsRelMovSandbox,
  'abs-mov-tutorial': libAbsMovTutorial,
  'rel-mov-tutorial': libRelMovTutorial,
  'sd1-class1': libSD1Class1,
  'sd1-class2': libSD1Class2,
  'sd1-class3': libSD1Class3,
};

// Mapa de Compatibilidade (Impede que projetos de teste quebrem)
const legacyLibraryAliases: Record<string, string> = {
  'turtle-grade-4-advanced': 'abs-mov-sandbox',
  'turtle-grade-5': 'rel-mov-sandbox',
  'turtle-advanced': 'abs-rel-mov-sandbox',
  'turtle-tutorial-4': 'abs-mov-tutorial',
  'turtle-tutorial-5': 'rel-mov-tutorial'
};

export function getLibrary(libraryId: string): BlockLibrary {
  // 1. Resolve o ID: Se for um nome antigo, traduz para o novo.
  const resolvedId = legacyLibraryAliases[libraryId] || libraryId;
  
  // 2. Busca a biblioteca
  const lib = libraries[resolvedId];
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