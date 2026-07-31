import * as Blockly from 'blockly/core';
import type { BlockLibrary, TranslateFn } from '../types';
import { useProjectStore } from '@/shared/stores/projectStore';
import { getChallengesRelMov } from '@/tutorials/tutorialRelMov';

import { defineStartBlock } from '../core-blocks/start';
import { definePaintBlock, registerPaintParser, registerPaintHandler } from '../core-blocks/paint';
import { defineLoopBlocks, registerLoopParsers, registerLoopHandlers } from '../core-blocks/loops';
import { defineRelativeMovementBlocks, registerRelativeMovementParsers, registerRelativeMovementHandlers } from '../core-blocks/movement-relative';
import { patchProcedureBlocks, registerProcedureParsers, registerProcedureHandlers } from '../core-blocks/procedures';
import type { TurtleEngine } from '@/shared/engine/interpreter';

export const libRelMovTutorial: BlockLibrary = {
  id: 'rel-mov-tutorial',
  name: 'Tutorial - Movimento relativo',
  isToolboxDynamic: true,
  mode: 'tutorial',
  
  getSequenceSteps: (t: TranslateFn) => getChallengesRelMov(t),

  getToolboxXml: (t: TranslateFn, workspace?: Blockly.Workspace) => {
    const store = useProjectStore();
    const challengeIndex = store.activeChallengeIndex || 0;
    const challenge = getChallengesRelMov(t)[challengeIndex];
    
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
    definePaintBlock(t);
    defineRelativeMovementBlocks(t);
    defineLoopBlocks(t);
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