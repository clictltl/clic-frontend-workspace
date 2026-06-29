import type { BlockLibrary, TranslateFn } from '../types';
import { defineAbsoluteMovementBlocks, registerAbsoluteMovementParsers, registerAbsoluteMovementHandlers } from '../core-blocks/movement-absolute';
import { defineStartBlock } from '../core-blocks/start';
import { definePaintBlock, registerPaintParser, registerPaintHandler } from '../core-blocks/paint';
import { defineLoopBlocks, registerLoopParsers, registerLoopHandlers } from '../core-blocks/loops';
import { defineVisualProcedureBlocks, registerVisualProcedureParsers } from '../core-blocks/procedures-visual';
import { registerProcedureHandlers } from '../core-blocks/procedures';
import type { TurtleEngine } from '@/shared/engine/interpreter';

export const turtleGrade4Advanced: BlockLibrary = {
  id: 'turtle-grade-4-advanced',
  name: '4º Ano - Avançado (Funções)',
  
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
    defineAbsoluteMovementBlocks(t, { iconOnly: true });
    defineLoopBlocks(t, { iconOnly: true });
    defineVisualProcedureBlocks(t);
  },

  registerParsers: () => {
    registerPaintParser();
    registerAbsoluteMovementParsers();
    registerLoopParsers();
    registerVisualProcedureParsers();
  },

  registerEngineHandlers: (engine: TurtleEngine) => {
    registerPaintHandler(engine);
    registerAbsoluteMovementHandlers(engine);
    registerLoopHandlers(engine);
    registerProcedureHandlers(engine);
  }
};