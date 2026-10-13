<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ListChecks, Plus, Trash2 } from '@lucide/vue';
import PanelSection from '../../common/PanelSection.vue';
import { useProjectStore } from '../../../../shared/stores/projectStore';
import { getNodeOfType } from '../../../../shared/domain/graph';
import DraftInput from '../../common/DraftInput.vue';
import ChoiceMediaPicker from '../../common/ChoiceMediaPicker.vue';

const props = defineProps<{ nodeId: string }>();
const { t } = useI18n();
const projectStore = useProjectStore();

const node = computed(() => getNodeOfType(projectStore.project, props.nodeId, 'choice_question'));
</script>

<template>
  <PanelSection v-if="node" :icon="ListChecks" :title="t('chatbot.properties.section_choices')">
    <div class="list-container">
      <div v-for="choice in node.data.choices" :key="choice.id" class="list-item">
        <ChoiceMediaPicker :media="choice.media" @change="media => projectStore.setChoiceMedia(nodeId, choice.id, media)" />
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
  </PanelSection>
</template>
