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

  getToolboxXml: (t: TranslateFn) => {
    const store = useProjectStore();
    const challengeIndex = store.activeChallengeIndex || 0;
    const challenge = getActivitiesSD1Class1(t)[challengeIndex];
    
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