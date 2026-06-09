import * as Blockly from 'blockly/core';
import type { TranslateFn } from '../types';
import { registerASTParser } from '../ASTBuilder';
import type { TurtleEngine } from '@/shared/engine/interpreter';
import iconPaint from '@/assets/icons/paint.svg';

export const definePaintBlock = (t: TranslateFn) => {
  Blockly.defineBlocksWithJsonArray([{
    type: "paint",
    message0: "%1 %2",
    args0: [
      { type: "field_image", src: iconPaint, width: 20, height: 20, alt: "Pintar" },
      { type: "field_label", text: t('emojiCoder.blocks.paint') }
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 290,
  }]);
};

export const registerPaintParser = () => {
  registerASTParser('paint', (block) => ({ 
    action: 'PAINT', 
    blockId: block.id 
  }));
};

export const registerPaintHandler = (engine: TurtleEngine) => {
  engine.registerAction('PAINT', async (_node, eng) => {
    const cellId = `${eng.state.turtleX},${eng.state.turtleY}`;
    if (!eng.state.paintedCells.includes(cellId)) {
      eng.state.paintedCells.push(cellId);
    }
    await eng.sleepTick();
  });
};