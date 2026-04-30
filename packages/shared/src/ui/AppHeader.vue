<template>
  <header class="toolbar">
    <div class="toolbar-left">
      <img v-if="appLogo" :src="appLogo" :alt="title" class="app-logo" />
      <h1 v-else class="toolbar-title">{{ title }}</h1>
      
      <span class="made-by-text">feito pelo</span>
      
      <a :href="logoUrl" class="toolbar-logo-link" target="_blank" rel="noopener noreferrer">
        <img :src="logoClic" alt="CLIC" class="toolbar-logo-small" />
      </a>
    </div>

    <div class="toolbar-right">
      <!-- O slot permite que o App pai injete o FileMenu, AuthMenu, etc. -->
      <slot></slot>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import logoClic from '../assets/logo-clic.svg'

defineProps<{
  title: string;
  appLogo?: string;
}>();

const logoUrl = computed(() => {
  if (typeof window !== 'undefined' && window.CLIC_CORE) {
    return window.CLIC_CORE.site_url ?? window.CLIC_CORE.app_url ?? '/';
  }
  return 'https://clic.tltlab.org';
});
</script>

<style scoped>
/* Estilos exatos que você enviou */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 20px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  gap: 24px;
}

.toolbar-left {
  display: flex;
  align-items: flex-end; /* Alinha todos os itens pela base inferior */
  gap: 12px;
}

.app-logo {
  height: 42px; /* Mantém o tamanho de destaque para o App */
  width: auto;
}

.made-by-text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  margin: 0 4px 4px 4px; /* Adicionado 4px de margin-bottom para compensar o "desconto" visual da fonte */
  line-height: 1;
}

.toolbar-logo-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.toolbar-logo-small {
  height: 24px; /* Logo do CLIC proporcionalmente menor */
  width: auto;
}

.toolbar-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
  white-space: nowrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>