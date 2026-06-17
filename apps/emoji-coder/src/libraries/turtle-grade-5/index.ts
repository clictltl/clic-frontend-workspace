import * as Blockly from 'blockly/core';
import type { BlockLibrary, TranslateFn } from '../types';
import { defineRelativeMovementBlocks, registerRelativeMovementParsers, registerRelativeMovementHandlers } from './blocks';
import { defineStartBlock } from '../core-blocks/start';
import { definePaintBlock, registerPaintParser, registerPaintHandler } from '../core-blocks/paint';
import { registerLoopParsers, registerLoopHandlers } from '../native-blocks/loops';
import { registerProcedureParsers, registerProcedureHandlers, patchProcedureBlocks } from '../native-blocks/procedures';
import type { TurtleEngine } from '@/shared/engine/interpreter';

export const turtleGrade5: BlockLibrary = {
  id: 'turtle-grade-5',
  name: '5ª Série - Movimento Relativo e Funções',
  isToolboxDynamic: true,
  
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
        <block type="move_forward"></block>
        <block type="move_backward"></block>
        <block type="turn_left"></block>
        <block type="turn_right"></block>
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
    defineRelativeMovementBlocks(t);
    patchProcedureBlocks(t);
  },

  registerParsers: () => {
    registerPaintParser();
    registerRelativeMovementParsers();
    registerLoopParsers();
    registerProcedureParsers();
  },

  registerEngineHandlers: (engine: TurtleEngine) => {
    registerPaintHandler(engine);
    registerRelativeMovementHandlers(engine);
    registerLoopHandlers(engine);
    registerProcedureHandlers(engine);
  }
};