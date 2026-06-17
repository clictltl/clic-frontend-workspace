import type { BlockLibrary, TranslateFn } from '../types';
import { defineMovementBlocks, defineVisualLoopBlock, registerMovementParsers, registerMovementHandlers } from '../turtle-grade-4/blocks';
import { defineStartBlock } from '../core-blocks/start';
import { definePaintBlock, registerPaintParser, registerPaintHandler } from '../core-blocks/paint';
import { registerLoopParsers, registerLoopHandlers } from '../native-blocks/loops';
import { registerProcedureParsers, registerProcedureHandlers } from '../native-blocks/procedures';
import { defineVisualProcedureBlocks } from './blocks';
import type { TurtleEngine } from '@/shared/engine/interpreter';

export const turtleGrade4Advanced: BlockLibrary = {
  id: 'turtle-grade-4-advanced',
  name: '4ª Série - Avançado (Funções)',
  
  getToolboxXml: (t: TranslateFn) => {
    return `
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
        <sep gap="24"></sep>

        <label text="${t('emojiCoder.toolbox.functions')}"></label>
        <block type="turtle_visual_def"></block>
        <block type="turtle_visual_call"></block>
      </xml>
    `;
  },
  
  registerBlocks: (t: TranslateFn) => {
    defineStartBlock(t, { iconOnly: true });
    definePaintBlock(t, { iconOnly: true });
    defineMovementBlocks(t);
    defineVisualLoopBlock(t);
    defineVisualProcedureBlocks(t);
  },

  registerParsers: () => {
    registerPaintParser();
    registerMovementParsers();
    registerLoopParsers();
    registerProcedureParsers();
  },

  registerEngineHandlers: (engine: TurtleEngine) => {
    registerPaintHandler(engine);
    registerMovementHandlers(engine);
    registerLoopHandlers(engine);
    registerProcedureHandlers(engine);
  }
};