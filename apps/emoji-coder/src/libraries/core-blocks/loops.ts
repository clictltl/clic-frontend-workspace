import * as Blockly from 'blockly/core';
import type { TranslateFn } from '../types';
import { registerASTParser } from '../ASTBuilder';
import type { TurtleEngine } from '@/shared/engine/interpreter';
import iconRepeat from '@/assets/icons/repeat.svg';
import iconPlus from '@/assets/icons/plus.svg';
import iconMinus from '@/assets/icons/minus.svg';

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

// Registra de forma segura a extensão para lidar com os cliques (HMR friendly)
if (!Blockly.Extensions.isRegistered('turtle_repeat_buttons')) {
  Blockly.Extensions.register('turtle_repeat_buttons', function(this: Blockly.Block) {
    const minusField = this.getField('MINUS') as Blockly.FieldImage;
    const plusField = this.getField('PLUS') as Blockly.FieldImage;
    const timesField = this.getField('TIMES') as Blockly.FieldNumber;

    if (minusField && timesField) {
      minusField.setOnClickHandler(() => {
        const current = Number(timesField.getValue()) || 0;
        if (current > 0) timesField.setValue(current - 1);
      });
    }

    if (plusField && timesField) {
      plusField.setOnClickHandler(() => {
        const current = Number(timesField.getValue()) || 0;
        timesField.setValue(current + 1);
      });
    }
  });
}

export const defineLoopBlocks = (t: TranslateFn, options?: { iconOnly?: boolean, suffix?: string }) => {
  const isIcon = options?.iconOnly;
  const suffix = options?.suffix || '';
  const typeName = `turtle_repeat${suffix}`;
  
  if (Blockly.Blocks[typeName]) delete Blockly.Blocks[typeName];
  
  Blockly.defineBlocksWithJsonArray([{
    type: typeName,
    message0: isIcon ? "%1 %2 %3 %4" : "%1 %2 %3 %4 %5",
    args0: isIcon 
      ? [
          { type: "field_image", src: iconRepeat, width: 28, height: 28, alt: "Repetir" },
          { type: "field_number", name: "TIMES", value: 4, min: 0, precision: 1 },
          { type: "field_image", name: "MINUS", src: iconMinus, width: 28, height: 28, alt: "-" },
          { type: "field_image", name: "PLUS", src: iconPlus, width: 28, height: 28, alt: "+" }
        ]
      : [
          { type: "field_image", src: iconRepeat, width: 20, height: 20, alt: "Repetir" },
          { type: "field_label", text: t('emojiCoder.blocks.repeat') },
          { type: "field_number", name: "TIMES", value: 4, min: 0, precision: 1 },
          { type: "field_image", name: "MINUS", src: iconMinus, width: 20, height: 20, alt: "-" },
          { type: "field_image", name: "PLUS", src: iconPlus, width: 20, height: 20, alt: "+" }
        ],
    message1: "%1",
    args1: [{ type: "input_statement", name: "DO" }],
    previousStatement: null,
    nextStatement: null,
    colour: "#4C6AB0",
    tooltip: t('emojiCoder.toolbox.loops'),
    extensions: ["turtle_repeat_buttons"]
  }]);
};

export const registerLoopParsers = (options?: { suffix?: string }) => {
  const suffix = options?.suffix || '';

  const parseRepeatBlock = (block: any, walkChildren: any) => {
    let count = 0;
    if (block.type.startsWith('turtle_repeat')) {
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
  registerASTParser(`turtle_repeat${suffix}`, parseRepeatBlock);
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