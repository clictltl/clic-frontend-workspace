<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Link, Loader2, Upload } from '@lucide/vue';
import { useToast } from '@clic/shared';
import type { MediaSource } from '../../../shared/types/chatbot';
import { addImageAsset } from '../../../shared/stores/assetStore';
import { isSafeMediaUrl } from '../../../shared/domain/media';
import { pickImageFile } from '../../utils/pickImageFile';

/**
 * Escolhe a origem de uma mídia: enviar um arquivo ou colar um link.
 * Por enquanto aceita apenas imagens (inclui GIF); outros tipos entram aqui depois.
 */
const emit = defineEmits<{ select: [source: MediaSource] }>();
const { t } = useI18n();
const toast = useToast();

const mode = ref<'upload' | 'url'>('upload');
const url = ref('');
const urlError = ref(false);
const isUploading = ref(false);

async function upload() {
  if (isUploading.value) return;
  isUploading.value = true;
  try {
    const file = await pickImageFile();
    if (!file) return;
    emit('select', { kind: 'upload', assetId: await addImageAsset(file) });
  } catch (err) {
    toast.error((err as Error).message);
  } finally {
    isUploading.value = false;
  }
}

function useUrl() {
  const value = url.value.trim();
  if (!isSafeMediaUrl(value)) {
    urlError.value = true;
    return;
  }
  emit('select', { kind: 'url', url: value });
  url.value = '';
}
</script>

<template>
  <div class="media-picker">
    <div class="tabs">
      <button type="button" :class="{ active: mode === 'upload' }" @click="mode = 'upload'">
        <Upload :size="14" /> {{ t('chatbot.properties.media_upload') }}
      </button>
      <button type="button" :class="{ active: mode === 'url' }" @click="mode = 'url'">
        <Link :size="14" /> {{ t('chatbot.properties.media_url') }}
      </button>
    </div>

    <button v-if="mode === 'upload'" type="button" class="btn-upload" :disabled="isUploading" @click="upload">
      <Loader2 v-if="isUploading" :size="16" class="spin" />
      <Upload v-else :size="16" />
      {{ t('chatbot.properties.media_choose_file') }}
    </button>

    <div v-else class="url-row">
      <input
        v-model="url"
        type="url"
        :placeholder="t('chatbot.properties.media_url_placeholder')"
        @input="urlError = false"
        @keydown.enter="useUrl"
      />
      <button type="button" class="btn-confirm" @click="useUrl">{{ t('chatbot.editor.rich_text.confirm') }}</button>
    </div>
    <p v-if="mode === 'url' && urlError" class="error">{{ t('chatbot.properties.media_url_invalid') }}</p>
  </div>
</template>

<style scoped>
.media-picker { display: flex; flex-direction: column; gap: 8px; }
.tabs { display: flex; gap: 4px; background: #f3f4f6; padding: 3px; border-radius: 6px; }
.tabs button {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;
  border: none; background: transparent; padding: 5px; border-radius: 4px;
  font-size: 12px; color: #6b7280; cursor: pointer;
}
.tabs button.active { background: white; color: #111827; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
.btn-upload {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  border: 1px dashed #d1d5db; background: white; border-radius: 6px; padding: 10px;
  font-size: 13px; color: #374151; cursor: pointer;
}
.btn-upload:hover:not(:disabled) { border-color: #3b82f6; color: #1d4ed8; }
.url-row { display: flex; gap: 6px; }
.url-row input { flex: 1; min-width: 0; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; }
.btn-confirm { background: #3b82f6; color: white; border: none; border-radius: 4px; padding: 0 12px; font-size: 12px; font-weight: 600; cursor: pointer; }
.error { margin: 0; font-size: 12px; color: #dc2626; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
