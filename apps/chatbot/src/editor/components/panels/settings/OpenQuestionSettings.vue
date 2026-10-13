<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Save, SaveOff } from '@lucide/vue';
import { useProjectStore } from '../../../../shared/stores/projectStore';
import { getNodeOfType } from '../../../../shared/domain/graph';
import VariableSelect from '../../common/VariableSelect.vue';
import PanelSection from '../../common/PanelSection.vue';

const props = defineProps<{ nodeId: string }>();
const { t } = useI18n();
const projectStore = useProjectStore();

const node = computed(() => getNodeOfType(projectStore.project, props.nodeId, 'open_question'));
// Variável apagada conta como "não guarda" (igual ao rodapé do bloco no canvas)
const savedIn = computed(() => {
  const id = node.value?.data.variableId;
  return id ? projectStore.project.variables[id]?.name ?? null : null;
});
</script>

<template>
  <!-- Mesmas cores do rodapé do bloco: verde quando guarda, amarelo quando não -->
  <PanelSection
    v-if="node"
    :icon="savedIn ? Save : SaveOff"
    :title="t('chatbot.properties.section_answer')"
    :tone="savedIn ? 'success' : 'warning'"
  >
    <VariableSelect
      :model-value="node.data.variableId"
      :none-label="`(${t('chatbot.properties.save_answer_none')})`"
      @change="variableId => projectStore.setAnswerVariable(nodeId, variableId)"
    />
    <p class="section-hint">
      <i18n-t v-if="savedIn" keypath="chatbot.editor.answer_saved_in" tag="span">
        <template #variable><span class="var-pill">{{ savedIn }}</span></template>
      </i18n-t>
      <span v-else>{{ t('chatbot.editor.answer_not_saved') }}</span>
    </p>
  </PanelSection>
</template>
