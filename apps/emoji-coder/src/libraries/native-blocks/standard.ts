import { registerASTParser } from '../ASTBuilder';
import type { TurtleEngine } from '@/shared/engine/interpreter';

export const registerNativeParsers = () => {
  registerASTParser('controls_repeat_ext', (block, walkChildren) => {
    let count = 0;
    const timesInput = block.getInputTargetBlock('TIMES');
    if (timesInput && timesInput.type === 'math_number') {
      count = parseInt(timesInput.getFieldValue('NUM'), 10) || 0;
    }

    const bodyBlock = block.getInputTargetBlock('DO');
    const body = walkChildren(bodyBlock);

    return { action: 'REPEAT', count, body, blockId: block.id };
  });
};

export const registerNativeHandlers = (engine: TurtleEngine) => {
  engine.registerAction('REPEAT', async (node, eng) => {
    for (let i = 0; i < node.count; i++) {
      for (const childNode of node.body) {
        // Pede pro motor executar o bloco filho de forma recursiva
        await eng.executeNode(childNode);
        if (!eng.state.isRunning) return; 
      }
    }
    // REPEAT é pura lógica, então ele não chama `await eng.sleepTick()`.
  });
};