import * as Blockly from 'blockly/core';
import type { TranslateFn } from '../types';
import { registerASTParser } from '../ASTBuilder';
import type { TurtleEngine } from '@/shared/engine/interpreter';
import iconRepeat from '@/assets/icons/repeat.svg';

// Guarda a inicialização original do bloco nativo
let originalRepeatInit: any = null;

export const patchLoopBlocks = () => {
  if (!Blockly.Blocks['controls_repeat_ext']) return;
  if (!originalRepeatInit) originalRepeatInit = Blockly.Blocks['controls_repeat_ext'].init;

  Blockly.Blocks['controls_repeat_ext'].init = function(this: Blockly.Block) {
    if (originalRepeatInit) originalRepeatInit.call(this);
    this.setColour('#4C6AB0');
  };
};

export const defineLoopBlocks = (t: TranslateFn, options?: { iconOnly?: boolean }) => {
  const isIcon = options?.iconOnly;
  
  if (Blockly.Blocks['turtle_repeat']) delete Blockly.Blocks['turtle_repeat'];
  
  Blockly.defineBlocksWithJsonArray([{
    type: "turtle_repeat",
    message0: isIcon ? "%1 %2" : "%1 %2 %3", // Ajustado para texto
    args0: isIcon 
      ? [
          { type: "field_image", src: iconRepeat, width: 28, height: 28, alt: "Repetir" },
          { type: "field_number", name: "TIMES", value: 4, min: 0, precision: 1 }
        ]
      : [
          { type: "field_image", src: iconRepeat, width: 20, height: 20, alt: "Repetir" },
          { type: "field_label", text: t('emojiCoder.blocks.repeat') || 'Repita' },
          { type: "field_number", name: "TIMES", value: 4, min: 0, precision: 1 }
        ],
    message1: "%1",
    args1: [{ type: "input_statement", name: "DO" }],
    previousStatement: null,
    nextStatement: null,
    colour: "#4C6AB0",
    tooltip: t('emojiCoder.toolbox.loops') || 'Repetir ações'
  }]);
};

export const registerLoopParsers = () => {
  const parseRepeatBlock = (block: any, walkChildren: any) => {
    let count = 0;
    if (block.type === 'turtle_repeat') {
      count = Number(block.getFieldValue('TIMES')) || 0;
    } else {
      const timesInput = block.getInputTargetBlock('TIMES');
      if (timesInput && timesInput.type === 'math_number') {
        count = parseInt(timesInput.getFieldValue('NUM'), 10) || 0;
      }
    }
    const bodyBlock = block.getInputTargetBlock('DO');
    const body = walkChildren(bodyBlock);
    return { action: 'REPEAT', count, body, blockId: block.id, isControl: true };
  };

  registerASTParser('controls_repeat_ext', parseRepeatBlock);
  registerASTParser('turtle_repeat', parseRepeatBlock);
};

export const registerLoopHandlers = (engine: TurtleEngine) => {
  engine.registerAction('REPEAT', async (node, eng) => {
    for (let i = 0; i < node.count; i++) {
      for (const childNode of node.body) {
        await eng.executeNode(childNode);
        if (eng.isAborted) return; 
      }
    }
  });
};