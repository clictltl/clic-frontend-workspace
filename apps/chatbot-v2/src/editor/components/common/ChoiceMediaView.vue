<script setup lang="ts">
import { computed } from 'vue';
import type { ChoiceMedia } from '../../../shared/types/chatbot';
import { resolveMediaSource } from '../../utils/mediaSource';

const props = withDefaults(defineProps<{
  media: ChoiceMedia;
  size?: number; // px
}>(), {
  size: 24
});

const src = computed(() => (props.media.kind === 'image' ? resolveMediaSource(props.media.source) : undefined));
</script>

<template>
  <span v-if="media.kind === 'emoji'" class="choice-media clic-emoji" :style="{ fontSize: `${size}px` }">{{ media.emoji }}</span>
  <img v-else-if="src" class="choice-media choice-image" :src="src" alt="" :style="{ height: `${size}px` }" />
  <span v-else class="choice-media choice-image is-missing" :style="{ height: `${size}px`, width: `${size}px` }"></span>
</template>

<style scoped>
.choice-media { flex: 0 0 auto; line-height: 1; }
.choice-image { width: auto; max-width: 100%; border-radius: 4px; object-fit: contain; }
.choice-image.is-missing { display: inline-block; background: #e5e7eb; }
</style>
