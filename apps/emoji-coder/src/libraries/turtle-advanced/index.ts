import * as Blockly from 'blockly/core';
import type { BlockLibrary, TranslateFn } from '../types';
import type { TurtleEngine } from '@/shared/engine/interpreter';

import { defineStartBlock } from '../core-blocks/start';
import { definePaintBlock, registerPaintParser, registerPaintHandler } from '../core-blocks/paint';
import { defineLoopBlocks, registerLoopParsers, registerLoopHandlers } from '../core-blocks/loops';
import { defineRelativeMovementBlocks, registerRelativeMovementParsers, registerRelativeMovementHandlers } from '../core-blocks/movement-relative';
import { defineAbsoluteMovementBlocks, registerAbsoluteMovementParsers, registerAbsoluteMovementHandlers } from '../core-blocks/movement-absolute';
import { patchProcedureBlocks, registerProcedureParsers, registerProcedureHandlers } from '../core-blocks/procedures';

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
    defineAbsoluteMovementBlocks(t);
    defineLoopBlocks(t);
    patchProcedureBlocks(t);
  },

  registerParsers: () => {
    registerPaintParser();
    registerRelativeMovementParsers();
    registerAbsoluteMovementParsers();
    registerLoopParsers();
    registerProcedureParsers();
  },

  registerEngineHandlers: (engine: TurtleEngine) => {
    registerPaintHandler(engine);
    registerRelativeMovementHandlers(engine);
    registerAbsoluteMovementHandlers(engine); 
    registerLoopHandlers(engine);
    registerProcedureHandlers(engine);
  }
};