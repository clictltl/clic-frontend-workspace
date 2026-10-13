<template>
  <!--
    Base de todos os modais do @clic/shared.
    Cabeçalho: ícone + título (lado a lado). Descrição e corpo começam na margem esquerda.
    Rodapé: footer-start (ação destrutiva secundária, à esquerda) e footer (fechar + ação principal, à direita).
    Fecha com Esc e com clique fora (fechar = a opção segura de cada modal). Só o tamanho "reading" tem X.
  -->
  <Teleport to="body">
    <div class="base-modal-backdrop clic-ui" @mousedown.self="onBackdrop">
      <div
        ref="cardRef"
        class="base-modal"
        :class="`size-${size}`"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
      >
        <button v-if="size === 'reading'" class="base-modal-close" :title="t('global.close')" :aria-label="t('global.close')" @click="emit('close')">
          <X :size="20" />
        </button>

        <div class="base-modal-head">
          <div v-if="icon" class="base-modal-icon" :class="`tone-${tone}`">
            <component :is="icon" :size="20" />
          </div>
          <div class="base-modal-titles">
            <div class="base-modal-title-row">
              <h3 :id="titleId">{{ title }}</h3>
              <slot name="title-badge" />
            </div>
            <slot name="title-meta" />
          </div>
        </div>

        <div v-if="$slots.description || description" class="base-modal-desc">
          <slot name="description">{{ description }}</slot>
        </div>

        <div v-if="$slots.default" class="base-modal-body">
          <slot />
        </div>

        <div v-if="$slots.footer || $slots['footer-start']" class="base-modal-foot">
          <slot name="footer-start" />
          <span class="base-modal-spacer"></span>
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// Fonte das peças compartilhadas (.clic-ui). Importado aqui, e não no index.ts, porque o build descarta imports do index (sideEffects).
import '../../styles/ui.css';
import { ref, useId, onMounted, onBeforeUnmount, nextTick, type Component } from 'vue';
import { X } from '@lucide/vue';
import { useI18n } from 'vue-i18n';

withDefaults(defineProps<{
  title: string;
  icon?: Component;
  /** Cor do círculo do ícone */
  tone?: 'blue' | 'red' | 'green' | 'gray' | 'amber';
  /** narrow: confirmações e formulários curtos; wide: listas e links; reading: texto longo (Sobre o CLIC) */
  size?: 'narrow' | 'wide' | 'reading';
  description?: string;
}>(), {
  tone: 'blue',
  size: 'narrow',
});

const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();

const titleId = useId();
const cardRef = ref<HTMLElement | null>(null);
let previousFocus: HTMLElement | null = null;

// Só o modal de cima responde ao Esc (ex.: o login aberto por cima de outro modal)
const openStack: symbol[] = ((globalThis as any).__clicModalStack ??= []);
const me = Symbol('modal');

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || openStack[openStack.length - 1] !== me) return;
  e.stopPropagation();
  emit('close');
}

function onBackdrop() {
  emit('close');
}

onMounted(async () => {
  openStack.push(me);
  previousFocus = document.activeElement as HTMLElement | null;
  window.addEventListener('keydown', onKeydown);
  await nextTick();
  // Se nenhum campo do modal pegou o foco (ex.: autofocus do nome), o foco vai para o próprio modal
  if (!cardRef.value?.contains(document.activeElement)) cardRef.value?.focus();
});

onBeforeUnmount(() => {
  const i = openStack.indexOf(me);
  if (i !== -1) openStack.splice(i, 1);
  window.removeEventListener('keydown', onKeydown);
  previousFocus?.focus?.();
});
</script>

<style>
/* Sem scoped: o conteúdo dos slots vem de outros componentes e herda estes estilos */
.base-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(17, 24, 39, 0.45);
  animation: base-modal-fade 0.15s ease-out;
}

.base-modal {
  position: relative;
  width: 100%;
  max-height: calc(100vh - 32px);
  max-height: calc(100dvh - 32px);
  display: flex;
  flex-direction: column;
  background: #fff;
  color: #1f2937;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  text-align: left;
  animation: base-modal-up 0.2s ease-out;
  outline: none;
}
.base-modal.size-narrow { max-width: 400px; }
.base-modal.size-wide { max-width: 500px; }
.base-modal.size-reading { max-width: 520px; }

.base-modal-close {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}
.base-modal-close:hover { background: #f3f4f6; color: #111827; }

.base-modal-head {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}
.size-reading .base-modal-head { padding-right: 36px; }

.base-modal-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.base-modal-icon.tone-blue { background: #EFF6FF; color: #2563eb; }
.base-modal-icon.tone-red { background: #FEF2F2; color: #DC2626; }
.base-modal-icon.tone-green { background: #ECFDF5; color: #059669; }
.base-modal-icon.tone-gray { background: #F3F4F6; color: #4b5563; }
.base-modal-icon.tone-amber { background: #FEF3C7; color: #B45309; }

.base-modal-titles { flex: 1; min-width: 0; }
.base-modal-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.base-modal-title-row h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  color: #1f2937;
}

.base-modal-desc {
  margin-top: 14px;
  font-size: 14px;
  line-height: 1.5;
  color: #4b5563;
  flex-shrink: 0;
}
.base-modal-desc p { margin: 0; }

/* Folga de 3px (com margem negativa) para a rolagem não cortar o anel de foco dos campos */
.base-modal-body {
  margin: 20px -3px 0;
  padding: 0 3px 3px;
  min-height: 0;
  overflow-y: auto;
}
/* Conteúdo todo condicional (v-if falso só deixa comentários): some, para não sobrar espaço */
.base-modal-body:empty { display: none; }
/* Sem descrição, o corpo fica mais perto do cabeçalho */
.base-modal-head + .base-modal-body { margin-top: 16px; }
.base-modal-body + .base-modal-foot { margin-top: 21px; }

.base-modal-foot {
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.base-modal-spacer { flex: 1; }

/* ---- Peças comuns do conteúdo dos modais (usadas nos slots) ---- */
.base-modal .modal-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}
.base-modal .modal-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #1f2937;
  font: inherit;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.base-modal .modal-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }
.base-modal .modal-input[readonly] { background: #F9FAFB; }
.base-modal .modal-input:disabled { color: #9ca3af; }

/* Status ao lado do título (ex.: Online) e informação logo abaixo dele (ex.: versão) */
.base-modal .modal-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 2px 8px; border-radius: 9999px;
  font-size: 12px; font-weight: 600; white-space: nowrap;
}
.base-modal .modal-chip::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.base-modal .modal-chip.green { background: #ECFDF5; color: #047857; }
.base-modal .modal-chip.gray { background: #F3F4F6; color: #4b5563; }
.base-modal .modal-meta { margin: 4px 0 0; font-size: 13px; color: #6b7280; }

/* Campo do link + botão de copiar */
.base-modal .modal-link-row { display: flex; gap: 8px; }
.base-modal .modal-link-row .modal-input { flex: 1; min-width: 0; }

.base-modal .modal-hint { margin: 8px 0 0; font-size: 13px; line-height: 1.5; color: #6b7280; }
.base-modal .modal-warning { margin: 0; font-size: 14px; line-height: 1.5; color: #B91C1C; }

.base-modal .modal-error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 12px 0 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: #FEF2F2;
  color: #B91C1C;
  font-size: 13px;
  line-height: 1.4;
}
.base-modal .modal-error svg { flex-shrink: 0; }

/* Carregando (lista, status do link) */
.base-modal .modal-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 0;
  font-size: 14px;
  color: #6b7280;
}
.base-modal .modal-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: base-modal-spin 0.8s linear infinite;
}

/* Botões (cores revistas na etapa dos botões) */
.base-modal .modal-btn {
  height: 40px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.base-modal .modal-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.base-modal .modal-btn.secondary { background: #fff; border-color: #d1d5db; color: #374151; }
.base-modal .modal-btn.secondary:hover:not(:disabled) { background: #f9fafb; border-color: #9ca3af; }
.base-modal .modal-btn.primary { background: #2563eb; color: #fff; }
.base-modal .modal-btn.primary:hover:not(:disabled) { background: #1d4ed8; }
.base-modal .modal-btn.danger { background: #DC2626; color: #fff; }
.base-modal .modal-btn.danger:hover:not(:disabled) { background: #B91C1C; }
.base-modal .modal-btn.danger-soft { background: #FEF2F2; border-color: #FECACA; color: #B91C1C; }
.base-modal .modal-btn.danger-soft:hover:not(:disabled) { background: #FEE2E2; }
.base-modal .modal-btn.danger-outline { background: #fff; border-color: #FCA5A5; color: #B91C1C; }
.base-modal .modal-btn.danger-outline:hover:not(:disabled) { background: #FEF2F2; }
.base-modal .modal-btn.success-outline { background: #fff; border-color: #6EE7B7; color: #047857; }
.base-modal .modal-btn.success-outline:hover:not(:disabled) { background: #ECFDF5; }
.base-modal .modal-icon-btn { width: 40px; padding: 0; flex-shrink: 0; }

@keyframes base-modal-spin { to { transform: rotate(360deg); } }
@keyframes base-modal-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes base-modal-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

@media (prefers-reduced-motion: reduce) {
  .base-modal-backdrop, .base-modal { animation: none; }
}
</style>
