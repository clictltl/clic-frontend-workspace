import * as Blockly from 'blockly/core';
import type { BlockLibrary, TranslateFn } from '../types';
import { useProjectStore } from '@/shared/stores/projectStore';
import { getActivitiesSD1Class1 } from '@/tutorials/activitySD1Class1';

import { defineStartBlock } from '../core-blocks/start';
import { definePaintBlock, registerPaintParser, registerPaintHandler } from '../core-blocks/paint';
import { defineLoopBlocks, registerLoopParsers, registerLoopHandlers } from '../core-blocks/loops';
import { defineAbsoluteMovementBlocks, registerAbsoluteMovementParsers, registerAbsoluteMovementHandlers } from '../core-blocks/movement-absolute';
import { defineRelativeMovementBlocks, registerRelativeMovementParsers, registerRelativeMovementHandlers } from '../core-blocks/movement-relative';
import { defineVisualProcedureBlocks, registerVisualProcedureParsers } from '../core-blocks/procedures-visual';
import { patchProcedureBlocks, registerProcedureParsers, registerProcedureHandlers } from '../core-blocks/procedures';
import type { TurtleEngine } from '@/shared/engine/interpreter';

export const libSD1Class1: BlockLibrary = {
  id: 'sd1-class1',
  name: 'SD 1 Aula 1',
  isToolboxDynamic: true,
  mode: 'activity',
  
  getSequenceSteps: (t: TranslateFn) => getActivitiesSD1Class1(t),

  getToolboxXml: (t: TranslateFn, workspace?: Blockly.Workspace) => {
    const store = useProjectStore();
    const challengeIndex = store.activeChallengeIndex || 0;
    const challenge = getActivitiesSD1Class1(t)[challengeIndex];
    
    if (!challenge) return `<xml></xml>`;

    let blocksXml = '';
    
    for (const [category, blocks] of Object.entries(challenge.blocks)) {
      blocksXml += `    <label text="${t('emojiCoder.toolbox.' + category)}"></label>\n`;
      
      for (const b of blocks) {
        if (b === 'procedures_callnoreturn') {
          // Pega as funções já definidas no quadro para injetar os blocos de chamada nesta categoria
          if (workspace) {
            const functionNames = workspace.getTopBlocks(false)
              .filter(blk => blk.type === 'procedures_defnoreturn')
              .map(blk => blk.getFieldValue('NAME'))
              .filter(name => name); 
            
            functionNames.forEach(name => {
              blocksXml += `    <block type="procedures_callnoreturn"><mutation name="${name}"></mutation></block>\n`;
            });
          }
        } else if (b === 'controls_repeat_ext') {
          blocksXml += `    <block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">4</field></shadow></value></block>\n`;
        } else if (b === 'procedures_defnoreturn') {
          blocksXml += `    <block type="procedures_defnoreturn"><field name="NAME">${t('emojiCoder.blocks.defaultFuncName')}</field></block>\n`;
        } else {
          blocksXml += `    <block type="${b}"></block>\n`;
        }
      }
      blocksXml += `    <sep gap="24"></sep>\n`;
    }

    return `
      <xml>
        ${blocksXml}
      </xml>
    `;
  },
  
  registerBlocks: (t: TranslateFn) => {
    defineStartBlock(t);
    definePaintBlock(t, { iconOnly: true, suffix: '_icon' });
    definePaintBlock(t, { iconOnly: false, suffix: '_text' });
    defineAbsoluteMovementBlocks(t, { iconOnly: true, suffix: '_icon' });
    defineRelativeMovementBlocks(t);
    defineLoopBlocks(t, { iconOnly: true, suffix: '_icon' });
    defineLoopBlocks(t, { iconOnly: false, suffix: '_text' });
    defineVisualProcedureBlocks(t);
    patchProcedureBlocks(t);
  },

  registerParsers: () => {
    registerPaintParser({ suffix: '_icon' });
    registerPaintParser({ suffix: '_text' });
    registerAbsoluteMovementParsers({ suffix: '_icon' });
    registerRelativeMovementParsers();
    registerLoopParsers({ suffix: '_icon' });
    registerLoopParsers({ suffix: '_text' });
    registerVisualProcedureParsers();
    registerProcedureParsers();
  },

  registerEngineHandlers: (engine: TurtleEngine) => {
    registerPaintHandler(engine);
    registerAbsoluteMovementHandlers(engine);
    registerRelativeMovementHandlers(engine);
    registerLoopHandlers(engine);
    registerProcedureHandlers(engine);
  }
};