<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowRight, ListChecks, MessagesSquare, Plus, Trash2 } from '@lucide/vue';
import PanelSection from '../../common/PanelSection.vue';
import { useProjectStore } from '../../../../shared/stores/projectStore';
import { getChoiceNode } from '../../../../shared/domain/graph';
import type { LinkChoice } from '../../../../shared/types/chatbot';
import DraftInput from '../../common/DraftInput.vue';
import ChoiceMediaPicker from '../../common/ChoiceMediaPicker.vue';
import ChatbotLinkField from '../../common/ChatbotLinkField.vue';

/**
 * Opções da múltipla escolha e do "Abrir outro chatbot" (este com o link de cada opção
 * e a opção fixa "Continuar", que segue pela saída do bloco).
 */
const props = defineProps<{ nodeId: string }>();
const { t } = useI18n();
const projectStore = useProjectStore();

const node = computed(() => getChoiceNode(projectStore.project, props.nodeId));
const isLinks = computed(() => node.value?.type === 'chatbot_links');
</script>

<template>
  <PanelSection
    v-if="node"
    :icon="isLinks ? MessagesSquare : ListChecks"
    :title="t(isLinks ? 'chatbot.properties.section_chatbot_links' : 'chatbot.properties.section_choices')"
  >
    <div class="list-container">
      <div v-for="choice in node.data.choices" :key="choice.id" :class="{ 'link-item': isLinks }">
        <div class="list-item">
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
        <ChatbotLinkField
          v-if="node.type === 'chatbot_links'"
          :token="(choice as LinkChoice).token"
          :target="(choice as LinkChoice).target"
          @change="(token, target) => projectStore.setChoiceLink(nodeId, choice.id, token, target)"
        />
      </div>
    </div>
    <button class="btn-outline" @click="projectStore.addChoice(nodeId)">
      <Plus :size="14" /> {{ t('chatbot.properties.add_choice') }}
    </button>
    <p v-if="isLinks" class="section-hint continue-hint"><ArrowRight :size="14" /> {{ t('chatbot.properties.chatbot_link_continue_hint') }}</p>
  </PanelSection>
</template>

<style scoped>
/* No "Abrir outro chatbot", cada opção é um cartãozinho: rótulo em cima, link embaixo */
.link-item { display: flex; flex-direction: column; gap: 6px; padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fdf2f8; }
.continue-hint { display: flex; align-items: center; gap: 6px; }
</style>
