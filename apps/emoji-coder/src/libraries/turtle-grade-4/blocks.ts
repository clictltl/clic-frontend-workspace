import * as Blockly from 'blockly/core';
import type { TranslateFn } from '../types';
import { registerASTParser } from '../ASTBuilder';
import type { TurtleEngine } from '@/shared/engine/interpreter';

import iconUp from '@/assets/icons/arrow-up.svg';
import iconDown from '@/assets/icons/arrow-down.svg';
import iconLeft from '@/assets/icons/arrow-left.svg';
import iconRight from '@/assets/icons/arrow-right.svg';

export const defineMovementBlocks = (t: TranslateFn) => {
  const buildDef = (type: string, src: string, label: string) => ({
    type,
    message0: "%1 %2",
    args0: [
      { type: "field_image", src, width: 18, height: 18, alt: "*" },
      { type: "field_label", text: label }
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230
  });

  const blocksDefinition = [
    buildDef("move_up", iconUp, t('emojiCoder.blocks.move_up')),
    buildDef("move_down", iconDown, t('emojiCoder.blocks.move_down')),
    buildDef("move_left", iconLeft, t('emojiCoder.blocks.move_left')),
    buildDef("move_right", iconRight, t('emojiCoder.blocks.move_right')),
  ];

  blocksDefinition.forEach(def => {
    if (Blockly.Blocks[def.type]) delete Blockly.Blocks[def.type];
    Blockly.defineBlocksWithJsonArray([def]);
  });
};

export const registerMovementParsers = () => {
  const createAction = (action: string) => (block: any) => ({ 
    action, 
    blockId: block.id 
  });

  registerASTParser('move_up', createAction('MOVE_UP'));
  registerASTParser('move_down', createAction('MOVE_DOWN'));
  registerASTParser('move_left', createAction('MOVE_LEFT'));
  registerASTParser('move_right', createAction('MOVE_RIGHT'));
};

export const registerMovementHandlers = (engine: TurtleEngine) => {
  
  const move = async (eng: TurtleEngine, dx: number, dy: number, rot: number) => {
    const newX = eng.state.turtleX + dx;
    const newY = eng.state.turtleY + dy;
    eng.state.turtleRotation = rot;

    if (newX >= 0 && newX < eng.state.gridWidth && newY >= 0 && newY < eng.state.gridHeight) {
      eng.state.turtleX = newX;
      eng.state.turtleY = newY;
    }
    await eng.sleepTick();
  };

  engine.registerAction('MOVE_UP', async (_node, eng) => await move(eng, 0, -1, 0));
  engine.registerAction('MOVE_DOWN', async (_node, eng) => await move(eng, 0, 1, 180));
  engine.registerAction('MOVE_LEFT', async (_node, eng) => await move(eng, -1, 0, 270));
  engine.registerAction('MOVE_RIGHT', async (_node, eng) => await move(eng, 1, 0, 90));
};