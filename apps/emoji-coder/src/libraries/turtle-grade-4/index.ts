import type { BlockLibrary, TranslateFn } from '../types';
import { defineAbsoluteMovementBlocks, registerAbsoluteMovementParsers, registerAbsoluteMovementHandlers } from '../core-blocks/movement-absolute';
import { defineStartBlock } from '../core-blocks/start';
import { definePaintBlock, registerPaintParser, registerPaintHandler } from '../core-blocks/paint';
import { defineLoopBlocks, registerLoopParsers, registerLoopHandlers } from '../core-blocks/loops';
import type { TurtleEngine } from '@/shared/engine/interpreter';

export const turtleGrade4: BlockLibrary = {
  id: 'turtle-grade-4',
  name: '4º Ano - Movimento Absoluto',
  
  getToolboxXml: (t: TranslateFn) => `
    <xml>
      <label text="${t('emojiCoder.toolbox.movement')}"></label>
      <block type="move_up"></block>
      <block type="move_down"></block>
      <block type="move_left"></block>
      <block type="move_right"></block>
      <sep gap="24"></sep>
      
      <label text="${t('emojiCoder.toolbox.actions')}"></label>
      <block type="paint"></block>
      <sep gap="24"></sep>

      <label text="${t('emojiCoder.toolbox.loops')}"></label>
      <block type="turtle_repeat"></block>
    </xml>
  `,
  
  registerBlocks: (t: TranslateFn) => {
    defineStartBlock(t, { iconOnly: true });
    definePaintBlock(t, { iconOnly: true });
    defineAbsoluteMovementBlocks(t, { iconOnly: true });
    defineLoopBlocks(t, { iconOnly: true });
  },

  registerParsers: () => {
    registerPaintParser();
    registerAbsoluteMovementParsers();
    registerLoopParsers();
  },

  registerEngineHandlers: (engine: TurtleEngine) => {
    registerPaintHandler(engine);
    registerAbsoluteMovementHandlers(engine);
    registerLoopHandlers(engine);
  }
};