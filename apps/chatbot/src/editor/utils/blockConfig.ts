import {
  Play,
  MessageSquare,
  CircleHelp,
  ListChecks,
  Split,
  Box,
  Calculator,
  Image as ImageIcon,
  CircleCheck
} from '@lucide/vue';
import type { BlockType } from '@/shared/types/chatbot';

export interface BlockVisualConfig {
  titleKey: string;
  color: string;
  icon: any;
}

// Mapeamento central de todas as propriedades visuais dos blocos
export const BLOCK_CONFIG: Record<BlockType, BlockVisualConfig> = {
  start: {
    titleKey: 'chatbot.blocks.start',
    color: '#10b981',
    icon: Play
  },
  message: {
    titleKey: 'chatbot.blocks.message',
    color: '#3b82f6',
    icon: MessageSquare
  },
  openQuestion: {
    titleKey: 'chatbot.blocks.openQuestion',
    color: '#fb923c',
    icon: CircleHelp
  },
  choiceQuestion: {
    titleKey: 'chatbot.blocks.choiceQuestion',
    color: '#facc15',
    icon: ListChecks
  },
  condition: {
    titleKey: 'chatbot.blocks.condition',
    color: '#a855f7',
    icon: Split
  },
  setVariable: {
    titleKey: 'chatbot.blocks.setVariable',
    color: '#06b6d4',
    icon: Box
  },
  math: {
    titleKey: 'chatbot.blocks.math',
    color: '#38bdf8',
    icon: Calculator
  },
  image: {
    titleKey: 'chatbot.blocks.image',
    color: '#f472b6',
    icon: ImageIcon
  },
  end: {
    titleKey: 'chatbot.blocks.end',
    color: '#ef4444',
    icon: CircleCheck
  }
};

// Lista ordenada de blocos disponíveis para criação nos menus (exclui o 'start')
export const CREATABLE_BLOCKS: BlockType[] = [
  'message',
  'openQuestion',
  'choiceQuestion',
  'condition',
  'setVariable',
  'math',
  'image',
  'end'
];