<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ImageOff, Music, Video } from '@lucide/vue';
import type { Media } from '../../../shared/types/chatbot';
import { resolveMediaSource } from '../../utils/mediaSource';

/**
 * Exibe a mídia de um nó. Tipos ainda não suportados pelo editor (vídeo, áudio)
 * aparecem como um espaço reservado, sem quebrar projetos feitos em versões futuras.
 */
const props = defineProps<{ media: Media }>();
const { t } = useI18n();

const src = computed(() => (props.media.type === 'image' ? resolveMediaSource(props.media.source) : undefined));

// Link quebrado ou arquivo local ausente: mostra o aviso no lugar da imagem
const failed = ref(false);
watch(src, () => { failed.value = false; });
</script>

<template>
  <img v-if="media.type === 'image' && src && !failed" class="media-view" :src="src" alt="" @error="failed = true" />
  <div v-else class="media-placeholder">
    <ImageOff v-if="media.type === 'image'" :size="18" />
    <Video v-else-if="media.type === 'video'" :size="18" />
    <Music v-else :size="18" />
    <span>{{ media.type === 'image' ? t('chatbot.properties.media_broken') : t('chatbot.properties.media_unsupported') }}</span>
  </div>
</template>

<style scoped>
.media-view { display: block; max-width: 100%; max-height: 200px; margin: 0 auto; border-radius: 6px; }
.media-placeholder {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 48px; padding: 8px; border-radius: 6px;
  background: #f3f4f6; color: #9ca3af; font-size: 11px; text-align: center;
}
</style>
