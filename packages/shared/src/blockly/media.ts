/// <reference path="./virtual-blockly-media.d.ts" />
import blocklyMediaUrl from 'virtual:blockly-media';

/**
 * Opção `media` do Blockly.inject: pasta com a mídia do Blockly servida pelo próprio app
 * (plugin packages/shared/build/blocklyMedia.ts). Sem ela, o Blockly busca num servidor de demonstração do Google
 * que saiu do ar, e a lixeira e o zoom ficam sem imagem.
 * Fica fora do index.ts de propósito: depende do módulo virtual do plugin, que só os apps com
 * Blockly registram. Importe pelo caminho '@clic/shared/src/blockly/media'.
 */
export const blocklyMediaOptions: { media?: string } = blocklyMediaUrl ? { media: blocklyMediaUrl } : {};
