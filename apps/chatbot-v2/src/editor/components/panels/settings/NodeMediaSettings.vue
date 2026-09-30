<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowDownToLine, ArrowUpToLine, Trash2 } from '@lucide/vue';
import { useProjectStore } from '../../../../shared/stores/projectStore';
import type { MediaSource } from '../../../../shared/types/chatbot';
import MediaView from '../../common/MediaView.vue';
import MediaSourcePicker from '../../common/MediaSourcePicker.vue';

const props = defineProps<{ nodeId: string }>();
const { t } = useI18n();
const projectStore = useProjectStore();

const nodeMedia = computed(() => {
  const node = projectStore.project.nodes[props.nodeId];
  return node && 'media' in node.data ? node.data.media : null;
});

function select(source: MediaSource) {
  projectStore.setNodeMedia(props.nodeId, { type: 'image', source });
}
</script>

<template>
  <div class="form-group">
    <label>{{ t('chatbot.properties.media_label') }}</label>

    <template v-if="nodeMedia">
      <MediaView :media="nodeMedia.media" />
      <div class="media-actions">
        <div class="position-toggle">
          <button
            type="button"
            :class="{ active: nodeMedia.position === 'before' }"
            @click="projectStore.setMediaPosition(nodeId, 'before')"
          >
            <ArrowUpToLine :size="14" /> {{ t('chatbot.properties.media_before') }}
          </button>
          <button
            type="button"
            :class="{ active: nodeMedia.position === 'after' }"
            @click="projectStore.setMediaPosition(nodeId, 'after')"
          >
            <ArrowDownToLine :size="14" /> {{ t('chatbot.properties.media_after') }}
          </button>
        </div>
        <button class="btn-icon danger" :title="t('chatbot.properties.media_remove')" @click="projectStore.setNodeMedia(nodeId, null)">
          <Trash2 :size="14" />
        </button>
      </div>
    </template>

    <MediaSourcePicker v-else @select="select" />
  </div>
</template>

<style scoped>
.media-actions { display: flex; align-items: center; gap: 6px; }
.position-toggle { flex: 1; display: flex; gap: 4px; background: #f3f4f6; padding: 3px; border-radius: 6px; }
.position-toggle button {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;
  border: none; background: transparent; padding: 5px; border-radius: 4px;
  font-size: 12px; color: #6b7280; cursor: pointer;
}
.position-toggle button.active { background: white; color: #111827; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
</style>
