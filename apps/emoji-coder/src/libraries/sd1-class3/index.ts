import type { BlockLibrary, TranslateFn } from '../types';
import type { TurtleEngine } from '@/shared/engine/interpreter';

import { defineStartBlock } from '../core-blocks/start';
import { definePaintBlock, registerPaintParser, registerPaintHandler } from '../core-blocks/paint';
import { defineLoopBlocks, registerLoopParsers, registerLoopHandlers } from '../core-blocks/loops';
import { defineRelativeMovementBlocks, registerRelativeMovementParsers, registerRelativeMovementHandlers } from '../core-blocks/movement-relative';
import { defineAbsoluteMovementBlocks, registerAbsoluteMovementParsers, registerAbsoluteMovementHandlers } from '../core-blocks/movement-absolute';

export const libSD1Class3: BlockLibrary = {
  id: 'sd1-class3',
  name: 'SD 1 Aula 3',
  
  getToolboxXml: (t: TranslateFn) => `
      <xml>
        <label text="${t('emojiCoder.toolbox.movement_absolute')}"></label>
        <block type="move_up"></block>
        <block type="move_down"></block>
        <block type="move_left"></block>
        <block type="move_right"></block>
        <sep gap="24"></sep>
        
        <label text="${t('emojiCoder.toolbox.movement_relative')}"></label>
        <block type="move_forward"></block>
        <block type="move_backward"></block>
        <block type="turn_left"></block>
        <block type="turn_right"></block>
        <sep gap="24"></sep>

        <label text="${t('emojiCoder.toolbox.actions')}"></label>
        <block type="paint"></block>
        <sep gap="24"></sep>

        <label text="${t('emojiCoder.toolbox.loops')}"></label>
        <block type="turtle_repeat"></block>
        <sep gap="24"></sep>
      </xml>
  `,
  
  registerBlocks: (t: TranslateFn) => {
    defineStartBlock(t);
    definePaintBlock(t);
    defineRelativeMovementBlocks(t);
    defineAbsoluteMovementBlocks(t);
    defineLoopBlocks(t);
  },

  registerParsers: () => {
    registerPaintParser();
    registerRelativeMovementParsers();
    registerAbsoluteMovementParsers();
    registerLoopParsers();
  },

  registerEngineHandlers: (engine: TurtleEngine) => {
    registerPaintHandler(engine);
    registerRelativeMovementHandlers(engine);
    registerAbsoluteMovementHandlers(engine); 
    registerLoopHandlers(engine);
  }
};