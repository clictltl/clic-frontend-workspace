<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Timer } from '@lucide/vue';
import PanelSection from '../../common/PanelSection.vue';
import { useProjectStore } from '../../../../shared/stores/projectStore';
import { getNodeOfType } from '../../../../shared/domain/graph';
import DraftInput from '../../common/DraftInput.vue';

const props = defineProps<{ nodeId: string }>();
const { t } = useI18n();
const projectStore = useProjectStore();

const node = computed(() => getNodeOfType(projectStore.project, props.nodeId, 'message'));
</script>

<template>
  <PanelSection v-if="node" :icon="Timer" :title="t('chatbot.properties.section_delay')">
    <div class="delay-row">
      <DraftInput
        type="number"
        :aria-label="t('chatbot.properties.delay_label')"
        :model-value="node.data.delay"
        @commit="value => projectStore.setMessageDelay(nodeId, Number(value))"
      />
      <span>{{ t('chatbot.properties.delay_unit') }}</span>
    </div>
    <p class="section-hint">{{ t('chatbot.properties.delay_hint') }}</p>
  </PanelSection>
</template>

<style scoped>
.delay-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #4b5563; }
.delay-row input { width: 80px; }
</style>
