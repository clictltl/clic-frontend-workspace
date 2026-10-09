import type { ComparisonOperator } from '../../shared/types/chatbot';

/** Operadores em palavras (painel e resumo do bloco): a condição se lê como frase. */
export const OPERATOR_KEYS: Record<ComparisonOperator, string> = {
  '==': 'chatbot.properties.operators.eq',
  '!=': 'chatbot.properties.operators.neq',
  '>': 'chatbot.properties.operators.gt',
  '<': 'chatbot.properties.operators.lt',
  '>=': 'chatbot.properties.operators.gte',
  '<=': 'chatbot.properties.operators.lte'
};
