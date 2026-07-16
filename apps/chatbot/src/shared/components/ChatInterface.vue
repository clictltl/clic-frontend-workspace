<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { UnwrapRef } from 'vue'; // Import do utilitário nativo do Vue
import { useI18n } from 'vue-i18n';
import { Play, Send, RefreshCw, Bot, AlertTriangle } from '@lucide/vue';
import type { useChatRuntime } from '@/runtime/engine/useChatRuntime';

// Usamos UnwrapRef para dizer ao TS que os Refs internos já foram desempacotados pelo componente pai
const props = defineProps<{
  runtime: UnwrapRef<ReturnType<typeof useChatRuntime>>;
  mode: 'preview' | 'runtime';
}>();

const { t } = useI18n();

const userInput = ref('');
const chatEndRef = ref<HTMLDivElement | null>(null);

// Mapeamento dinâmico de erros para o i18n
const getErrorMessage = (code: string) => {
  const key = `chatbot.runtime.errors.${code}`;
  const translated = t(key);
  return translated !== key ? translated : null;
};

// Autoscroll - Agora o TS sabe que 'messages' é um Array puro e aceita o .length
watch(
  () => props.runtime.messages.length,
  async () => {
    await nextTick();
    chatEndRef.value?.scrollIntoView({ behavior: 'smooth' });
  }
);

function startChat() {
  userInput.value = '';
  props.runtime.start();
}

function handleSendMessage() {
  if (!userInput.value.trim()) return;
  props.runtime.submitText(userInput.value);
  userInput.value = '';
}
</script>

<template>
  <div class="chat-interface">
    <!-- Tela inicial antes de começar -->
    <div v-if="!runtime.isRunning && runtime.messages.length === 0" class="start-screen">
      <div class="start-icon">
        <Bot :size="48" color="#3b82f6" />
      </div>
      <h3>{{ mode === 'preview' ? t('chatbot.runtime.preview.title') : t('chatbot.runtime.player.title') }}</h3>
      <p>{{ mode === 'preview' ? t('chatbot.runtime.preview.desc') : t('chatbot.runtime.player.desc') }}</p>
      
      <button @click="startChat" class="btn-start">
        <Play :size="16" fill="currentColor" /> 
        {{ mode === 'preview' ? t('chatbot.runtime.preview.btn_start') : t('chatbot.runtime.player.btn_start') }}
      </button>
    </div>

    <!-- Área do chat ativo -->
    <div v-else class="chat-container">
      <div class="messages">
        <!-- Mensagens -->
        <div
          v-for="message in runtime.messages"
          :key="message.id"
          :class="[
            'message',
            message.type === 'bot' || message.type === 'image' ? 'message-bot' : 'message-user'
          ]"
        >
          <div v-if="message.type === 'image'" class="message-image">
            <img
              :src="message.content"
              alt="Imagem do chatbot"
              @error="(e) => { (e.target as HTMLImageElement).style.display = 'none'; }"
              @load="(e) => { (e.target as HTMLImageElement).style.display = 'block'; }"
            />
          </div>
          <div v-else class="message-bubble" :class="{ 'message-error': getErrorMessage(message.content) }">
            <div v-if="getErrorMessage(message.content)" class="error-content">
              <AlertTriangle :size="16" />
              <span>{{ getErrorMessage(message.content) }}</span>
            </div>
            <div v-else class="rich-text-content" v-html="message.content"></div>
          </div>
        </div>

        <!-- Botões de múltipla escolha -->
        <div v-if="runtime.currentChoices.length > 0" class="choices-container">
          <button
            v-for="choice in runtime.currentChoices"
            :key="choice.id"
            @click="runtime.selectChoice(choice)"
            class="choice-button"
          >
            {{ choice.label }}
          </button>
        </div>

        <div ref="chatEndRef" />
      </div>

      <!-- Campo de entrada para perguntas abertas -->
      <div v-if="runtime.isWaitingForInput" class="input-area">
        <input
          v-model="userInput"
          type="text"
          :placeholder="t('chatbot.runtime.chat.placeholder')"
          @keyup.enter="handleSendMessage"
          autofocus
        />
        <button @click="handleSendMessage" class="btn-send">
          <Send :size="16" /> <span class="hide-mobile">{{ t('chatbot.runtime.chat.send') }}</span>
        </button>
      </div>

      <!-- Botão para reiniciar o chat -->
      <div v-if="!runtime.isWaitingForInput && runtime.currentChoices.length === 0 && !runtime.isRunning" class="restart-area">
        <button @click="startChat" class="btn-restart">
          <RefreshCw :size="16" /> {{ t('chatbot.runtime.chat.restart') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-interface {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: transparent;
}

/* Telas e Containers (Copiados e unificados do seu código original) */
.start-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px;
  text-align: center;
}
.start-icon { margin-bottom: 8px; display: flex; align-items: center; justify-content: center; }
.start-screen h3 { margin: 0; font-size: 18px; font-weight: 700; color: #111827; }
.start-screen p { color: #6b7280; font-size: 14px; margin: 0; max-width: 280px; line-height: 1.5; }
.btn-start {
  padding: 12px 24px; background: #10b981; color: white; border: none; border-radius: 8px;
  font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-start:hover { background: #059669; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }

.chat-container { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

.messages {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 12px;
}
.message { display: flex; animation: slideIn 0.3s ease-out; }
@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.message-bot { justify-content: flex-start; }
.message-user { justify-content: flex-end; }

.message-bubble {
  max-width: 75%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; word-wrap: break-word;
}
.error-content { display: flex; align-items: center; gap: 6px; }
.message-bot .message-bubble {
  background: white; color: #374151; border: 1px solid #e5e7eb; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.message-user .message-bubble {
  background: #3b82f6; color: white; border-bottom-right-radius: 4px; box-shadow: 0 1px 3px rgba(59, 130, 246, 0.4);
}
.message-image {
  max-width: 75%; border-radius: 12px; overflow: hidden; background: white; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.message-image img { display: block; width: 100%; height: auto; max-height: 360px; object-fit: contain; }

.choices-container { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; animation: slideIn 0.3s ease-out; }
.choice-button {
  padding: 10px 16px; background: white; color: #3b82f6; border: 2px solid #3b82f6; border-radius: 8px;
  font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; text-align: left;
}
.choice-button:hover { background: #3b82f6; color: white; transform: translateX(4px); }

.input-area { display: flex; gap: 8px; padding: 12px; border-top: 1px solid #e5e7eb; background: white; }
.input-area input { flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; transition: all 0.2s; }
.input-area input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.btn-send {
  padding: 10px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px;
}
.btn-send:hover { background: #2563eb; transform: translateY(-1px); }

.restart-area { padding: 12px; border-top: 1px solid #e5e7eb; background: white; text-align: center; }
.btn-restart {
  padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
}
.btn-restart:hover { background: #059669; transform: translateY(-1px); }

.rich-text-content :deep(p) { margin: 0 0 0.5em 0; }
.rich-text-content :deep(p:last-child) { margin-bottom: 0; }
.rich-text-content :deep(ul), .rich-text-content :deep(ol) { padding-left: 20px; margin: 0 0 0.5em 0; }
.rich-text-content :deep(h3) { margin: 0 0 0.5em 0; font-size: 15px; }
.rich-text-content :deep(blockquote) { border-left: 3px solid rgba(0,0,0,0.1); margin: 0; padding-left: 10px; opacity: 0.9; }
.rich-text-content :deep(a) { color: inherit; text-decoration: underline; font-weight: 600; }
.rich-text-content :deep(code) { background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 12px; }

@media (max-width: 480px) {
  .hide-mobile { display: none; }
  .input-area input { font-size: 16px; /* evita zoom no iOS */ }
}
</style>