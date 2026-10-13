<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowDownToLine, ArrowUpToLine, Image, Plus, Trash2, X } from '@lucide/vue';
import PanelSection from '../../common/PanelSection.vue';
import { useProjectStore } from '../../../../shared/stores/projectStore';
import type { MediaSource } from '../../../../shared/types/chatbot';
import MediaView from '../../../../shared/components/MediaView.vue';
import MediaSourcePicker from '../../common/MediaSourcePicker.vue';

const props = defineProps<{ nodeId: string }>();
const { t } = useI18n();
const projectStore = useProjectStore();

const nodeMedia = computed(() => {
  const node = projectStore.project.nodes[props.nodeId];
  return node && 'media' in node.data ? node.data.media : null;
});

// Sem imagem, a seção fica numa linha só; o seletor só abre quando pedido
const isPicking = ref(false);

function select(source: MediaSource) {
  projectStore.setNodeMedia(props.nodeId, { type: 'image', source });
  isPicking.value = false;
}
</script>

<template>
  <PanelSection :icon="Image" :title="t('chatbot.properties.section_image')">
    <template v-if="!nodeMedia" #actions>
      <button v-if="!isPicking" type="button" class="btn-text" @click="isPicking = true">
        <Plus :size="14" /> {{ t('chatbot.properties.add_short') }}
      </button>
      <button v-else type="button" class="btn-icon" :title="t('global.cancel')" :aria-label="t('global.cancel')" @click="isPicking = false">
        <X :size="16" />
      </button>
    </template>

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

    <MediaSourcePicker v-else-if="isPicking" @select="select" />
  </PanelSection>
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
