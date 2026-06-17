import * as Blockly from 'blockly/core';
import type { TranslateFn } from '../types';
import iconPaint from '@/assets/icons/paint.svg';
import { registerASTParser } from '../ASTBuilder';
import type { TurtleEngine } from '@/shared/engine/interpreter';

export const definePaintBlock = (t: TranslateFn, options?: { iconOnly?: boolean }) => {
  const isIcon = options?.iconOnly;
  Blockly.defineBlocksWithJsonArray([{
    type: "paint",
    message0: isIcon ? "%1 %2" : "%1 %2 %3", // Removemos 1 slot se for iconOnly (o field_label)
    args0: isIcon 
      ? [
          { type: "field_image", src: iconPaint, width: 28, height: 28, alt: "Pintar" },
          { type: "field_colour", name: "COLOR", colour: "#fde047" }
        ]
      : [
          { type: "field_image", src: iconPaint, width: 20, height: 20, alt: "Pintar" },
          { type: "field_label", text: t('emojiCoder.blocks.paint') || 'Pintar o chão' },
          { type: "field_colour", name: "COLOR", colour: "#fde047" }
        ],
    previousStatement: null,
    nextStatement: null,
    colour: 290,
    tooltip: isIcon ? (t('emojiCoder.blocks.paint') || 'Pintar o chão') : ""
  }]);
};

export const registerPaintParser = () => {
  registerASTParser('paint', (block) => ({ 
    action: 'PAINT', 
    color: block.getFieldValue('COLOR'), // Extrai a cor do bloco visual
    blockId: block.id 
  }));
};

export const registerPaintHandler = (engine: TurtleEngine) => {
  engine.registerAction('PAINT', async (node, eng) => {
    const cellId = `${eng.state.turtleX},${eng.state.turtleY}`;
    // Salva no dicionário a cor especificada no JSON (AST)
    eng.state.paintedCells[cellId] = node.color || '#fde047';
    await eng.sleepTick(); 
  });
};