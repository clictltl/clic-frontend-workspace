import { useI18n } from 'vue-i18n';
import { BLOCK_CONFIG } from '../utils/blockConfig';
import type { BlockType } from '@/shared/types/chatbot';

export function useBlockUI() {
  const { t } = useI18n();

  const getBlockTitle = (type: BlockType) => {
    const config = BLOCK_CONFIG[type];
    return config ? t(config.titleKey) : type;
  };

  const getBlockIcon = (type: BlockType) => BLOCK_CONFIG[type]?.icon;
  const getBlockColor = (type: BlockType) => BLOCK_CONFIG[type]?.color;

  return {
    getBlockTitle,
    getBlockIcon,
    getBlockColor,
    rawConfig: BLOCK_CONFIG
  };
}