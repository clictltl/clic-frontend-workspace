import type { BlockLibrary, TranslateFn } from '../types';
import { useProjectStore } from '@/shared/stores/projectStore';
import { challengesGrade4 } from '@/tutorials/tutorialGrade4';

import { defineAbsoluteMovementBlocks, registerAbsoluteMovementParsers, registerAbsoluteMovementHandlers } from '../core-blocks/movement-absolute';
import { defineStartBlock } from '../core-blocks/start';
import { definePaintBlock, registerPaintParser, registerPaintHandler } from '../core-blocks/paint';
import { defineLoopBlocks, registerLoopParsers, registerLoopHandlers } from '../core-blocks/loops';
import type { TurtleEngine } from '@/shared/engine/interpreter';

export const turtleTutorial4: BlockLibrary = {
  id: 'turtle-tutorial-4',
  name: 'Tutorial 4º Ano',
  isToolboxDynamic: true, // Avisa o App.vue que a toolbox pode mudar
  
  getToolboxXml: () => {
    // Lemos a store do Pinia dinamicamente para saber qual bloco renderizar
    const store = useProjectStore();
    const challengeIndex = store.activeChallengeIndex || 0;
    const challenge = challengesGrade4[challengeIndex];
    
    // Fallback de segurança para o TypeScript (previne o 'possibly undefined')
    if (!challenge) {
      return `<xml></xml>`;
    }
    
    // Constrói XML apenas com os blocos permitidos pelo desafio!
    const blocksXml = challenge.blocks.map(b => `<block type="${b}"></block>`).join('\n');

    return `
      <xml>
        ${blocksXml}
      </xml>
    `;
  },
  
  registerBlocks: (t: TranslateFn) => {
    defineStartBlock(t, { iconOnly: true });
    definePaintBlock(t, { iconOnly: true });
    defineAbsoluteMovementBlocks(t, { iconOnly: true });
    defineLoopBlocks(t, { iconOnly: true });
  },

  registerParsers: () => {
    registerPaintParser();
    registerAbsoluteMovementParsers();
    registerLoopParsers();
  },

  registerEngineHandlers: (engine: TurtleEngine) => {
    registerPaintHandler(engine);
    registerAbsoluteMovementHandlers(engine);
    registerLoopHandlers(engine);
  }
};