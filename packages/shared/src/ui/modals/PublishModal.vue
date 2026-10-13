<template>
  <BaseModal :title="titleText" :icon="isActive || !exists ? Rocket : Moon" :tone="isActive ? 'green' : exists ? 'gray' : 'blue'" size="wide" @close="$emit('close')">
    <!-- Status ao lado do título; versão logo abaixo -->
    <template v-if="!loading && exists" #title-badge>
      <span class="modal-chip" :class="isActive ? 'green' : 'gray'">
        {{ isActive ? $t('modals.publish.chip_online') : $t('modals.publish.chip_offline') }}
      </span>
    </template>
    <template v-if="!loading && exists && result" #title-meta>
      <p class="modal-meta">
        {{ isActive
          ? $t('modals.publish.version', { date: formatDate(result.published_at) })
          : $t('modals.publish.last_version', { date: formatDate(result.published_at) }) }}
      </p>
    </template>

    <template v-if="!loading && !error && !exists" #description>
      <p>{{ $t('modals.publish.never_published', { itemName: itemName.toLowerCase() }) }}</p>
    </template>

    <div v-if="loading" class="modal-loading">
      <span class="modal-spinner"></span><span>{{ $t(loadingKey) }}</span>
    </div>

    <p v-else-if="error" class="modal-error">
      <AlertTriangle :size="16" /> {{ error }}
    </p>

    <template v-else-if="exists || isActive">
      <label class="modal-label" :for="inputId">{{ $t('modals.publish.public_link') }}</label>
      <div class="modal-link-row">
        <input :id="inputId" ref="inputRef" readonly class="modal-input" :value="result?.publish_url" @click="handleInputClick" :disabled="!isActive" />
        <button class="modal-btn secondary modal-icon-btn" @click="copyToClipboard" :title="$t('global.copy')" :aria-label="$t('global.copy')" :disabled="!isActive">
          <Copy :size="18" />
        </button>
      </div>
      <p class="modal-hint">
        {{ isActive ? $t('modals.publish.hint_update') : $t('modals.publish.hint_restore') }}
      </p>
    </template>

    <!-- Botão que muda o estado da publicação: sempre à esquerda, nos dois estados -->
    <template #footer-start>
      <button
        v-if="!loading && isActive"
        class="modal-btn danger-outline"
        @click="handleUnpublish"
        :title="$t('modals.publish.btn_disable', { itemName: itemName.toLowerCase() })"
      >
        {{ $t('modals.publish.btn_unpublish') }}
      </button>
      <button v-else-if="!loading && exists" class="modal-btn secondary" @click="handleReactivateOnly" :title="$t('modals.publish.desc_restore')">
        {{ $t('modals.publish.btn_restore') }}
      </button>
    </template>

    <template #footer>
      <template v-if="!exists && !isActive">
        <button class="modal-btn secondary" @click="$emit('close')">{{ $t('global.cancel') }}</button>
        <button class="modal-btn primary" @click="handlePublishOrUpdate" :disabled="loading || !!error">{{ $t('modals.publish.btn_publish') }}</button>
      </template>
      <template v-else>
        <button class="modal-btn secondary" @click="$emit('close')">{{ $t('global.close') }}</button>
        <button class="modal-btn primary" @click="handlePublishOrUpdate" :disabled="loading">
          {{ isActive ? $t('modals.publish.btn_update') : $t('modals.publish.btn_publish_new') }}
        </button>
      </template>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
// Fonte das peças compartilhadas (.clic-ui). Importado aqui, e não no index.ts, porque o build descarta imports do index (sideEffects).
import '../../styles/ui.css';
import { ref, onMounted, computed, useId } from 'vue';
import { Rocket, Moon, AlertTriangle, Copy } from '@lucide/vue';
import BaseModal from './BaseModal.vue';
import { copyText } from '../../utils/clipboard';
import { useToast } from '../../ui/useToast';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  projectsStore: any;
  itemName?: string;
}>();

const emit = defineEmits(['close']);
const toast = useToast();

const { t, locale } = useI18n();

const itemName = computed(
  () => props.itemName ?? t('global.project')
);
const error = props.projectsStore.error;

const result = ref<any>(null);
const loading = ref(true);
const loadingKey = ref('modals.publish.checking');
const isActive = ref(false);
const exists = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const inputId = useId();

const titleText = computed(() => {
  if (isActive.value) return t('modals.publish.title_published', { itemName: itemName.value });
  if (exists.value) return t('modals.publish.title_paused');
  return t('modals.publish.title_publish', { itemName: itemName.value.toLowerCase() });
});

onMounted(async () => {
  loadingKey.value = 'modals.publish.checking';
  loading.value = true;
  try {
    const status = await props.projectsStore.getPublishStatus();
    exists.value = status?.exists || false;
    if (status && status.exists) {
      result.value = status;
      isActive.value = status.is_active;
    } else {
      isActive.value = false;
    }
  } finally {
    loading.value = false;
  }
});

// Ação 1: Publicar Nova Versão (Salva + Sobrescreve)
async function handlePublishOrUpdate() {
  loadingKey.value = 'modals.publish.saving_publishing';
  loading.value = true;
  try {
    const saved = await props.projectsStore.saveProject();
    if (!saved) {
      toast.error(t('global.error_saving'));
      loading.value = false;
      return;
    }
    const res = await props.projectsStore.publishProject(); // Default: only_reactivate = false
    if (res) {
      result.value = res;
      isActive.value = true;
      exists.value = true;
      toast.success(res.existing ? t('modals.publish.success_new') : t('modals.publish.success_published'));
    }
  } catch (e) { console.error(e); } finally { loading.value = false; }
}

// Ação 2: Apenas Reativar (Não Salva, Não Sobrescreve)
async function handleReactivateOnly() {
  loadingKey.value = 'modals.publish.restoring';
  loading.value = true;
  try {
    const res = await props.projectsStore.publishProject({ only_reactivate: true });
    if (res) {
      result.value = res;
      isActive.value = true;
      exists.value = true;
      toast.success(t('modals.publish.success_restored'));
    }
  } catch (e) { console.error(e); } finally { loading.value = false; }
}

async function handleUnpublish() {
  if (!confirm(t('modals.publish.warning_unpublish'))) return;
  loadingKey.value = 'modals.publish.unpublishing';
  loading.value = true;
  try {
    const success = await props.projectsStore.unpublishProject();
    if (success) { 
      isActive.value = false; 
      toast.success(t('modals.publish.success_unpublished'));
    }
  } finally { loading.value = false; }
}

function handleInputClick() { if(isActive.value) inputRef.value?.select(); }
async function copyToClipboard() {
  if (!result.value || !isActive.value) return;
  if (await copyText(result.value.publish_url)) toast.success(t('global.copied'));
  else toast.error(t('global.copy_failed'));
  // Selecionado nos dois casos: se a cópia falhou, dá para copiar à mão
  handleInputClick();
}
function formatDate(dateStr: string) { try { return new Date(dateStr).toLocaleString(locale.value, { dateStyle: 'short', timeStyle: 'short' }); } catch { return dateStr; } }
</script>
