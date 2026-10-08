<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Bot } from '@lucide/vue';
import type { Appearance } from '../types/chatbot';
import { appearanceStyle, THEME_COLORS } from '../domain/appearance';
import { useMediaResolver } from '../media/resolver';

/** Cabeçalho do chat com avatar e título, nas cores do tema (runtime e prévia no painel Testar). */
const props = defineProps<{
  title: string;
  appearance: Appearance;
}>();

const { t } = useI18n();
const resolve = useMediaResolver();

const avatar = computed(() => props.appearance.avatar);
const imageSrc = computed(() => (avatar.value?.kind === 'image' ? resolve(avatar.value.source) : undefined));
const accent = computed(() => THEME_COLORS[props.appearance.theme].accent);
const onAccent = computed(() => THEME_COLORS[props.appearance.theme].onAccent);
</script>

<template>
  <div class="chat-title-bar" :style="appearanceStyle(appearance)">
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
.avatar {
  flex: 0 0 auto; width: 32px; height: 32px; border-radius: 50%; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.avatar-emoji { font-size: 26px; line-height: 1; }
.avatar-image { width: 100%; height: 100%; object-fit: cover; background: white; }
.title { font-weight: 700; font-size: 15px; color: var(--chat-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
