import * as Blockly from 'blockly/core';
import type { BlockLibrary, TranslateFn } from '../types';

export const turtleGrade4: BlockLibrary = {
  id: 'turtle-grade-4',
  name: '4ª Série - Movimento Absoluto',
  
  // O XML agora é construído dinamicamente traduzido
  getToolboxXml: (t: TranslateFn) => `
    <xml>
      <category name="${t('emojiCoder.toolbox.movement')}" colour="#4CAF50">
        <block type="move_up"></block>
        <block type="move_down"></block>
        <block type="move_left"></block>
        <block type="move_right"></block>
      </category>
    </xml>
  `,
  
  registerBlocks: (t: TranslateFn) => {
    // A definição visual agora consome as chaves de tradução
    const blocksDefinition = [
      { type: "move_up", message0: t('emojiCoder.blocks.move_up'), previousStatement: null, nextStatement: null, colour: 230 },
      { type: "move_down", message0: t('emojiCoder.blocks.move_down'), previousStatement: null, nextStatement: null, colour: 230 },
      { type: "move_left", message0: t('emojiCoder.blocks.move_left'), previousStatement: null, nextStatement: null, colour: 230 },
      { type: "move_right", message0: t('emojiCoder.blocks.move_right'), previousStatement: null, nextStatement: null, colour: 230 },
    ];

    blocksDefinition.forEach(def => {
      // Remove o bloco caso já exista na memória (útil para troca de idioma)
      if (Blockly.Blocks[def.type]) {
        delete Blockly.Blocks[def.type];
      }
      Blockly.defineBlocksWithJsonArray([def]);
    });
  },

  registerGenerators: (generator: any) => {
    const createAction = (actionName: string) => {
      return function(block: Blockly.Block) {
        return JSON.stringify({ action: actionName, blockId: block.id }) + ',\n';
      };
    };

    generator.forBlock['move_up'] = createAction('MOVE_UP');
    generator.forBlock['move_down'] = createAction('MOVE_DOWN');
    generator.forBlock['move_left'] = createAction('MOVE_LEFT');
    generator.forBlock['move_right'] = createAction('MOVE_RIGHT');
  }
};