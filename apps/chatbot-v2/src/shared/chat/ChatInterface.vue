<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { AlertTriangle, Bot, Play, RefreshCw, Send } from '@lucide/vue';
import type { ChatSession } from './useChatSession';
import type { Appearance } from '../types/chatbot';
import { appearanceStyle } from '../domain/appearance';
import { loadChatFont } from './chatFonts';
import { isRichTextEmpty } from '../domain/richText';
import ChatRichText from './ChatRichText.vue';
import MediaView from '../components/MediaView.vue';
import ChoiceMediaView from '../components/ChoiceMediaView.vue';

/** Conversa com o chatbot: usada no "Testar" do editor e no runtime do aluno. */
const props = defineProps<{
  session: ChatSession;
  appearance: Appearance; // Tema, fonte e textos (o painel Testar acompanha as mudanças ao vivo)
}>();

const { t } = useI18n();
const userInput = ref('');
const endRef = ref<HTMLDivElement | null>(null);
const rootRef = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const choicesRef = ref<HTMLDivElement | null>(null);
const restartRef = ref<HTMLButtonElement | null>(null);

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// Baixa a fonte escolhida (até chegar, o texto aparece na fonte do sistema)
watch(() => props.appearance.font, font => { loadChatFont(font); }, { immediate: true });

// Rola até o fim a cada mensagem nova, "digitando…" ou opções
watch(
  () => [props.session.messages.value.length, props.session.isTyping.value, props.session.choices.value.length],
  async () => {
    await nextTick();
    endRef.value?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'end' });
  }
);

// Quando o bot termina de falar, o foco vai para onde o aluno responde (teclado e leitor de tela).
// Só se o foco já estiver no chat ou em lugar nenhum: no editor, o Testar fica ao lado e não pode
// tirar o foco de quem está digitando num bloco.
// O foco automático num botão chega sem anel ("quieto"): para quem usa mouse ou toque, um botão
// destacado parece já escolhido. Tab ou setas mostram o anel; Enter responde direto.
const quietFocus = ref(false);
function focusInChat(target: HTMLElement | null | undefined, quiet = false) {
  const active = document.activeElement;
  const focusIsFree = !active || active === document.body || !!rootRef.value?.contains(active);
  if (target && focusIsFree) {
    quietFocus.value = quiet;
    target.focus({ preventScroll: true });
  }
}
function revealFocus(event: KeyboardEvent) {
  if (event.key === 'Tab' || event.key.startsWith('Arrow')) quietFocus.value = false;
}

watch(() => props.session.isWaitingText.value, async waiting => {
  if (!waiting) return;
  await nextTick();
  focusInChat(inputRef.value);
});
watch(() => props.session.choices.value.length, async count => {
  if (!count) return;
  await nextTick();
  focusInChat(choicesRef.value?.querySelector('button'), true);
});
watch(() => props.session.isEnded.value, async ended => {
  if (!ended) return;
  await nextTick();
  focusInChat(restartRef.value, true);
});

function send() {
  if (!userInput.value.trim()) return;
  props.session.submit(userInput.value);
  userInput.value = '';
}

function start() {
  userInput.value = '';
  props.session.start();
}
</script>

<template>
  <div
    ref="rootRef"
    class="chat-interface"
    :class="{ 'quiet-focus': quietFocus }"
    :style="appearanceStyle(appearance)"
    @keydown="revealFocus"
  >
    <!-- Antes de começar -->
    <div v-if="!session.isActive.value" class="start-screen">
      <ChoiceMediaView v-if="appearance.avatar" :media="appearance.avatar" :size="56" />
      <Bot v-else :size="48" class="start-icon" />
      <h2>{{ appearance.welcomeTitle.trim() || t('chatbot.runtime.player.title') }}</h2>
      <p>{{ t('chatbot.runtime.player.desc') }}</p>
      <button class="btn-start" @click="start">
        <Play :size="16" fill="currentColor" />
        {{ t('chatbot.runtime.player.btn_start') }}
      </button>
    </div>

    <div v-else class="chat-container">
      <!-- role="log": leitores de tela anunciam cada mensagem nova -->
      <div class="messages" role="log" aria-live="polite" :aria-label="t('chatbot.runtime.chat.conversation')">
        <template v-for="message in session.messages.value" :key="message.id">
          <!-- Bot: mídia antes/depois do texto -->
          <div v-if="message.from === 'bot'" class="message message-bot">
            <div class="message-bubble">
              <div v-if="message.media?.position === 'before'" class="message-media">
                <MediaView :media="message.media.media" />
              </div>
              <ChatRichText v-if="!isRichTextEmpty(message.content)" :content="message.content" />
              <div v-if="message.media?.position === 'after'" class="message-media">
                <MediaView :media="message.media.media" />
              </div>
            </div>
          </div>

          <!-- Aluno: texto digitado ou opção escolhida (com emoji/imagem) -->
          <div v-else class="message message-user">
            <div class="message-bubble">
              <ChoiceMediaView v-if="message.media" :media="message.media" :size="28" />
              <span v-if="message.text">{{ message.text }}</span>
            </div>
          </div>
        </template>

        <!-- Digitando… -->
        <div v-if="session.isTyping.value" class="message message-bot">
          <div class="message-bubble typing">
            <span class="dot" aria-hidden="true"></span><span class="dot" aria-hidden="true"></span><span class="dot" aria-hidden="true"></span>
            <span class="sr-only">{{ t('chatbot.runtime.chat.typing') }}</span>
          </div>
        </div>

        <!-- Erro que interrompeu a conversa -->
        <div v-if="session.error.value" class="message message-bot">
          <div class="message-bubble message-error">
            <AlertTriangle :size="16" />
            <span>{{ t(`chatbot.runtime.errors.${session.error.value}`) }}</span>
          </div>
        </div>

        <!-- Opções da múltipla escolha -->
        <div v-if="session.choices.value.length > 0" ref="choicesRef" class="choices-container">
          <button v-for="choice in session.choices.value" :key="choice.id" class="choice-button" @click="session.choose(choice.id)">
            <ChoiceMediaView v-if="choice.media" :media="choice.media" :size="28" />
            <span v-if="choice.label">{{ choice.label }}</span>
          </button>
        </div>

        <p v-if="session.isEnded.value && !session.error.value" class="sr-only">{{ t('chatbot.runtime.chat.ended') }}</p>
        <div ref="endRef"></div>
      </div>

      <!-- Resposta aberta -->
      <div v-if="session.isWaitingText.value" class="input-area">
        <input
          ref="inputRef"
          v-model="userInput"
          :aria-label="t('chatbot.runtime.chat.placeholder')"
          type="text"
          :placeholder="t('chatbot.runtime.chat.placeholder')"
          @keyup.enter="send"
        />
        <button class="btn-send" @click="send">
          <Send :size="16" /> <span class="hide-mobile">{{ t('chatbot.runtime.chat.send') }}</span>
        </button>
      </div>

      <!-- Fim: recomeçar -->
      <div v-if="session.isEnded.value" class="restart-area">
        <button ref="restartRef" class="btn-restart" @click="start">
          <RefreshCw :size="16" /> {{ t('chatbot.runtime.chat.restart') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Cores, fonte e tamanho vêm do tema (variáveis --chat-*, ver domain/appearance.ts) */
.chat-interface {
  flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0;
  background-color: var(--chat-bg); background-image: var(--chat-bg-image);
  background-size: 200px 200px; background-attachment: local;
  color: var(--chat-text); font-family: var(--chat-font-family);
}

.start-screen {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; padding: 32px; text-align: center;
}
.start-icon { color: var(--chat-accent); }
.start-screen h2 { margin: 0; font-size: calc(var(--chat-font-size) + 5px); font-weight: 700; color: var(--chat-text); overflow-wrap: anywhere; }
.start-screen p { color: var(--chat-muted); font-size: var(--chat-font-size); margin: 0; max-width: 280px; line-height: 1.5; }
.btn-start {
  padding: 12px 24px; background: var(--chat-accent); color: var(--chat-on-accent); border: none; border-radius: 8px;
  font-family: inherit; font-size: var(--chat-font-size); font-weight: 700; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-start:hover { background: var(--chat-accent-hover); transform: translateY(-1px); }

.chat-container { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }

.message { display: flex; animation: slideIn 0.3s ease-out; }
@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.message-bot { justify-content: flex-start; }
.message-user { justify-content: flex-end; }

.message-bubble {
  max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: var(--chat-font-size); line-height: 1.5; word-wrap: break-word;
  display: flex; flex-direction: column; gap: 8px;
}
.message-bot .message-bubble {
  background: var(--chat-bot-bg); color: var(--chat-bot-text); border: 1px solid var(--chat-bot-border);
  border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.message-user .message-bubble {
  background: var(--chat-user-bg); color: var(--chat-user-text);
  border-bottom-right-radius: 4px; flex-direction: row; align-items: center;
}
.message-media { margin: -4px -6px; }
.message-error { flex-direction: row !important; align-items: center; color: #b91c1c !important; background: #fef2f2 !important; border-color: #fca5a5 !important; }

/* Digitando… */
.typing { flex-direction: row; gap: 4px; padding: 12px 14px; }
.typing .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--chat-muted); animation: blink 1.2s infinite ease-in-out; }
.typing .dot:nth-child(2) { animation-delay: 0.2s; }
.typing .dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0%, 80%, 100% { opacity: 0.3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }

/* Anel de foco na cor do tema, no lugar do preto do navegador */
.chat-interface button:focus-visible { outline: 3px solid var(--chat-accent); outline-offset: 2px; }
.quiet-focus button:focus-visible { outline: none; }

.choices-container { display: flex; flex-direction: column; gap: 8px; animation: slideIn 0.3s ease-out; }
.choice-button {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; background: var(--chat-surface); color: var(--chat-accent); border: 2px solid var(--chat-accent); border-radius: 8px;
  font-family: inherit; font-size: var(--chat-font-size); font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: left;
}
.choice-button:hover { background: color-mix(in srgb, var(--chat-accent) 12%, var(--chat-surface)); transform: translateX(4px); }

.input-area { display: flex; gap: 8px; padding: 12px; border-top: 1px solid var(--chat-border); background: var(--chat-surface); }
.input-area input {
  flex: 1; min-width: 0; padding: 10px 12px; border: 1px solid var(--chat-border); border-radius: 8px;
  background: var(--chat-surface); color: var(--chat-text); font-family: inherit; font-size: var(--chat-font-size);
}
.input-area input::placeholder { color: var(--chat-muted); }
.input-area input:focus { outline: none; border-color: var(--chat-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--chat-accent) 25%, transparent); }
.btn-send {
  padding: 10px 16px; background: var(--chat-accent); color: var(--chat-on-accent); border: none; border-radius: 8px;
  font-family: inherit; font-size: var(--chat-font-size); font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
}
.btn-send:hover { background: var(--chat-accent-hover); }

.restart-area { padding: 12px; border-top: 1px solid var(--chat-border); background: var(--chat-surface); text-align: center; }
.btn-restart {
  padding: 10px 20px; background: var(--chat-accent); color: var(--chat-on-accent); border: none; border-radius: 8px;
  font-family: inherit; font-size: var(--chat-font-size); font-weight: 700;
  cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
}
.btn-restart:hover { background: var(--chat-accent-hover); }

/* "Reduzir movimento" do sistema: sem animações de entrada nem pontinhos pulando */
@media (prefers-reduced-motion: reduce) {
  .message, .choices-container { animation: none; }
  .typing .dot { animation: none; opacity: 0.6; }
  .btn-start:hover, .choice-button:hover { transform: none; }
}

@media (max-width: 480px) {
  .hide-mobile { display: none; }
  .input-area input { font-size: max(16px, var(--chat-font-size)); /* evita zoom no iOS */ }
}
</style>
