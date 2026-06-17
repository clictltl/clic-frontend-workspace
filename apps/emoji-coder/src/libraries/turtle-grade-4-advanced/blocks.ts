import * as Blockly from 'blockly/core';
import type { TranslateFn } from '../types';

import iconApple from '@/assets/icons/fruits/apple.svg';
import iconBanana from '@/assets/icons/fruits/banana.svg';
import iconCherry from '@/assets/icons/fruits/cherry.svg';
import iconPackage from '@/assets/icons/package.svg';

export const FRUITS = [
  { id: 'apple', src: iconApple, alt: 'Maçã' },
  { id: 'banana', src: iconBanana, alt: 'Banana' },
  { id: 'cherry', src: iconCherry, alt: 'Cereja' }
];

export const defineVisualProcedureBlocks = (t: TranslateFn) => {
  const fruitOptions = FRUITS.map(f => [{ src: f.src, width: 28, height: 28, alt: f.alt }, f.id]);

  if (Blockly.Blocks['turtle_visual_def']) delete Blockly.Blocks['turtle_visual_def'];
  if (Blockly.Blocks['turtle_visual_call']) delete Blockly.Blocks['turtle_visual_call'];

  Blockly.defineBlocksWithJsonArray([
    {
      type: "turtle_visual_def",
      message0: "%1 %2",
      args0: [
        { type: "field_image", src: iconPackage, width: 28, height: 28, alt: "Pacote" },
        { type: "field_dropdown", name: "FRUIT_ID", options: fruitOptions }
      ],
      message1: "%1",
      args1: [{ type: "input_statement", name: "STACK" }],
      colour: 290,
      tooltip: t('emojiCoder.blocks.define') || 'Criar um pacote de ações'
    },
    {
      type: "turtle_visual_call",
      message0: "%1", 
      args0: [
        { type: "field_dropdown", name: "FRUIT_ID", options: fruitOptions }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 290,
      tooltip: 'Chamar este pacote'
    }
  ]);
};