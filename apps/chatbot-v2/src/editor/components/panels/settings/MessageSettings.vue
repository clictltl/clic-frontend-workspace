<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Timer } from '@lucide/vue';
import { useProjectStore } from '../../../../shared/stores/projectStore';
import { getNodeOfType } from '../../../../shared/domain/graph';
import DraftInput from '../../common/DraftInput.vue';

const props = defineProps<{ nodeId: string }>();
const { t } = useI18n();
const projectStore = useProjectStore();

const node = computed(() => getNodeOfType(projectStore.project, props.nodeId, 'message'));
</script>

<template>
  <div v-if="node" class="form-group">
    <label class="delay-label"><Timer :size="14" /> {{ t('chatbot.properties.delay_label') }}</label>
    <div class="delay-row">
      <DraftInput
        type="number"
        :model-value="node.data.delay"
        @commit="value => projectStore.setMessageDelay(nodeId, Number(value))"
      />
      <span>{{ t('chatbot.properties.delay_unit') }}</span>
    </div>
  </div>
</template>

<style scoped>
.delay-label { display: flex; align-items: center; gap: 6px; }
.delay-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #4b5563; }
.delay-row input { width: 80px; }
</style>
