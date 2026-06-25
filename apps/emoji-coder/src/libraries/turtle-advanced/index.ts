import * as Blockly from 'blockly/core';
import type { BlockLibrary, TranslateFn } from '../types';
import type { TurtleEngine } from '@/shared/engine/interpreter';

// 1. Blocos Core & Nativos
import { defineStartBlock } from '../core-blocks/start';
import { definePaintBlock, registerPaintParser, registerPaintHandler } from '../core-blocks/paint';
import { registerLoopParsers, registerLoopHandlers } from '../native-blocks/loops';
import { registerProcedureParsers, registerProcedureHandlers, patchProcedureBlocks } from '../native-blocks/procedures';

// 2. Blocos da Grade 5 (Movimento Relativo)
import { defineRelativeMovementBlocks, registerRelativeMovementParsers, registerRelativeMovementHandlers } from '../turtle-grade-5/blocks';

// 3. Handlers da Grade 4 (As ações físicas do motor: MOVE_UP, etc)
import { registerMovementHandlers } from '../turtle-grade-4/blocks';

// 4. Novos blocos de Movimento Absoluto com Texto (Avançado)
import { defineAdvancedAbsoluteMovementBlocks, registerAdvancedAbsoluteMovementParsers } from './blocks';

export const turtleAdvanced: BlockLibrary = {
  id: 'turtle-advanced',
  name: 'Avançado - Sandbox Mestre',
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
        <label text="${t('emojiCoder.toolbox.movement_absolute')}"></label>
        <block type="adv_move_up"></block>
        <block type="adv_move_down"></block>
        <block type="adv_move_left"></block>
        <block type="adv_move_right"></block>
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
    defineAdvancedAbsoluteMovementBlocks(t);
    patchProcedureBlocks(t);
  },

  registerParsers: () => {
    registerPaintParser();
    registerRelativeMovementParsers();
    registerAdvancedAbsoluteMovementParsers();
    registerLoopParsers();
    registerProcedureParsers();
  },

  registerEngineHandlers: (engine: TurtleEngine) => {
    registerPaintHandler(engine);
    registerRelativeMovementHandlers(engine);
    // Aqui injetamos os handlers originais da Grade 4!
    registerMovementHandlers(engine); 
    registerLoopHandlers(engine);
    registerProcedureHandlers(engine);
  }
};