import type { BlockLibrary, TranslateFn } from '../types';
import { defineMovementBlocks, registerMovementParsers, registerMovementHandlers } from './blocks';
import { defineStartBlock } from '../core-blocks/start';
import { definePaintBlock, registerPaintParser, registerPaintHandler } from '../core-blocks/paint';
import { registerNativeParsers, registerNativeHandlers } from '../native-blocks/standard';
import type { TurtleEngine } from '@/shared/engine/interpreter';

export const turtleGrade4: BlockLibrary = {
  id: 'turtle-grade-4',
  name: '4ª Série - Movimento Absoluto',
  
  getToolboxXml: (t: TranslateFn) => `
    <xml>
      <category name="${t('emojiCoder.toolbox.start')}" colour="20">
        <block type="start"></block>
      </category>
      
      <category name="${t('emojiCoder.toolbox.movement')}" colour="230">
        <block type="move_up"></block>
        <block type="move_down"></block>
        <block type="move_left"></block>
        <block type="move_right"></block>
      </category>
      
      <category name="${t('emojiCoder.toolbox.actions')}" colour="290">
        <block type="paint"></block>
      </category>

      <category name="${t('emojiCoder.toolbox.loops')}" colour="120">
        <block type="controls_repeat_ext">
          <!-- O "shadow" cria aquele número padrão encaixado para facilitar para a criança -->
          <value name="TIMES">
            <shadow type="math_number">
              <field name="NUM">4</field>
            </shadow>
          </value>
        </block>
      </category>
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
    registerNativeParsers();
  },

  registerEngineHandlers: (engine: TurtleEngine) => {
    registerPaintHandler(engine);
    registerMovementHandlers(engine);
    registerNativeHandlers(engine);
  }
};