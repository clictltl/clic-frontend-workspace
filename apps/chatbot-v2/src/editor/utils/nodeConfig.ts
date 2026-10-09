import {
  Play, MessageSquare, CircleHelp, ListChecks, Split, Box, Calculator, CircleCheck
} from '@lucide/vue';
import type { NodeType } from '../../shared/types/chatbot';

/**
 * Cores dos blocos: vivas, sempre com texto escuro (#111827) no cabeçalho, todas com
 * contraste AA. `ink` é o tom escuro da mesma cor para ícones sobre fundo branco
 * (menu de adicionar, painel), onde a cor viva (ex.: amarelo) não teria contraste.
 */
export interface NodeVisualConfig {
  titleKey: string;
  color: string;
  ink: string;
  icon: any;
}

// Adaptado para os novos tipos em snake_case
export const NODE_CONFIG: Record<NodeType, NodeVisualConfig> = {
  start: { titleKey: 'chatbot.blocks.start', color: '#10b981', ink: '#047857', icon: Play },
  message: { titleKey: 'chatbot.blocks.message', color: '#3b82f6', ink: '#1d4ed8', icon: MessageSquare },
  open_question: { titleKey: 'chatbot.blocks.openQuestion', color: '#fb923c', ink: '#c2410c', icon: CircleHelp },
  choice_question: { titleKey: 'chatbot.blocks.choiceQuestion', color: '#facc15', ink: '#a16207', icon: ListChecks },
  condition: { titleKey: 'chatbot.blocks.condition', color: '#c084fc', ink: '#7e22ce', icon: Split },
  set_variable: { titleKey: 'chatbot.blocks.setVariable', color: '#06b6d4', ink: '#0e7490', icon: Box },
  math: { titleKey: 'chatbot.blocks.math', color: '#38bdf8', ink: '#0369a1', icon: Calculator },
  end: { titleKey: 'chatbot.blocks.end', color: '#f87171', ink: '#b91c1c', icon: CircleCheck }
};

// `math` não é mais criável (só aparece em projetos antigos)
export const CREATABLE_NODES: NodeType[] = [
  'message', 'open_question', 'choice_question', 'condition', 'set_variable', 'end'
];