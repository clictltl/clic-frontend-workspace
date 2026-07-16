<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Block, Variable } from '@/shared/types/chatbot';
import { useChatRuntime } from '@/runtime/engine/useChatRuntime';
import { useAssetStore } from '@/editor/composables/useAssetStore';
import { Play, Square, Maximize2, Minimize2 } from '@lucide/vue';
import ChatInterface from '@/shared/components/ChatInterface.vue';

const props = defineProps<{
  blocks: Block[];
  variables: Record<string, Variable>;
}>();

const emit = defineEmits<{
  'toggle-fullscreen': [];
}>();

const { t } = useI18n();
const assetStore = useAssetStore();
const isFullscreen = ref(false);

function getRuntimeOptions() {
  return {
    blocks: props.blocks,
    variables: props.variables,
    resolveAsset: (id: string) => assetStore.getAssetSrc(id)
  };
}

const runtime = ref<ReturnType<typeof useChatRuntime>>(useChatRuntime(getRuntimeOptions()));
const r = computed(() => runtime.value);

watch(
  () => props.blocks,
  () => { runtime.value = useChatRuntime(getRuntimeOptions()); },
  { deep: true }
);

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
  emit('toggle-fullscreen');
}
</script>

<template>
  <div class="preview-panel">
    <div class="preview-toolbar">
      <button class="btn-toolbar btn-run" @click="r.start()">
        <Play :size="14" fill="currentColor" /> {{ r.isRunning ? t('chatbot.runtime.toolbar.restart') : t('chatbot.runtime.toolbar.start') }}
      </button>

      <button
        class="btn-toolbar btn-stop"
        @click="r.stopChat()"
        :disabled="!r.isRunning && r.messages.length === 0"
      >
        <Square :size="14" fill="currentColor" /> {{ t('chatbot.runtime.toolbar.stop') }}
      </button>

      <button
        @click="toggleFullscreen"
        class="btn-fullscreen"
        :title="isFullscreen ? t('chatbot.runtime.toolbar.collapse') : t('chatbot.runtime.toolbar.expand')"
      >
        <Minimize2 v-if="isFullscreen" :size="18" />
        <Maximize2 v-else :size="18" />
      </button>
    </div>

    <!-- Interface unificada -->
    <ChatInterface :runtime="r" mode="preview" />
  </div>
</template>

<style scoped>
.preview-panel {
  height: 100%; display: flex; flex-direction: column; background: #f9fafb; position: relative;
}
.preview-toolbar {
  position: sticky; top: 0; z-index: 200; display: flex; gap: 10px; padding: 10px 12px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;
}
.btn-toolbar {
  height: 36px; padding: 0 12px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 700; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px;
}
.btn-run { background: #10b981; color: white; }
.btn-run:hover { background: #059669; transform: translateY(-1px); }
.btn-stop { background: #ef4444; color: white; }
.btn-stop:hover { background: #dc2626; transform: translateY(-1px); }
.btn-toolbar:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.btn-fullscreen {
  margin-left: auto; width: 36px; height: 36px; padding: 0; background: white; color: #6b7280; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.btn-fullscreen:hover {
  background: #f9fafb; color: #3b82f6; border-color: #3b82f6; transform: scale(1.1); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}
.btn-fullscreen:active { transform: scale(0.95); }
</style>