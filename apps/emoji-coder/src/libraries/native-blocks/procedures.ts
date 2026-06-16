import * as Blockly from 'blockly/core';
import { registerASTParser } from '../ASTBuilder';
import type { TurtleEngine } from '@/shared/engine/interpreter';
import type { TranslateFn } from '../types';

// Guarda as funções originais intactas na memória
const originalCallInit = Blockly.Blocks['procedures_callnoreturn'].init;
const originalDefInit = Blockly.Blocks['procedures_defnoreturn'].init;

export const patchProcedureBlocks = (t: TranslateFn) => {
  
  // Patch 1: Bloco de Chamada (Injeta o texto traduzido)
  Blockly.Blocks['procedures_callnoreturn'].init = function(this: Blockly.Block) {
    if (originalCallInit) originalCallInit.call(this);
    
    const topRow = this.getInput('TOPROW');
    if (topRow) {
      topRow.insertFieldAt(0, new Blockly.FieldLabel(t('emojiCoder.blocks.call')));
    }
  };

  // Patch 2: Bloco de Definição (Remove a engrenagem interceptando sua criação)
  Blockly.Blocks['procedures_defnoreturn'].init = function(this: Blockly.Block) {
    
    // 1. Intercepta a API legada (Blockly v10/v11)
    const originalSetMutator = (this as any).setMutator;
    (this as any).setMutator = function() {}; 

    // 2. Intercepta a nova Icon API (Blockly v12+)
    const originalAddIcon = (this as any).addIcon;
    if (originalAddIcon) {
      (this as any).addIcon = function(icon: any) {
        // Se for um ícone de mutator, aborta a adição!
        const type = typeof icon.getType === 'function' ? icon.getType() : icon.type;
        if (type === 'mutator') return; 
        originalAddIcon.call(this, icon);
      };
    }

    // 3. Roda o init original (Ele vai tentar criar a engrenagem, mas cairá no nosso bloqueio)
    if (originalDefInit) originalDefInit.call(this);

    // 4. Devolve as funções originais para não corromper o bloco futuramente
    if (originalSetMutator) (this as any).setMutator = originalSetMutator;
    if (originalAddIcon) (this as any).addIcon = originalAddIcon;
  };
};

export const registerProcedureParsers = () => {
  registerASTParser('procedures_defnoreturn', (block, walkChildren) => {
    const name = block.getFieldValue('NAME');
    const bodyBlock = block.getInputTargetBlock('STACK'); 
    const body = walkChildren(bodyBlock);

    return { 
      action: 'DEFINE_FUNCTION', blockId: block.id, isControl: true,
      isDefinition: true, definitionName: name, body
    };
  });

  registerASTParser('procedures_callnoreturn', (block) => {
    const name = block.getFieldValue('NAME');
    return { 
      action: 'CALL_FUNCTION', blockId: block.id, isControl: true,
      isCall: true, callTarget: name
    };
  });
};

export const registerProcedureHandlers = (engine: TurtleEngine) => {
  engine.registerAction('DEFINE_FUNCTION', async () => {});

  engine.registerAction('CALL_FUNCTION', async (node, eng) => {
    const body = eng.state.functions[node.callTarget];
    if (body) {
      for (const childNode of body) {
        await eng.executeNode(childNode);
        if (eng.isAborted) return;
      }
    } else {
      console.warn(`[TurtleEngine] Função '${node.callTarget}' não encontrada na memória.`);
    }
  });
};