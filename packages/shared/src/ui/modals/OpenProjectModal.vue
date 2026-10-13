<template>
  <BaseModal :title="$t('modals.open.title', { itemName: itemName.toLowerCase() })" :icon="FolderOpen" size="wide" :description="$t('modals.open.description')" @close="close">
    <div class="list-container">
      <!-- Carregando -->
      <div v-if="loadingList" class="state-msg">
        <span class="modal-spinner"></span> {{ $t('modals.open.loading') }}
      </div>

      <!-- Lista vazia -->
      <div v-else-if="projectsList.length === 0" class="state-msg empty">
        <FolderOpen :size="32" class="state-icon" />
        {{ $t('modals.open.empty') }}
      </div>

      <!-- Lista de projetos: botões, para funcionar também pelo teclado -->
      <ul v-else class="project-list">
        <li v-for="p in projectsList" :key="p.id">
          <button
            type="button"
            class="project-item"
            :class="{ 'selected': selectedId === p.id }"
            :aria-pressed="selectedId === p.id"
            @click="selectProject(p.id)"
            @dblclick="openSelected"
          >
            <FileText :size="18" class="item-icon" />
            <span class="item-info">
              <span class="item-name">{{ p.name }}</span>
              <span class="item-date">{{ $t('modals.open.edited_at', { date: formatDate(p.updated_at) }) }}</span>
            </span>
          </button>
        </li>
      </ul>
    </div>

    <p v-if="error" class="modal-error">
      <AlertTriangle :size="16" /> {{ error }}
    </p>

    <template #footer>
      <button class="modal-btn secondary" @click="close">{{ $t('global.cancel') }}</button>
      <button class="modal-btn primary" :disabled="!selectedId || isOpening" @click="openSelected">
        {{ isOpening ? $t('global.opening') : $t('global.open') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
// Fonte das peças compartilhadas (.clic-ui). Importado aqui, e não no index.ts, porque o build descarta imports do index (sideEffects).
import '../../styles/ui.css';
import { ref, onMounted, computed } from 'vue';
import { FolderOpen, FileText, AlertTriangle } from '@lucide/vue';
import BaseModal from './BaseModal.vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  projectsStore: any;
  itemName?: string;
}>();

const emit = defineEmits(['close']);

const { t, locale } = useI18n();

const itemName = computed(
  () => props.itemName ?? t('global.project').toLowerCase()
);

// Store
const projectsList = props.projectsStore.projectsList
const error = props.projectsStore.error;

// Estado local
const selectedId = ref<number | null>(null);
const loadingList = ref(false);
const isOpening = ref(false);

// Ao montar, atualiza a lista para garantir dados frescos
onMounted(async () => {
  loadingList.value = true;
  try {
    await props.projectsStore.listProjects();
  } catch (e) {
    // Erro já é tratado no store/error
  } finally {
    loadingList.value = false;
  }
});

function close() {
  emit('close');
}

function selectProject(id: number) {
  selectedId.value = id;
}

async function openSelected() {
  if (!selectedId.value || isOpening.value) return;

  isOpening.value = true;
  
  // O store.loadProject retorna boolean ou o objeto
  const result = await props.projectsStore.loadProject(selectedId.value);

  isOpening.value = false;
  if (result) {
    emit('close');
  }
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString(locale.value, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return dateStr;
  }
}
</script>

<style scoped>
/* --- Lista de projetos --- */
.list-container {
  min-height: 200px;
  max-height: 340px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 4px;
  background: #f9fafb;
}

.project-list { list-style: none; padding: 0; margin: 0; }

.project-item {
  width: 100%;
  display: flex; align-items: center; gap: 12px;
  padding: 10px; margin-bottom: 2px;
  border-radius: 6px; cursor: pointer;
  border: 1px solid transparent;
  background: white;
  font: inherit; text-align: left;
  transition: background 0.15s, border-color 0.15s;
}
.project-item:hover { background: #f3f4f6; border-color: #d1d5db; }
.project-item.selected { background: #eff6ff; border-color: #bfdbfe; box-shadow: 0 0 0 1px #bfdbfe; }

.item-icon { color: #9ca3af; flex-shrink: 0; }
.item-info { display: flex; flex-direction: column; min-width: 0; }
.item-name { font-size: 14px; color: #374151; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.project-item.selected .item-name { color: #1d4ed8; }
.item-date { font-size: 12px; color: #6b7280; margin-top: 2px; }

/* --- Estados (vazio, carregando) --- */
.state-msg {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  min-height: 180px;
  color: #6b7280; font-size: 14px; text-align: center;
}
.state-msg.empty { color: #6b7280; }
.state-icon { color: #9ca3af; }
</style>
