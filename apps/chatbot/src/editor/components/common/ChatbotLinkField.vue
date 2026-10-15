<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { CircleAlert, ExternalLink, MessagesSquare, RefreshCw } from '@lucide/vue';
import type { LinkTarget } from '../../../shared/types/chatbot';
import { tokenFromPublishedLink } from '../../../shared/domain/publishedLink';
import { appBaseUrl, checkLink, linkUrlFor } from '../../utils/chatbotLinks';
import DraftInput from './DraftInput.vue';

/**
 * Link de uma opção do "Abrir outro chatbot". O autor cola o link publicado completo; o projeto guarda
 * o token e o título/emoji do destino conferidos na hora (no WordPress). Reabrir o painel mostra o que
 * ficou salvo, sem consultar; o botão de atualizar confere de novo quando o autor quiser.
 */
const props = defineProps<{ token: string; target: LinkTarget | null }>();
const emit = defineEmits<{ change: [token: string, target: LinkTarget | null] }>();
const { t } = useI18n();

const canCheck = !!appBaseUrl();
const isInvalid = ref(false);
const isChecking = ref(false);
// "Não encontrado" só aparece logo depois de uma conferência (não fica salvo)
const notFound = ref(false);

// O campo mostra o link completo no site atual (fora do WordPress, só o token)
const shown = computed(() => (props.token ? linkUrlFor(props.token) ?? props.token : ''));
const href = computed(() => (props.token ? linkUrlFor(props.token) : null));

async function save(token: string) {
  if (!canCheck) return emit('change', token, null);
  isChecking.value = true;
  const target = await checkLink(token);
  isChecking.value = false;
  notFound.value = !target;
  // Atualizar sem mudança não vira um passo de desfazer nem um evento
  if (token !== props.token || JSON.stringify(target) !== JSON.stringify(props.target)) emit('change', token, target);
}

function commit(raw: string) {
  notFound.value = false;
  if (!raw.trim()) {
    isInvalid.value = false;
    emit('change', '', null);
    return;
  }
  const token = tokenFromPublishedLink(raw);
  isInvalid.value = !token;
  if (token && token !== props.token) save(token);
}
</script>

<template>
  <div class="link-field">
    <div class="link-row">
      <DraftInput
        :model-value="shown"
        :placeholder="t('chatbot.properties.chatbot_link_placeholder')"
        :aria-label="t('chatbot.properties.chatbot_link')"
        @commit="commit"
      />
      <button
        v-if="token && canCheck"
        type="button"
        class="btn-icon"
        :disabled="isChecking"
        :title="t('chatbot.properties.chatbot_link_check')"
        :aria-label="t('chatbot.properties.chatbot_link_check')"
        @click="save(token)"
      >
        <RefreshCw :size="14" :class="{ spin: isChecking }" />
      </button>
      <a
        v-if="href"
        :href="href"
        target="_blank"
        rel="noopener"
        class="btn-icon"
        :title="t('chatbot.editor.test.open_linked_tab')"
        :aria-label="t('chatbot.editor.test.open_linked_tab')"
      >
        <ExternalLink :size="14" />
      </a>
    </div>
    <p v-if="isInvalid" class="link-status error"><CircleAlert :size="14" /> {{ t('chatbot.properties.chatbot_link_invalid') }}</p>
    <p v-else-if="notFound && !isChecking" class="link-status error">
      <CircleAlert :size="14" /> {{ t('chatbot.properties.chatbot_link_not_found') }}
    </p>
    <p v-else-if="target" class="link-status found">
      <span v-if="target.emoji" class="clic-emoji">{{ target.emoji }}</span>
      <MessagesSquare v-else :size="14" />
      <span class="found-title">{{ target.title || t('chatbot.runtime.status.chat_title') }}</span>
    </p>
  </div>
</template>

<style scoped>
.link-field { display: flex; flex-direction: column; gap: 4px; }
.link-row { display: flex; align-items: center; gap: 4px; }
.link-row :deep(input) { flex: 1; min-width: 0; font-size: 12px; }
.link-row .btn-icon { flex: 0 0 auto; display: flex; color: #4b5563; }
.link-status { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 12px; color: #4b5563; }
.link-status.error { color: #b91c1c; }
.link-status.found { color: #be185d; font-weight: 600; }
.found-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
</style>
