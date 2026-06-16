import type { BlockLibrary, TranslateFn } from '../types';
import { defineMovementBlocks, registerMovementParsers, registerMovementHandlers } from './blocks';
import { defineStartBlock } from '../core-blocks/start';
import { definePaintBlock, registerPaintParser, registerPaintHandler } from '../core-blocks/paint';
import { registerLoopParsers, registerLoopHandlers } from '../native-blocks/loops';
import type { TurtleEngine } from '@/shared/engine/interpreter';

export const turtleGrade4: BlockLibrary = {
  id: 'turtle-grade-4',
  name: '4ª Série - Movimento Absoluto',
  
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
      <block type="controls_repeat_ext">
        <value name="TIMES">
          <shadow type="math_number">
            <field name="NUM">4</field>
          </shadow>
        </value>
      </block>
    </xml>
  `,
  
  registerBlocks: (t: TranslateFn) => {
    defineStartBlock(t);
    definePaintBlock(t);
    defineMovementBlocks(t);
  },

  registerParsers: () => {
    registerPaintParser();
    registerMovementParsers();
    registerLoopParsers();
  },

  registerEngineHandlers: (engine: TurtleEngine) => {
    registerPaintHandler(engine);
    registerMovementHandlers(engine);
    registerLoopHandlers(engine);
  }
};