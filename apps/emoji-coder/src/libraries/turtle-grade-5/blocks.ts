import * as Blockly from 'blockly/core';
import type { TranslateFn } from '../types';
import { registerASTParser } from '../ASTBuilder';
import type { TurtleEngine } from '@/shared/engine/interpreter';

import iconTurnLeft from '@/assets/icons/turn-left.svg';
import iconTurnRight from '@/assets/icons/turn-right.svg';

export const defineRelativeMovementBlocks = (t: TranslateFn) => {
  
  const buildTextOnly = (type: string, label: string) => ({
    type,
    message0: "%1",
    args0: [
      { type: "field_label", text: label }
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230
  });

  const buildWithIcon = (type: string, src: string, label: string) => ({
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
    buildTextOnly("move_forward", t('emojiCoder.blocks.move_forward')),
    buildTextOnly("move_backward", t('emojiCoder.blocks.move_backward')),
    buildWithIcon("turn_left", iconTurnLeft, t('emojiCoder.blocks.turn_left')),
    buildWithIcon("turn_right", iconTurnRight, t('emojiCoder.blocks.turn_right')),
  ];

  blocksDefinition.forEach(def => {
    if (Blockly.Blocks[def.type]) delete Blockly.Blocks[def.type];
    Blockly.defineBlocksWithJsonArray([def]);
  });
};

export const registerRelativeMovementParsers = () => {
  const createAction = (action: string) => (block: any) => ({ 
    action, 
    blockId: block.id 
  });

  registerASTParser('move_forward', createAction('MOVE_FORWARD'));
  registerASTParser('move_backward', createAction('MOVE_BACKWARD'));
  registerASTParser('turn_left', createAction('TURN_LEFT'));
  registerASTParser('turn_right', createAction('TURN_RIGHT'));
};

export const registerRelativeMovementHandlers = (engine: TurtleEngine) => {
  
  // Função auxiliar para converter ângulo em vetores X e Y
  const getDirectionVector = (rotation: number) => {
    const angle = ((rotation % 360) + 360) % 360; // Normaliza para 0-359 positivos
    if (angle === 0) return { dx: 0, dy: -1 };    // Cima
    if (angle === 90) return { dx: 1, dy: 0 };    // Direita
    if (angle === 180) return { dx: 0, dy: 1 };   // Baixo
    if (angle === 270) return { dx: -1, dy: 0 };  // Esquerda
    return { dx: 0, dy: 0 };
  };

  const moveRelative = async (eng: TurtleEngine, multiplier: number) => {
    const { dx, dy } = getDirectionVector(eng.state.turtleRotation);
    const newX = eng.state.turtleX + (dx * multiplier);
    const newY = eng.state.turtleY + (dy * multiplier);

    if (newX >= 0 && newX < eng.state.gridWidth && newY >= 0 && newY < eng.state.gridHeight) {
      eng.state.turtleX = newX;
      eng.state.turtleY = newY;
    }
    await eng.sleepTick();
  };

  const turn = async (eng: TurtleEngine, angleChange: number) => {
    eng.state.turtleRotation = ((eng.state.turtleRotation + angleChange) % 360 + 360) % 360;
    await eng.sleepTick();
  };

  // 1 = Frente, -1 = Trás
  engine.registerAction('MOVE_FORWARD', async (_node, eng) => await moveRelative(eng, 1));
  engine.registerAction('MOVE_BACKWARD', async (_node, eng) => await moveRelative(eng, -1));
  
  // -90 = Esquerda, 90 = Direita
  engine.registerAction('TURN_LEFT', async (_node, eng) => await turn(eng, -90));
  engine.registerAction('TURN_RIGHT', async (_node, eng) => await turn(eng, 90));
};