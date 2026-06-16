import * as Blockly from 'blockly/core';
import type { BlockLibrary, TranslateFn } from '../types';
import { defineMovementBlocks, registerMovementParsers, registerMovementHandlers } from '../turtle-grade-4/blocks';
import { defineStartBlock } from '../core-blocks/start';
import { definePaintBlock, registerPaintParser, registerPaintHandler } from '../core-blocks/paint';
import { registerLoopParsers, registerLoopHandlers } from '../native-blocks/loops';
import { registerProcedureParsers, registerProcedureHandlers, patchProcedureBlocks } from '../native-blocks/procedures';
import type { TurtleEngine } from '@/shared/engine/interpreter';

export const turtleGrade4Advanced: BlockLibrary = {
  id: 'turtle-grade-4-advanced',
  name: '4ª Série - Avançado (Funções)',
  
  getToolboxXml: (t: TranslateFn, workspace?: Blockly.Workspace) => {
    let callBlocks = '';
    if (workspace) {
      const functionNames = workspace.getTopBlocks(false)
        .filter(b => b.type === 'procedures_defnoreturn')
        .map(b => b.getFieldValue('NAME'))
        .filter(name => name); 
      
      functionNames.forEach(name => {
        callBlocks += `<block type="procedures_callnoreturn"><mutation name="${name}"></mutation></block>\n`;
      });
    }

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
        <block type="controls_repeat_ext">
          <value name="TIMES"><shadow type="math_number"><field name="NUM">4</field></shadow></value>
        </block>
        <sep gap="24"></sep>

        <label text="${t('emojiCoder.toolbox.functions')}"></label>
        <block type="procedures_defnoreturn">
          <field name="NAME">${t('emojiCoder.blocks.defaultFuncName')}</field>
        </block>
        ${callBlocks}
      </xml>
    `;
  },
  
  registerBlocks: (t: TranslateFn) => {
    defineStartBlock(t);
    definePaintBlock(t);
    defineMovementBlocks(t);
    patchProcedureBlocks(t);
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