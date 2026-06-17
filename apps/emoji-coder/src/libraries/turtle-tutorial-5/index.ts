import * as Blockly from 'blockly/core';
import type { BlockLibrary, TranslateFn } from '../types';
import { useProjectStore } from '@/shared/stores/projectStore';
import { challengesGrade5 } from '@/tutorials/tutorialGrade5';

import { defineRelativeMovementBlocks, registerRelativeMovementParsers, registerRelativeMovementHandlers } from '../turtle-grade-5/blocks';
import { defineStartBlock } from '../core-blocks/start';
import { definePaintBlock, registerPaintParser, registerPaintHandler } from '../core-blocks/paint';
import { registerLoopParsers, registerLoopHandlers } from '../native-blocks/loops';
import { registerProcedureParsers, registerProcedureHandlers, patchProcedureBlocks } from '../native-blocks/procedures';
import type { TurtleEngine } from '@/shared/engine/interpreter';

export const turtleTutorial5: BlockLibrary = {
  id: 'turtle-tutorial-5',
  name: 'Tutorial 5ª Série',
  isToolboxDynamic: true,
  
  getToolboxXml: (t: TranslateFn, workspace?: Blockly.Workspace) => {
    const store = useProjectStore();
    const challengeIndex = store.activeChallengeIndex || 0;
    const challenge = challengesGrade5[challengeIndex];
    
    if (!challenge) return `<xml></xml>`;

    // Pega as funções já definidas no quadro para injetar os blocos de chamada
    let callBlocks = '';
    if (challenge.blocks.includes('procedures_callnoreturn') && workspace) {
      const functionNames = workspace.getTopBlocks(false)
        .filter(b => b.type === 'procedures_defnoreturn')
        .map(b => b.getFieldValue('NAME'))
        .filter(name => name); 
      
      functionNames.forEach(name => {
        callBlocks += `<block type="procedures_callnoreturn"><mutation name="${name}"></mutation></block>\n`;
      });
    }

    // Filtra os blocos baseados no array de permitidos do desafio
    const blocksXml = challenge.blocks.map(b => {
      if (b === 'procedures_callnoreturn') return ''; // Já tratados acima
      if (b === 'controls_repeat_ext') return `<block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">4</field></shadow></value></block>`;
      if (b === 'procedures_defnoreturn') return `<block type="procedures_defnoreturn"><field name="NAME">${t('emojiCoder.blocks.defaultFuncName')}</field></block>`;
      return `<block type="${b}"></block>`;
    }).join('\n');

    return `
      <xml>
        ${blocksXml}
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