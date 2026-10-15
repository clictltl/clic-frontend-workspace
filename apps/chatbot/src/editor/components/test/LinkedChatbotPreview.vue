<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowLeft, ExternalLink, MessagesSquare } from '@lucide/vue';
import type { ChatChoice } from '../../../shared/engine/types';
import type { Appearance } from '../../../shared/types/chatbot';
import { appearanceStyle } from '../../../shared/domain/appearance';
import { linkUrlFor } from '../../utils/chatbotLinks';
import ChoiceMediaView from '../../../shared/components/ChoiceMediaView.vue';

/**
 * "Abrir outro chatbot" no Testar: tela simulada, sem carregar o projeto de destino
 * (o replay reconstrói só com "abriu a opção X" / "voltou"). O chatbot de verdade abre no publicado.
 */
// Nas cores do tema do chatbot atual (o destino real só aparece no publicado)
const props = defineProps<{ choice: ChatChoice; appearance: Appearance }>();
const emit = defineEmits<{ back: [] }>();
const { t } = useI18n();

const href = computed(() => (props.choice.token ? linkUrlFor(props.choice.token) : null));
</script>

<template>
  <section class="linked-preview" :style="appearanceStyle(appearance)">
    <header class="preview-header">
      <button type="button" class="back-button" :title="t('chatbot.runtime.chat.back')" :aria-label="t('chatbot.runtime.chat.back')" @click="emit('back')">
        <ArrowLeft :size="20" />
      </button>
      <ChoiceMediaView v-if="choice.media" :media="choice.media" :size="24" />
      <span class="preview-title">{{ choice.label }}</span>
    </header>
    <div class="preview-body">
      <MessagesSquare :size="40" class="preview-icon" />
      <p>{{ t('chatbot.editor.test.linked_preview') }}</p>
      <p v-if="!choice.token" class="no-link">{{ t('chatbot.editor.no_link') }}</p>
      <a v-else-if="href" :href="href" target="_blank" rel="noopener" class="btn-open">
        <ExternalLink :size="16" /> {{ t('chatbot.editor.test.open_linked_tab') }}
      </a>
      <button type="button" class="btn-back" @click="emit('back')">
        <ArrowLeft :size="16" /> {{ t('chatbot.runtime.chat.back') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
/* Cores do tema atual (variáveis --chat-*, ver domain/appearance.ts) */
.linked-preview {
  position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column;
  background-color: var(--chat-bg); background-image: var(--chat-bg-image); font-family: var(--chat-font-family); color: var(--chat-text);
}
.preview-header { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: var(--chat-surface); border-bottom: 1px solid var(--chat-border); }
.preview-title { font-weight: 700; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.back-button {
  flex: 0 0 auto; width: 36px; height: 36px; margin: -4px 0 -4px -6px; border: none; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; background: transparent; color: var(--chat-text); cursor: pointer;
}
.back-button:hover { background: color-mix(in srgb, var(--chat-accent) 12%, transparent); }
.preview-body { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px; text-align: center; font-size: 14px; line-height: 1.5; }
.preview-body p { margin: 0; padding: 10px 14px; border-radius: 12px; background: var(--chat-bot-bg); color: var(--chat-bot-text); border: 1px solid var(--chat-bot-border); }
.preview-body p.no-link { padding: 0; background: none; border: none; color: var(--chat-muted); font-style: italic; }
.preview-icon { color: var(--chat-accent); }
.btn-open, .btn-back {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; font-family: inherit;
}
.btn-open { background: var(--chat-accent); color: var(--chat-on-accent); border: none; }
.btn-open:hover { background: var(--chat-accent-hover); }
.btn-back { background: var(--chat-surface); color: var(--chat-accent); border: 2px solid var(--chat-accent); }
.btn-open:focus-visible, .btn-back:focus-visible, .back-button:focus-visible { outline: 3px solid var(--chat-accent); outline-offset: 2px; }
</style>
