import * as Blockly from 'blockly/core';
import type { TranslateFn } from '../types';
import iconStart from '@/assets/icons/start.svg';

export const defineStartBlock = (t: TranslateFn) => {
  Blockly.defineBlocksWithJsonArray([{
    type: "start",
    message0: "%1 %2",
    args0: [
      { type: "field_image", src: iconStart, width: 20, height: 20, alt: "Início" },
      { type: "field_label", text: t('emojiCoder.blocks.start') }
    ],
    nextStatement: null,
    colour: "#22c55e", 
    deletable: false
  }]);
};
