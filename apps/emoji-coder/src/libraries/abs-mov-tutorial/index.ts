import type { BlockLibrary, TranslateFn } from '../types';
import { useProjectStore } from '@/shared/stores/projectStore';
import { getChallengesAbsMov } from '@/tutorials/tutorialAbsMov';

import { defineAbsoluteMovementBlocks, registerAbsoluteMovementParsers, registerAbsoluteMovementHandlers } from '../core-blocks/movement-absolute';
import { defineStartBlock } from '../core-blocks/start';
import { definePaintBlock, registerPaintParser, registerPaintHandler } from '../core-blocks/paint';
import { defineLoopBlocks, registerLoopParsers, registerLoopHandlers } from '../core-blocks/loops';
import type { TurtleEngine } from '@/shared/engine/interpreter';

export const libAbsMovTutorial: BlockLibrary = {
  id: 'abs-mov-tutorial',
  name: 'Tutorial - Movimento absoluto',
  isToolboxDynamic: true, // Avisa o App.vue que a toolbox pode mudar
  mode: 'tutorial',

  getSequenceSteps: (t: TranslateFn) => getChallengesAbsMov(t),
  
  getToolboxXml: (t: TranslateFn) => {
    // Lemos a store do Pinia dinamicamente para saber qual bloco renderizar
    const store = useProjectStore();
    const challengeIndex = store.activeChallengeIndex || 0;
    const challenge = getChallengesAbsMov(t)[challengeIndex];
    
    // Fallback de segurança para o TypeScript (previne o 'possibly undefined')
    if (!challenge) {
      return `<xml></xml>`;
    }
    
    // Constrói XML apenas com os blocos permitidos pelo desafio!
    let blocksXml = '';
    for (const [category, blocks] of Object.entries(challenge.blocks)) {
      blocksXml += `    <label text="${t('emojiCoder.toolbox.' + category)}"></label>\n`;
      blocksXml += blocks.map(b => `    <block type="${b}"></block>`).join('\n') + '\n';
      blocksXml += `    <sep gap="24"></sep>\n`;
    }

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