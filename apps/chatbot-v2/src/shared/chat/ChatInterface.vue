<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { AlertTriangle, Bot, Play, RefreshCw, Send } from '@lucide/vue';
import type { ChatSession } from './useChatSession';
import { isRichTextEmpty } from '../domain/richText';
import ChatRichText from './ChatRichText.vue';
import MediaView from '../components/MediaView.vue';
import ChoiceMediaView from '../components/ChoiceMediaView.vue';

/** Conversa com o chatbot: usada no "Testar" do editor e no runtime do aluno. */
const props = defineProps<{
  session: ChatSession;
  mode: 'test' | 'runtime';
}>();

const { t } = useI18n();
const userInput = ref('');
const endRef = ref<HTMLDivElement | null>(null);

// Rola até o fim a cada mensagem nova, "digitando…" ou opções
watch(
  () => [props.session.messages.value.length, props.session.isTyping.value, props.session.choices.value.length],
  async () => {
    await nextTick();
    endRef.value?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
);

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
  <div class="chat-interface">
    <!-- Antes de começar -->
    <div v-if="!session.isActive.value" class="start-screen">
      <Bot :size="48" color="#3b82f6" />
      <h3>{{ mode === 'test' ? t('chatbot.runtime.preview.title') : t('chatbot.runtime.player.title') }}</h3>
      <p>{{ mode === 'test' ? t('chatbot.runtime.preview.desc') : t('chatbot.runtime.player.desc') }}</p>
      <button class="btn-start" @click="start">
        <Play :size="16" fill="currentColor" />
        {{ mode === 'test' ? t('chatbot.runtime.preview.btn_start') : t('chatbot.runtime.player.btn_start') }}
      </button>
    </div>

    <div v-else class="chat-container">
      <div class="messages">
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
        <div v-if="session.isTyping.value" class="message message-bot" :aria-label="t('chatbot.runtime.chat.typing')">
          <div class="message-bubble typing"><span></span><span></span><span></span></div>
        </div>

        <!-- Erro que interrompeu a conversa -->
        <div v-if="session.error.value" class="message message-bot">
          <div class="message-bubble message-error">
            <AlertTriangle :size="16" />
            <span>{{ t(`chatbot.runtime.errors.${session.error.value}`) }}</span>
          </div>
        </div>

        <!-- Opções da múltipla escolha -->
        <div v-if="session.choices.value.length > 0" class="choices-container">
          <button v-for="choice in session.choices.value" :key="choice.id" class="choice-button" @click="session.choose(choice.id)">
            <ChoiceMediaView v-if="choice.media" :media="choice.media" :size="28" />
            <span v-if="choice.label">{{ choice.label }}</span>
          </button>
        </div>

        <div ref="endRef"></div>
      </div>

      <!-- Resposta aberta -->
      <div v-if="session.isWaitingText.value" class="input-area">
        <input
          v-model="userInput"
          type="text"
          :placeholder="t('chatbot.runtime.chat.placeholder')"
          @keyup.enter="send"
          autofocus
        />
        <button class="btn-send" @click="send">
          <Send :size="16" /> <span class="hide-mobile">{{ t('chatbot.runtime.chat.send') }}</span>
        </button>
      </div>

      <!-- Fim: recomeçar -->
      <div v-if="session.isEnded.value" class="restart-area">
        <button class="btn-restart" @click="start">
          <RefreshCw :size="16" /> {{ t('chatbot.runtime.chat.restart') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-interface { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: transparent; min-height: 0; }

.start-screen {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; padding: 32px; text-align: center;
}
.start-screen h3 { margin: 0; font-size: 18px; font-weight: 700; color: #111827; }
.start-screen p { color: #6b7280; font-size: 14px; margin: 0; max-width: 280px; line-height: 1.5; }
.btn-start {
  padding: 12px 24px; background: #10b981; color: white; border: none; border-radius: 8px;
  font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-start:hover { background: #059669; transform: translateY(-1px); }

.chat-container { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }

.message { display: flex; animation: slideIn 0.3s ease-out; }
@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.message-bot { justify-content: flex-start; }
.message-user { justify-content: flex-end; }

.message-bubble {
  max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; word-wrap: break-word;
  display: flex; flex-direction: column; gap: 8px;
}
.message-bot .message-bubble { background: white; color: #374151; border: 1px solid #e5e7eb; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.message-user .message-bubble { background: #3b82f6; color: white; border-bottom-right-radius: 4px; flex-direction: row; align-items: center; }
.message-media { margin: -4px -6px; }
.message-error { flex-direction: row !important; align-items: center; color: #b91c1c !important; background: #fef2f2 !important; border-color: #fca5a5 !important; }

/* Digitando… */
.typing { flex-direction: row; gap: 4px; padding: 12px 14px; }
.typing span { width: 6px; height: 6px; border-radius: 50%; background: #9ca3af; animation: blink 1.2s infinite ease-in-out; }
.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0%, 80%, 100% { opacity: 0.3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }

.choices-container { display: flex; flex-direction: column; gap: 8px; animation: slideIn 0.3s ease-out; }
.choice-button {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; background: white; color: #3b82f6; border: 2px solid #3b82f6; border-radius: 8px;
  font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; text-align: left;
}
.choice-button:hover { background: #eff6ff; transform: translateX(4px); }

.input-area { display: flex; gap: 8px; padding: 12px; border-top: 1px solid #e5e7eb; background: white; }
.input-area input { flex: 1; min-width: 0; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; }
.input-area input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.btn-send {
  padding: 10px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
}
.btn-send:hover { background: #2563eb; }

.restart-area { padding: 12px; border-top: 1px solid #e5e7eb; background: white; text-align: center; }
.btn-restart {
  padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
  cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
}
.btn-restart:hover { background: #059669; }

@media (max-width: 480px) {
  .hide-mobile { display: none; }
  .input-area input { font-size: 16px; /* evita zoom no iOS */ }
}
</style>
