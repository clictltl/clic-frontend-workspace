import type { BlockLibrary, TranslateFn } from '../types';
import { useProjectStore } from '@/shared/stores/projectStore';
import { getActivitiesSD1Class2 } from '@/tutorials/activitySD1Class2';

import { defineStartBlock } from '../core-blocks/start';
import { definePaintBlock, registerPaintParser, registerPaintHandler } from '../core-blocks/paint';
import { defineLoopBlocks, registerLoopParsers, registerLoopHandlers } from '../core-blocks/loops';
import { defineRelativeMovementBlocks, registerRelativeMovementParsers, registerRelativeMovementHandlers } from '../core-blocks/movement-relative';
import type { TurtleEngine } from '@/shared/engine/interpreter';

export const libSD1Class2: BlockLibrary = {
  id: 'sd1-class2',
  name: 'SD 1 Aula 2',
  isToolboxDynamic: true,
  mode: 'activity',
  
  getSequenceSteps: (t: TranslateFn) => getActivitiesSD1Class2(t),

  getToolboxXml: (t: TranslateFn) => {
    const store = useProjectStore();
    const challengeIndex = store.activeChallengeIndex || 0;
    const challenge = getActivitiesSD1Class2(t)[challengeIndex];
    
    if (!challenge) {
      return `<xml></xml>`;
    }
    
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
    defineStartBlock(t);
    definePaintBlock(t);
    defineRelativeMovementBlocks(t);
    defineLoopBlocks(t);
  },

  registerParsers: () => {
    registerPaintParser();
    registerRelativeMovementParsers();
    registerLoopParsers();
  },

  registerEngineHandlers: (engine: TurtleEngine) => {
    registerPaintHandler(engine);
    registerRelativeMovementHandlers(engine);
    registerLoopHandlers(engine);
  }
};