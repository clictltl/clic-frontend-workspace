<template>
  <header class="toolbar">
    <!-- ESQUERDA (Desktop e Mobile) -->
    <div class="toolbar-left">
      
      <!-- Bloco 1: App ("Criado com" + Logo App com Link) -->
      <div class="app-brand-container">
        <span class="prefix-text hide-mobile">{{ $t('runtime.created_with') }}</span>
        <a :href="appBaseUrl" class="toolbar-logo-link" target="_blank" rel="noopener noreferrer">
          <img v-if="appLogo" :src="appLogo" :alt="appName" class="app-logo" />
          <h1 v-else class="toolbar-title">{{ appName }}</h1>
        </a>
      </div>
      
      <!-- Bloco 2: Institucional ("da plataforma" + Logo CLIC) - Exatamente igual ao AppHeader -->
      <div class="made-by-container hide-mobile">
        <span class="made-by-text">{{ $t('header.made_by') }}</span>
        <a :href="logoUrl" class="toolbar-logo-link" target="_blank" rel="noopener noreferrer">
          <img :src="logoClic" alt="CLIC" class="toolbar-logo-small" />
        </a>
      </div>

    </div>

    <!-- DIREITA -->
    <div class="toolbar-actions">
      
      <LanguageSwitcher />

      <!-- Botão Abrir no Editor -->
      <button v-if="showEditButton" class="action-btn" @click="$emit('edit-click')" :title="$t('runtime.open_in_editor')">
        <ExternalLink :size="16" />
        <span class="hide-mobile">{{ $t('runtime.open_in_editor') }}</span>
      </button>
      
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import logoClic from '../assets/logo-clic.svg';
import { ExternalLink } from '@lucide/vue';
import LanguageSwitcher from './LanguageSwitcher.vue';

withDefaults(defineProps<{
  appName: string;
  appLogo?: string;
  showEditButton?: boolean;
}>(), {
  showEditButton: true
});

defineEmits(['edit-click']);

// Link do Logo da Instituição (CLIC)
const logoUrl = computed(() => {
  if (typeof window !== 'undefined' && (window as any).CLIC_CORE) {
    return (window as any).CLIC_CORE.site_url ?? (window as any).CLIC_CORE.app_url ?? '/';
  }
  return 'https://clic.tltlab.org';
});

// Link do App (Dinâmico: Extrai tudo antes do '/p/')
const appBaseUrl = computed(() => {
  if (typeof window === 'undefined') return '/';
  
  const href = window.location.href;
  const pIndex = href.indexOf('/p/');
  
  if (pIndex !== -1) {
    return href.substring(0, pIndex);
  }
  
  // Fallback caso não esteja na URL esperada
  return '/';
});
</script>

<style scoped>
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
  align-items: flex-end;
  gap: 12px;
}

.app-brand-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prefix-text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  margin: 0; 
  line-height: 1;
}

.made-by-container {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.app-logo {
  height: 42px;
  width: auto;
}

.made-by-text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  margin: 0 4px 4px 4px;
  line-height: 1;
}

.toolbar-logo-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.toolbar-logo-small {
  height: 24px;
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

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: #6b7280;
  border: 1px solid #9ca3af;
  font-weight: 600;
  font-size: 14px;
  padding: 5px 12px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f3f4f6;
  color: #111827;
  border-color: #6b7280;
}

.hide-mobile { display: flex; }

@media (max-width: 768px) {
  .hide-mobile { display: none !important; }
  
  .toolbar {
    padding: 6px 16px;
    gap: 12px;
  }

  .app-logo {
    height: 28px !important;
  }
  
  .toolbar-title {
    font-size: 18px !important;
  }

  .action-btn {
    padding: 6px;
    border-radius: 8px;
  }
}
</style>