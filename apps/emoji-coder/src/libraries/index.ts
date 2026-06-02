import * as Blockly from 'blockly/core';
import type { BlockLibrary, TranslateFn } from './types';

// Importação das nossas bibliotecas
import { turtleGrade4 } from './turtle-grade-4';

// Nosso Gerador Customizado. Em vez de gerar JavaScript (como o Blockly faz por padrão), 
// ele gerará uma Árvore de Sintaxe Abstrata (AST) em formato JSON.
export const ASTGenerator = new Blockly.Generator('AST');

// O "scrub_" é uma função nativa do Blockly que roda após cada bloco. 
// Nós a usamos para amarrar o código de um bloco ao código do bloco seguinte.
ASTGenerator.scrub_ = function(block, code, thisOnly) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  let nextCode = '';
  if (nextBlock && !thisOnly) {
    const nextGenerated = ASTGenerator.blockToCode(nextBlock);
    // Se for um bloco de valor, o Blockly retorna um Array [codigo, precedencia].
    // Garantimos que nextCode seja sempre uma string.
    nextCode = Array.isArray(nextGenerated) ? nextGenerated[0] : nextGenerated;
  }
  return code + nextCode;
};

// Registro centralizado (FUTURO: Adicionaremos a turtle-grade-5 aqui)
const libraries: Record<string, BlockLibrary> = {
  'turtle-grade-4': turtleGrade4
};

export function loadLibrary(libraryId: string, t: TranslateFn): BlockLibrary {
  const lib = libraries[libraryId];
  if (!lib) throw new Error(`Library ${libraryId} not found`);
  
  lib.registerBlocks(t);
  lib.registerGenerators(ASTGenerator);
  
  return lib;
}

// Função utilitária para extrair os comandos limpos do Blockly
export function compileWorkspaceToAST(workspace: Blockly.Workspace): any[] {
  const topBlocks = workspace.getTopBlocks(true);
  let rawJsonCode = '';
  
  topBlocks.forEach(block => {
    rawJsonCode += ASTGenerator.blockToCode(block);
  });

  // Limpa a última vírgula e envolve em um array para formar um JSON válido
  const cleanJsonStr = '[' + rawJsonCode.replace(/,\s*$/, '') + ']';
  
  try {
    return JSON.parse(cleanJsonStr);
  } catch (e) {
    console.error("Erro ao compilar AST:", e);
    return [];
  }
}