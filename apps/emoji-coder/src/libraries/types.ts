import * as Blockly from 'blockly/core';

// Tipo genérico para a função de tradução (t do vue-i18n)
export type TranslateFn = (key: string) => string;
import type { TurtleEngine } from '@/shared/engine/interpreter';
import type { AnySequenceStep } from '@/tutorials';

export interface BlockLibrary {
  id: string;
  name: string;
  isToolboxDynamic?: boolean;
  mode?: 'sandbox' | 'tutorial' | 'activity';
  getSequenceSteps?: (t: TranslateFn) => AnySequenceStep[];
  getToolboxXml: (t: TranslateFn, workspace?: Blockly.Workspace) => string;
  registerBlocks: (t: TranslateFn) => void;
  registerParsers: () => void;
  registerEngineHandlers: (engine: TurtleEngine) => void;
}
