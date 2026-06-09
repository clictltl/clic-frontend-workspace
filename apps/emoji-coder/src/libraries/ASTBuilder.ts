import * as Blockly from 'blockly/core';

// Um parser é uma função que lê um bloco e retorna um Objeto JSON limpo.
export type ASTNodeParser = (block: Blockly.Block, walkChildren: (b: Blockly.Block | null) => any[]) => any;

const parsers: Record<string, ASTNodeParser> = {};

// Função para as bibliotecas ensinarem o motor a ler seus blocos
export const registerASTParser = (blockType: string, parser: ASTNodeParser) => {
  parsers[blockType] = parser;
};

// O "Tree Walker" Recursivo
export const walkAST = (block: Blockly.Block | null): any[] => {
  const nodes: any[] = [];
  let currentBlock = block;

  while (currentBlock) {
    const parser = parsers[currentBlock.type];
    if (parser) {
      const node = parser(currentBlock, walkAST);
      if (node) nodes.push(node);
    } else {
      console.warn(`[ASTBuilder] Nenhum parser registrado para o bloco: ${currentBlock.type}`);
    }
    
    // Pula para o próximo bloco grudado embaixo deste
    currentBlock = currentBlock.getNextBlock();
  }

  return nodes;
};