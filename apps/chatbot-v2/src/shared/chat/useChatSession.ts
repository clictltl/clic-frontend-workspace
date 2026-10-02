import { computed, onScopeDispose, ref, shallowRef } from 'vue';
import type { ChatbotProject } from '../types/chatbot';
import type { ChatState } from '../engine/types';
import { selectChoice, startChat, submitText } from '../engine/engine';

/** Tempo do indicador "digitando…" antes de cada mensagem do bot. */
export const TYPING_MS = 700;

export interface ChatSessionOptions {
  getProject: () => ChatbotProject;
  /** Eventos do teste no editor (telemetria). O runtime público não informa. */
  onEvent?: (name: 'preview_start' | 'preview_text' | 'preview_choice' | 'preview_stop', payload?: Record<string, unknown>) => void;
}

/**
 * Sessão de conversa para a interface: guarda o estado do motor e revela as
 * mensagens do bot uma a uma, com "digitando…" e o tempo de espera de cada mensagem.
 */
export function useChatSession(options: ChatSessionOptions) {
  const state = shallowRef<ChatState | null>(null);
  const visibleCount = ref(0);
  const isTyping = ref(false);

  // Cópia do projeto no início: editar durante o teste não muda a conversa em andamento
  let project: ChatbotProject | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let runToken = 0;

  const messages = computed(() => state.value?.messages.slice(0, visibleCount.value) ?? []);
  const isRevealing = computed(() => !!state.value && visibleCount.value < state.value.messages.length);
  const isWaitingText = computed(() => state.value?.status === 'waiting_text' && !isRevealing.value);
  const choices = computed(() => (state.value?.status === 'waiting_choice' && !isRevealing.value ? state.value.choices : []));
  const isEnded = computed(() => state.value?.status === 'ended' && !isRevealing.value);
  const error = computed(() => (isEnded.value ? state.value?.error ?? null : null));

  /** Nó em destaque no canvas: acompanha o que já apareceu na tela, não o que o motor já processou. */
  const activeNodeId = computed(() => {
    if (!state.value) return null;
    if (!isRevealing.value) return state.value.currentNodeId;
    const lastBot = [...messages.value].reverse().find(m => m.from === 'bot');
    return lastBot?.from === 'bot' ? lastBot.nodeId : null;
  });

  function clearTimer() {
    if (timer) clearTimeout(timer);
    timer = undefined;
  }

  function reveal() {
    const token = runToken;
    const step = () => {
      if (token !== runToken || !state.value) return;
      const next = state.value.messages[visibleCount.value];
      if (!next) {
        isTyping.value = false;
        return;
      }
      if (next.from === 'user') {
        visibleCount.value++;
        step();
        return;
      }
      isTyping.value = true;
      timer = setTimeout(() => {
        if (token !== runToken) return;
        isTyping.value = false;
        visibleCount.value++;
        if (next.delayAfter > 0) timer = setTimeout(step, next.delayAfter * 1000);
        else step();
      }, TYPING_MS);
    };
    clearTimer();
    step();
  }

  function start() {
    if (state.value) options.onEvent?.('preview_stop');
    runToken++;
    clearTimer();
    project = JSON.parse(JSON.stringify(options.getProject())) as ChatbotProject;
    options.onEvent?.('preview_start');
    state.value = startChat(project);
    visibleCount.value = 0;
    reveal();
  }

  function submit(rawText: string) {
    const text = rawText.trim();
    if (!project || !state.value || !isWaitingText.value || !text) return;
    options.onEvent?.('preview_text', { text });
    state.value = submitText(project, state.value, text);
    reveal();
  }

  function choose(choiceId: string) {
    if (!project || !state.value || !choices.value.some(c => c.id === choiceId)) return;
    options.onEvent?.('preview_choice', { choiceId });
    state.value = selectChoice(project, state.value, choiceId);
    reveal();
  }

  function stop() {
    if (state.value) options.onEvent?.('preview_stop');
    runToken++;
    clearTimer();
    state.value = null;
    project = null;
    visibleCount.value = 0;
    isTyping.value = false;
  }

  // Fechar o painel/página encerra a sessão (e registra o fim do teste)
  onScopeDispose(stop);

  return {
    isActive: computed(() => !!state.value),
    messages,
    choices,
    isTyping,
    isWaitingText,
    isEnded,
    error,
    activeNodeId,
    start,
    submit,
    choose,
    stop
  };
}

export type ChatSession = ReturnType<typeof useChatSession>;
