import { registerASTParser } from '../ASTBuilder';
import type { TurtleEngine } from '@/shared/engine/interpreter';

export const registerLoopParsers = () => {
  // Função de parsing compartilhada
  const parseRepeatBlock = (block: any, walkChildren: any) => {
    let count = 0;
    
    if (block.type === 'turtle_repeat') {
      // Lê o número diretamente de dentro do bloco visual
      count = Number(block.getFieldValue('TIMES')) || 0;
    } else {
      // Lê o número do bloco math_number externo (compatibilidade com o laço nativo)
      const timesInput = block.getInputTargetBlock('TIMES');
      if (timesInput && timesInput.type === 'math_number') {
        count = parseInt(timesInput.getFieldValue('NUM'), 10) || 0;
      }
    }

    const bodyBlock = block.getInputTargetBlock('DO');
    const body = walkChildren(bodyBlock);

    return { action: 'REPEAT', count, body, blockId: block.id, isControl: true };
  };

  // O motor lê tanto o bloco com texto quanto o bloco apenas visual com a mesma lógica!
  registerASTParser('controls_repeat_ext', parseRepeatBlock);
  registerASTParser('turtle_repeat', parseRepeatBlock);
};

export const registerLoopHandlers = (engine: TurtleEngine) => {
  engine.registerAction('REPEAT', async (node, eng) => {
    for (let i = 0; i < node.count; i++) {
      for (const childNode of node.body) {
        await eng.executeNode(childNode);
        if (eng.isAborted) return; 
      }
    }
  });
};