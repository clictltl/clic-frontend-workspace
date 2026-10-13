<template>
  <BaseModal :title="titleText" :icon="Link" :tone="exists && !isActive ? 'gray' : 'blue'" size="wide" @close="$emit('close')">
    <template v-if="!loading && !error" #description>
      <p v-if="isActive">{{ $t('modals.share.desc_active', { itemName: itemName.toLowerCase() }) }}</p>
      <p v-else-if="exists">{{ $t('modals.share.desc_inactive') }}</p>
      <p v-else>{{ $t('modals.share.empty', { itemName: itemName.toLowerCase() }) }}</p>
    </template>

    <div v-if="loading" class="modal-loading">
      <span class="modal-spinner"></span><span>{{ $t(loadingKey) }}</span>
    </div>

    <p v-else-if="error" class="modal-error">
      <AlertTriangle :size="16" /> {{ error }}
    </p>

    <!-- Link já gerado (ativo ou desativado) -->
    <template v-else-if="exists || isActive">
      <label class="modal-label" :for="inputId">{{ $t('modals.share.public_link') }}</label>
      <div class="modal-link-row">
        <input
          :id="inputId"
          ref="inputRef"
          readonly
          class="modal-input"
          :value="shareUrl"
          @click="handleInputClick"
          :disabled="!isActive"
        />
        <button class="modal-btn secondary modal-icon-btn" @click="copyToClipboard" :title="$t('global.copy')" :aria-label="$t('global.copy')" :disabled="!isActive">
          <Copy :size="18" />
        </button>
      </div>
    </template>

    <!-- Botão que muda o estado do link: sempre à esquerda, nos dois estados (não "foge" depois do clique) -->
    <template #footer-start>
      <button v-if="!loading && isActive" class="modal-btn danger-outline" @click="confirmingUnshare = true">
        {{ $t('modals.share.btn_disable') }}
      </button>
      <button v-else-if="!loading && exists" class="modal-btn secondary" @click="handleReactivate">
        {{ $t('modals.share.btn_reactivate') }}
      </button>
    </template>

    <template #footer>
      <template v-if="!loading && !error && !exists && !isActive">
        <button class="modal-btn secondary" @click="$emit('close')">{{ $t('global.cancel') }}</button>
        <button class="modal-btn primary" @click="handleGenerateLink">{{ $t('modals.share.btn_generate') }}</button>
      </template>
      <button v-else class="modal-btn secondary" @click="$emit('close')">{{ $t('global.close') }}</button>
    </template>
  </BaseModal>

  <!-- Confirmação por cima deste modal (no lugar do confirm() do navegador) -->
  <ConfirmModal
    v-if="confirmingUnshare"
    :title="$t('modals.share.confirm_disable_title')"
    :description="$t('modals.share.warning_disable')"
    :confirm-label="$t('modals.share.btn_disable')"
    :icon="Unlink"
    @cancel="confirmingUnshare = false"
    @confirm="confirmingUnshare = false; handleUnshare()"
  />
</template>

<script setup lang="ts">
// Fonte das peças compartilhadas (.clic-ui). Importado aqui, e não no index.ts, porque o build descarta imports do index (sideEffects).
import '../../styles/ui.css';
import { ref, onMounted, computed, useId } from 'vue';
import { Link, Unlink, AlertTriangle, Copy } from '@lucide/vue';
import BaseModal from './BaseModal.vue';
import ConfirmModal from './ConfirmModal.vue';
import { copyText } from '../../utils/clipboard';
import { useToast } from '../useToast';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  projectsStore: any;
  itemName?: string;
}>();

const emit = defineEmits(['close']);
const toast = useToast();

const { t } = useI18n();

const itemName = computed(
  () => props.itemName ?? t('global.project')
);
const error = props.projectsStore.error;

const shareUrl = ref<string | null>(null);
const isActive = ref(false);
const exists = ref(false);
const loading = ref(true);
const loadingKey = ref('modals.share.checking');
const inputRef = ref<HTMLInputElement | null>(null);
const inputId = useId();
const confirmingUnshare = ref(false);

const titleText = computed(() => {
  if (isActive.value) return t('modals.share.status_active');
  if (exists.value) return t('modals.share.status_inactive');
  return t('modals.share.title', { itemName: itemName.value.toLowerCase() });
});

onMounted(async () => {
  loading.value = true;
  try {
    const status = await props.projectsStore.getShareStatus();
    
    exists.value = status?.exists || false;
    
    if (status && status.exists) {
      shareUrl.value = status.share_url;
      isActive.value = status.is_active;
    } else {
      isActive.value = false;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});

// Ação Inicial (Primeira vez)
async function handleGenerateLink() {
  await executeShare(t('modals.share.success_generated'));
}

// Ação de Reativar (Mesma API, mensagem diferente)
async function handleReactivate() {
  await executeShare(t('modals.share.success_reactivated'));
}

async function executeShare(successMsg: string) {
  loadingKey.value = 'modals.share.processing';
  loading.value = true;
  try {
    const res = await props.projectsStore.shareProject();
    if (res && res.share_url) {
      shareUrl.value = res.share_url;
      isActive.value = true;
      exists.value = true;
      toast.success(successMsg);
    }
  } finally {
    loading.value = false;
  }
}

async function handleUnshare() {

  loadingKey.value = 'modals.share.disabling';
  loading.value = true;
  try {
    const success = await props.projectsStore.unshareProject();
    if (success) {
      isActive.value = false;
      toast.success(t('modals.share.success_disabled'));
    }
  } finally {
    loading.value = false;
  }
}

function handleInputClick() { if(isActive.value) inputRef.value?.select(); }

async function copyToClipboard() {
  if (!shareUrl.value || !isActive.value) return;
  if (await copyText(shareUrl.value)) toast.success(t('global.copied'));
  else toast.error(t('global.copy_failed'));
  // Selecionado nos dois casos: se a cópia falhou, dá para copiar à mão
  handleInputClick();
}
</script>
