import * as Blockly from 'blockly/core';
import type { TranslateFn } from '../types';
import { registerASTParser } from '../ASTBuilder';

import iconUp from '@/assets/icons/arrow-up.svg';
import iconDown from '@/assets/icons/arrow-down.svg';
import iconLeft from '@/assets/icons/arrow-left.svg';
import iconRight from '@/assets/icons/arrow-right.svg';

export const defineAdvancedAbsoluteMovementBlocks = (t: TranslateFn) => {
  const buildWithIcon = (type: string, src: string, label: string) => ({
    type,
    message0: "%1 %2",
    args0: [
      { type: "field_image", src, width: 18, height: 18, alt: "*" },
      { type: "field_label", text: label }
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230
  });

  const blocksDefinition = [
    buildWithIcon("adv_move_up", iconUp, t('emojiCoder.blocks.move_up')),
    buildWithIcon("adv_move_down", iconDown, t('emojiCoder.blocks.move_down')),
    buildWithIcon("adv_move_left", iconLeft, t('emojiCoder.blocks.move_left')),
    buildWithIcon("adv_move_right", iconRight, t('emojiCoder.blocks.move_right')),
  ];

  blocksDefinition.forEach(def => {
    if (Blockly.Blocks[def.type]) delete Blockly.Blocks[def.type];
    Blockly.defineBlocksWithJsonArray([def]);
  });
};

export const registerAdvancedAbsoluteMovementParsers = () => {
  const createAction = (action: string) => (block: any) => ({ action, blockId: block.id });
  
  // Apontamos os blocos para as mesmas ações que o motor já entende do turtle-grade-4
  registerASTParser('adv_move_up', createAction('MOVE_UP'));
  registerASTParser('adv_move_down', createAction('MOVE_DOWN'));
  registerASTParser('adv_move_left', createAction('MOVE_LEFT'));
  registerASTParser('adv_move_right', createAction('MOVE_RIGHT'));
};