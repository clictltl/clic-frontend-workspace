<script setup lang="ts">
import { Comment, useSlots, type Component, type VNode } from 'vue';

/**
 * Seção do painel de propriedades: cartão com ícone, título e (opcional) ação no cabeçalho.
 * `tone` destaca o estado (ex.: onde a resposta é guardada: verde quando guarda, amarelo quando não).
 */
withDefaults(defineProps<{
  icon: Component;
  title: string;
  tone?: 'default' | 'success' | 'warning';
  badge?: string | number; // Número antes do título (ex.: caminhos da condição)
}>(), {
  tone: 'default'
});

// Só mostra o corpo se o conteúdo renderizar algo (ex.: seção de imagem fechada fica só no cabeçalho)
const slots = useSlots();
const hasBody = () => (slots.default?.() ?? []).some(isRendered);
function isRendered(vnode: VNode): boolean {
  if (vnode.type === Comment) return false;
  return Array.isArray(vnode.children) ? (vnode.children as VNode[]).some(isRendered) : true;
}
</script>

<template>
  <section class="panel-section" :class="`tone-${tone}`">
    <header class="section-header">
      <span v-if="badge !== undefined" class="section-badge">{{ badge }}</span>
      <component :is="icon" v-else :size="16" class="section-icon" aria-hidden="true" />
      <h3 class="section-title">{{ title }}</h3>
      <div v-if="$slots.actions" class="section-actions"><slot name="actions" /></div>
    </header>
    <div v-if="hasBody()" class="section-body"><slot /></div>
  </section>
</template>

<style scoped>
.panel-section {
  background: white; border: 1px solid #e5e7eb; border-radius: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.section-header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; }
.section-icon { flex: 0 0 auto; color: #4b5563; }
.section-badge {
  flex: 0 0 auto; width: 20px; height: 20px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #4b5563; color: white; font-size: 12px; font-weight: 700;
}
.section-title { flex: 1; margin: 0; font-size: 14px; font-weight: 700; color: #1f2937; }
.section-actions { display: flex; align-items: center; gap: 4px; }
.section-body { display: flex; flex-direction: column; gap: 10px; padding: 0 12px 12px; }

.tone-success { border-color: #86efac; background: #f0fdf4; }
.tone-success .section-icon, .tone-success .section-title { color: #166534; }
.tone-warning { border-color: #fcd34d; background: #fffbeb; }
.tone-warning .section-icon, .tone-warning .section-title { color: #92400e; }
</style>
