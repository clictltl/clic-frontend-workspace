<template>
  <header class="toolbar">
    <!-- ESQUERDA (Desktop e Mobile) -->
    <div class="toolbar-left">
      <img v-if="appLogo" :src="appLogo" :alt="title" class="app-logo" />
      <h1 v-else class="toolbar-title">{{ title }}</h1>
      
      <div class="made-by-container hide-mobile">
        <span class="made-by-text">{{ $t('header.made_by') }}</span>
        <a :href="logoUrl" class="toolbar-logo-link" target="_blank" rel="noopener noreferrer">
          <img :src="logoClic" alt="CLIC" class="toolbar-logo-small" />
        </a>
      </div>
    </div>

    <!-- AÇÕES GLOBAIS (Desktop e Mobile) -->
    <div class="toolbar-actions">
      
      <!-- BOTÃO VOLTAR (Home) -->
      <button v-if="showHome" class="home-btn" @click="$emit('home-click')" title="Voltar ao Início">
        <Home :size="20" />
      </button>

      <!-- BOTÃO HAMBURGER (Apenas Mobile) -->
      <button class="hamburger-btn show-mobile" @click="isMobileMenuOpen = true">
        <Menu :size="24" />
      </button>

      <!-- OVERLAY DO MENU MOBILE -->
      <div v-if="isMobileMenuOpen" class="drawer-overlay show-mobile" @click="isMobileMenuOpen = false"></div>

      <!-- DIREITA (Desktop) / DRAWER (Mobile) -->
      <div class="toolbar-right" :class="{ 'drawer-open': isMobileMenuOpen }">
        
        <button class="drawer-close-btn show-mobile" @click="isMobileMenuOpen = false">
          <X :size="24" />
        </button>

        <!-- 1. Menu de Idiomas -->
        <div v-if="ENABLE_LANGUAGE_SWITCHER" class="lang-dropdown-wrapper drawer-item" style="--mobile-order: 3">
          <button class="info-btn" @click="isLangMenuOpen = !isLangMenuOpen" :title="t('header.language')">
            <Languages :size="20" />
            <span class="btn-text show-mobile">{{ $t('header.language') }}</span>
          </button>
          
          <!-- Overlay invisível para fechar ao clicar fora -->
          <div v-if="isLangMenuOpen" class="lang-overlay" @click="isLangMenuOpen = false"></div>
          
          <div v-if="isLangMenuOpen" class="lang-dropdown-menu">
            <button
              v-for="lang in availableLocales"
              :key="lang.code"
              class="lang-option"
              :class="{ active: currentLocale === lang.code }"
              @click="changeLanguage(lang.code)"
              >
              {{ lang.label }}
            </button>
          </div>
        </div>

        <!-- 2. Guia -->
        <a v-if="guideUrl" :href="guideUrl" target="_blank" class="guide-btn drawer-item" style="--mobile-order: 4" rel="noopener noreferrer">
          <BookOpen :size="16" />
          <span class="btn-text show-mobile">{{ $t('header.guide') }}</span>
          <span class="hide-mobile">{{ $t('header.guide') }}</span>
        </a>
        
        <!-- 3. Info -->
        <button class="info-btn drawer-item" @click="isInfoModalOpen = true" style="--mobile-order: 5" :title="t('header.info_contact')">
          <Info :size="20" />
          <span class="btn-text show-mobile">{{ $t('header.info_contact') }}</span>
        </button>

        <!-- 4. File Menu (Slot) -->
        <div class="drawer-slot" style="--mobile-order: 1">
          <slot name="file-menu"></slot>
        </div>

        <!-- 5. Auth Menu (Slot) -->
        <div class="drawer-slot" style="--mobile-order: 2">
          <slot name="auth-menu"></slot>
        </div>

        <!-- Créditos no rodapé do Menu (Apenas Mobile) -->
        <div class="drawer-footer show-mobile" style="--mobile-order: 6">
          <span class="made-by-text">{{ $t('header.made_by') }}</span>
          <a :href="logoUrl" class="toolbar-logo-link" target="_blank" rel="noopener noreferrer">
            <img :src="logoClic" alt="CLIC" class="toolbar-logo-small" />
          </a>
        </div>

      </div>
    </div>
  </header>

  <!-- Modal de Info/Contato -->
  <teleport to="body">
    <div v-if="isInfoModalOpen" class="about-modal-overlay" @click.self="isInfoModalOpen = false">
      <div class="about-modal-content">
        <div class="about-modal-header">
          <h2>{{ $t('header.about_clic') }}</h2>
          <button class="about-close-btn" @click="isInfoModalOpen = false"><X :size="20" /></button>
        </div>
        
        <div class="about-modal-body">
          <p v-html="$t('header.about_desc')" />
          
          <template v-if="!isLoggedIn">
            <h3 class="about-section-title"><Lock :size="18" /> {{ $t('header.full_access') }}</h3>
            <p>{{ $t('header.full_access_desc') }}</p>
          </template>

          <h3 class="about-section-title"><Wrench :size="18" /> {{ $t('header.bugs_suggestions') }}</h3>
          <p>{{ $t('header.bugs_desc') }}</p>
          
          <div class="about-footer-info">
            <p class="about-footer-item"><Mail :size="18" /> <strong>{{ $t('header.contact') }}</strong> <a href="mailto:clic@tltlab.org">clic@tltlab.org</a></p>
            <p class="about-footer-item"><Globe :size="18" /> <strong>{{ $t('header.site') }}</strong> <a href="https://clic.tltlab.org/" target="_blank">https://clic.tltlab.org/</a></p>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import logoClic from '../assets/logo-clic.svg';
import { Info, BookOpen, X, Lock, Wrench, Mail, Globe, Languages, Menu, Home } from '@lucide/vue';
import { useAuth } from '../auth/auth';
import { useI18n } from 'vue-i18n';
import { setLocale, availableLocales, ENABLE_LANGUAGE_SWITCHER, type SupportedLocales } from '../i18n';

defineProps<{
  title: string;
  appLogo?: string;
  guideUrl?: string;
  showHome?: boolean;
}>();

defineEmits(['home-click']);

const auth = useAuth();
const isLoggedIn = computed(() => auth.state.ready && auth.state.loggedIn);
const isInfoModalOpen = ref(false);

const logoUrl = computed(() => {
  if (typeof window !== 'undefined' && window.CLIC_CORE) {
    return window.CLIC_CORE.site_url ?? window.CLIC_CORE.app_url ?? '/';
  }
  return 'https://clic.tltlab.org';
});

// Lógica de i18n
const { locale: currentLocale, t } = useI18n();
const isLangMenuOpen = ref(false);
const isMobileMenuOpen = ref(false);

function changeLanguage(code: SupportedLocales) {
  setLocale(code);
  isLangMenuOpen.value = false;
}
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

.drawer-slot { display: flex; align-items: center; }

.toolbar-left {
  display: flex;
  align-items: flex-end;
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

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.home-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #6b7280;
  border: 1px solid transparent;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.home-btn:hover {
  background: #f3f4f6;
  color: #111827;
  border-color: #d1d5db;
}

/* --- Novos Estilos: Botões e Modal --- */
.guide-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: #6b7280; /* Mesma cor do ícone de info */
  border: 1px solid #9ca3af; /* Borda sutil (um pouco mais clara que o texto) */
  font-weight: 600;
  font-size: 14px;
  padding: 5px 12px; /* Reduzido 1px para compensar a borda */
  border-radius: 9999px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.guide-btn:hover {
  background: #f3f4f6; /* Mesma cor de fundo do hover do botão Info */
  color: #111827;
  border-color: #6b7280; /* Borda escurece no hover */
}

.info-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #6b7280;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: color 0.2s, background 0.2s;
}
.info-btn:hover {
  color: #111827;
  background: #f3f4f6;
}

/* Modal via Teleport (Fica fora do header) */
:global(.about-modal-overlay) {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
:global(.about-modal-content) {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  font-family: inherit;
}
:global(.about-modal-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
}
:global(.about-modal-header h2) {
  margin: 0;
  font-size: 18px;
  color: #111827;
}
:global(.about-close-btn) {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}
:global(.about-close-btn:hover) {
  color: #111827;
  background-color: #f3f4f6;
}
:global(.about-modal-body) {
  padding: 24px;
  color: #374151;
  font-size: 15px;
  line-height: 1.5;
}
:global(.about-section-title) {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #111827;
  margin: 20px 0 8px 0;
}
:global(.about-modal-body p) {
  margin: 0 0 12px 0;
}
:global(.about-footer-info) {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}
:global(.about-footer-info a) {
  color: #2563eb;
  text-decoration: none;
}
:global(.about-footer-info a:hover) {
  text-decoration: underline;
}
:global(.about-footer-item) {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0 !important;
}

/* --- Menu de Idiomas --- */
.lang-dropdown-wrapper {
  position: relative;
}

.lang-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 4px;
  z-index: 50;
  min-width: 160px;
}

.lang-option {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  font-size: 14px;
  color: #374151;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.lang-option:hover {
  background: #f3f4f6;
}

.lang-option.active {
  font-weight: 600;
  color: #111827;
  background: #f3f4f6;
}

.lang-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40; /* Fica atrás do menu, mas à frente do resto da tela */
}

.show-mobile { display: none !important; }

/* Wrapper dos botões de crédito na versão Desktop */
.made-by-container {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .hide-mobile { display: none !important; }
  .show-mobile { display: flex !important; }
  
  .toolbar {
    padding: 6px 16px;
    gap: 12px;
  }

  /* Força a redução drástica das logos no mobile */
  .app-logo {
    height: 24px !important;
    width: auto !important;
  }
  .toolbar-title {
    font-size: 18px !important;
  }

  .hamburger-btn {
    background: transparent; border: none; color: #374151; padding: 4px; cursor: pointer;
  }

  .drawer-overlay {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.5); z-index: 999;
  }

  /* A Div Direita Vira o Menu Lateral */
  .toolbar-right {
    position: fixed; top: 0; right: -300px; width: 280px; height: 100vh;
    background: white; flex-direction: column; align-items: stretch;
    padding: 20px; box-shadow: -4px 0 15px rgba(0,0,0,0.1); z-index: 1000;
    transition: right 0.3s ease; gap: 12px;
    overflow-y: auto; /* Permite rolar se a tela for pequena */
  }

  .toolbar-right.drawer-open { right: 0; }

  .drawer-close-btn {
    align-self: flex-end; background: transparent; border: none;
    color: #6b7280; padding: 4px; cursor: pointer; margin-bottom: 10px;
  }

  /* Magia da Reordenação: Usa as variáveis inline (--mobile-order) */
  .drawer-item, .drawer-slot, .drawer-footer {
    width: 100%; display: flex; order: var(--mobile-order);
  }

  .guide-btn, .info-btn {
    width: 100%; justify-content: flex-start; gap: 12px;
    padding: 12px; font-size: 15px; border-radius: 8px;
    background: #f9fafb; color: #374151; border: none;
  }
  
  .drawer-footer {
    margin-top: 20px; flex-direction: column; align-items: flex-start;
    gap: 12px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex !important;
  }
}
</style>