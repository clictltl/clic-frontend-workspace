import * as Blockly from 'blockly/core';
import type { TranslateFn } from '../types';
import iconStart from '@/assets/icons/start.svg';

export const defineStartBlock = (t: TranslateFn, options?: { iconOnly?: boolean }) => {
  const isIcon = options?.iconOnly;
  
  Blockly.Blocks['start'] = {
    init: function(this: Blockly.Block) {
      this.jsonInit({
        type: "start",
        message0: isIcon ? "%1" : "%1 %2",
        args0: isIcon 
          ? [{ type: "field_image", src: iconStart, width: 28, height: 28, alt: "Início" }]
          : [
              { type: "field_image", src: iconStart, width: 20, height: 20, alt: "Início" },
              { type: "field_label", text: t('emojiCoder.blocks.start') }
            ],
        nextStatement: null,
        colour: "#50A554", 
        tooltip: isIcon ? t('emojiCoder.blocks.start') : ""
      });
      
      // A função imperativa que blinda o bloco de ser apagado (mesmo com Delete ou Lixeira)
      this.setDeletable(false);
    }
  };
};