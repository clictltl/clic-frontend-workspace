import {
  Play, MessageSquare, CircleHelp, ListChecks, Split, Box, Calculator, CircleCheck
} from '@lucide/vue';
import type { ChatNode } from '../../shared/types/project';

export interface NodeVisualConfig {
  titleKey: string;
  color: string;
  icon: any;
}

// Adaptado para os novos tipos em snake_case
export const NODE_CONFIG: Record<ChatNode['type'], NodeVisualConfig> = {
  start: { titleKey: 'chatbot.blocks.start', color: '#10b981', icon: Play },
  message: { titleKey: 'chatbot.blocks.message', color: '#3b82f6', icon: MessageSquare },
  open_question: { titleKey: 'chatbot.blocks.openQuestion', color: '#fb923c', icon: CircleHelp },
  choice_question: { titleKey: 'chatbot.blocks.choiceQuestion', color: '#facc15', icon: ListChecks },
  condition: { titleKey: 'chatbot.blocks.condition', color: '#a855f7', icon: Split },
  set_variable: { titleKey: 'chatbot.blocks.setVariable', color: '#06b6d4', icon: Box },
  math: { titleKey: 'chatbot.blocks.math', color: '#38bdf8', icon: Calculator },
  end: { titleKey: 'chatbot.blocks.end', color: '#ef4444', icon: CircleCheck }
};

export const CREATABLE_NODES: ChatNode['type'][] = [
  'message', 'open_question', 'choice_question', 'condition', 'set_variable', 'math', 'end'
];