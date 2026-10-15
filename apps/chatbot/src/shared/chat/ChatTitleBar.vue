<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowLeft, Bot } from '@lucide/vue';
import type { Appearance } from '../types/chatbot';
import { appearanceStyle, THEME_COLORS } from '../domain/appearance';
import { useMediaResolver } from '../media/resolver';

/**
 * Cabeçalho do chat com avatar e título, nas cores do tema (runtime e prévia no painel Testar).
 * `showBack`: chatbot aberto por "Abrir outro chatbot", com o botão de voltar ao anterior.
 */
const props = defineProps<{
  title: string;
  appearance: Appearance;
  showBack?: boolean;
}>();

const emit = defineEmits<{ back: [] }>();

const { t } = useI18n();
const resolve = useMediaResolver();

const avatar = computed(() => props.appearance.avatar);
const imageSrc = computed(() => (avatar.value?.kind === 'image' ? resolve(avatar.value.source) : undefined));
const accent = computed(() => THEME_COLORS[props.appearance.theme].accent);
const onAccent = computed(() => THEME_COLORS[props.appearance.theme].onAccent);
</script>

<template>
  <div class="chat-title-bar" :style="appearanceStyle(appearance)">
    <button
      v-if="showBack"
      type="button"
      class="back-button"
      :title="t('chatbot.runtime.chat.back')"
      :aria-label="t('chatbot.runtime.chat.back')"
      @click="emit('back')"
    >
      <ArrowLeft :size="20" />
    </button>
    <span class="avatar" :style="{ background: avatar?.kind === 'emoji' ? 'transparent' : accent }">
      <span v-if="avatar?.kind === 'emoji'" class="avatar-emoji clic-emoji">{{ avatar.emoji }}</span>
      <img v-else-if="imageSrc" class="avatar-image" :src="imageSrc" alt="" />
      <Bot v-else :size="18" :color="onAccent" />
    </span>
    <span class="title">{{ title.trim() || t('chatbot.runtime.status.chat_title') }}</span>
  </div>
</template>

<style scoped>
.chat-title-bar {
  display: flex; align-items: center; gap: 10px; min-width: 0; flex: 0 0 auto;
  padding: 10px 14px; background: var(--chat-surface); border-bottom: 1px solid var(--chat-border);
  font-family: var(--chat-font-family);
}
.back-button {
  flex: 0 0 auto; width: 36px; height: 36px; margin: -4px 0 -4px -6px; border: none; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  background: transparent; color: var(--chat-text);
}
.back-button:hover { background: color-mix(in srgb, var(--chat-accent) 12%, transparent); }
.back-button:focus-visible { outline: 3px solid var(--chat-accent); outline-offset: 1px; }
.avatar {
  flex: 0 0 auto; width: 32px; height: 32px; border-radius: 50%; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.avatar-emoji { font-size: 26px; line-height: 1; }
.avatar-image { width: 100%; height: 100%; object-fit: cover; background: white; }
.title { font-weight: 700; font-size: 15px; color: var(--chat-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
