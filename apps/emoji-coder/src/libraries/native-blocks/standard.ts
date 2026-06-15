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

    // A flag isControl para o motor não contar isso como um passo físico!
    return { action: 'REPEAT', count, body, blockId: block.id, isControl: true };
  });
};

export const registerNativeHandlers = (engine: TurtleEngine) => {
  engine.registerAction('REPEAT', async (node, eng) => {
    for (let i = 0; i < node.count; i++) {
      for (const childNode of node.body) {
        await eng.executeNode(childNode);
        // Usa o getter nativo do motor para saber se o usuário apertou Stop
        if (eng.isAborted) return; 
      }
    }
  });
};