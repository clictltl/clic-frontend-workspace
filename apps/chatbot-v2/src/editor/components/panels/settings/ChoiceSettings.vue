<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, Trash2 } from '@lucide/vue';
import { useProjectStore } from '../../../../shared/stores/projectStore';
import { getNodeOfType } from '../../../../shared/domain/graph';
import DraftInput from '../../common/DraftInput.vue';

const props = defineProps<{ nodeId: string }>();
const { t } = useI18n();
const projectStore = useProjectStore();

const node = computed(() => getNodeOfType(projectStore.project, props.nodeId, 'choice_question'));
</script>

<template>
  <div v-if="node" class="form-group">
    <label>{{ t('chatbot.properties.choices_label') }}</label>
    <div class="list-container">
      <div v-for="choice in node.data.choices" :key="choice.id" class="list-item">
        <DraftInput
          :model-value="choice.label"
          :placeholder="t('chatbot.properties.new_choice')"
          @commit="label => projectStore.renameChoice(nodeId, choice.id, label)"
        />
        <button
          class="btn-icon danger"
          :disabled="node.data.choices.length <= 1"
          :title="t('chatbot.properties.delete_choice')"
          @click="projectStore.removeChoice(nodeId, choice.id)"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </div>
    <button class="btn-outline" @click="projectStore.addChoice(nodeId)">
      <Plus :size="14" /> {{ t('chatbot.properties.add_choice') }}
    </button>
  </div>
</template>
