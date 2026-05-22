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
} from 'lucide-vue-next';
import type { BlockType } from '@/shared/types/chatbot';

export interface BlockVisualConfig {
  title: string;
  color: string;
  icon: any;
}

// Mapeamento central de todas as propriedades visuais dos blocos
export const BLOCK_CONFIG: Record<BlockType, BlockVisualConfig> = {
  start: {
    title: 'Início',
    color: '#10b981',
    icon: Play
  },
  message: {
    title: 'Mensagem',
    color: '#3b82f6',
    icon: MessageSquare
  },
  openQuestion: {
    title: 'Pergunta Aberta',
    color: '#fb923c',
    icon: CircleHelp
  },
  choiceQuestion: {
    title: 'Múltipla Escolha',
    color: '#facc15',
    icon: ListChecks
  },
  condition: {
    title: 'Condicional',
    color: '#a855f7',
    icon: Split
  },
  setVariable: {
    title: 'Definir Variável',
    color: '#06b6d4',
    icon: Box
  },
  math: {
    title: 'Operação Matemática',
    color: '#38bdf8',
    icon: Calculator
  },
  image: {
    title: 'Imagem',
    color: '#f472b6',
    icon: ImageIcon
  },
  end: {
    title: 'Fim da Conversa',
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