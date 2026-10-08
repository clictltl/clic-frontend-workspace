import type { Choice, ChoiceMedia, NodeMedia, RichText } from '../types/chatbot';

/** Valores das variáveis durante uma conversa (por ID da variável). */
export type ChatValues = Record<string, string | number>;

export type ChatMessage =
  | {
      id: number;
      from: 'bot';
      nodeId: string;
      content: RichText;      // Variáveis já substituídas pelos valores
      media: NodeMedia | null;
      delayAfter: number;     // Segundos de espera antes da próxima mensagem (nó de mensagem)
    }
  | {
      id: number;
      from: 'user';
      text: string;
      media: ChoiceMedia | null; // Emoji/imagem da opção escolhida
    };

export type ChatStatus = 'waiting_text' | 'waiting_choice' | 'ended';

/** Erros que interrompem a conversa (traduzidos em `chatbot.runtime.errors.*`). */
export type ChatError = 'NO_START_BLOCK' | 'LOOP_LIMIT';

export interface ChatState {
  status: ChatStatus;
  currentNodeId: string | null; // Nó que está "falando" (destaque no canvas)
  messages: ChatMessage[];
  choices: Choice[];            // Opções disponíveis quando status = 'waiting_choice'
  values: ChatValues;
  rng: number;                  // Estado do gerador do sorteio (ver random.ts)
  error: ChatError | null;
}
