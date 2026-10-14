<template>
  <header class="toolbar clic-ui">
    <!-- ESQUERDA (Desktop e Mobile) -->
    <div class="toolbar-left">
      <!-- Cartão da marca: logo do app + "feito pelo CLIC" num bloco só (no celular, só o logo) -->
      <div class="brand-card">
        <img v-if="appLogo" :src="appLogo" :alt="title" class="app-logo" />
        <h1 v-else class="toolbar-title">{{ title }}</h1>

        <div class="made-by-container hide-mobile">
          <span class="made-by-text">{{ $t('header.made_by') }}</span>
          <a :href="logoUrl" class="toolbar-logo-link" target="_blank" rel="noopener noreferrer">
            <img :src="logoClic" alt="CLIC" class="toolbar-logo-small" />
          </a>
        </div>
      </div>

      <!--
        Destino do Arquivo no desktop/tablet: logo depois da marca, num lugar fixo.
        Guia, Instalar, conta e o nome do projeto mudam de tamanho; à direita, não empurram o Arquivo.
      -->
      <div ref="fileMenuDesktop" class="file-menu-desktop hide-mobile"></div>
    </div>

    <!-- AÇÕES GLOBAIS (Desktop e Mobile) -->
    <div class="toolbar-actions">
      
      <!-- BOTÃO VOLTAR (Home): só em alguns apps (emoji-coder), sempre o primeiro, com separador -->
      <button v-if="showHome" class="home-btn" @click="$emit('home-click')" :title="t('header.back_home')" :aria-label="t('header.back_home')">
        <Home :size="20" />
      </button>
      <span v-if="showHome" class="toolbar-sep hide-mobile" aria-hidden="true"></span>

      <!-- BOTÃO HAMBURGER (Apenas Mobile) -->
      <button class="hamburger-btn show-mobile" @click="isMobileMenuOpen = true">
        <Menu :size="24" />
      </button>

      <!-- OVERLAY DO MENU MOBILE -->
      <div v-if="isMobileMenuOpen" class="drawer-overlay show-mobile" @click="isMobileMenuOpen = false"></div>

      <!--
        DIREITA (Desktop) / DRAWER (Mobile)
        Desktop, na ordem do HTML: [Arquivo | projeto] │ [Guia, Instalar, Idioma, Info] │ [conta].
        Mobile (menu lateral), via --mobile-order: conta no topo │ [Arquivo | projeto] │ [ajuda] │ "feito pelo CLIC".
      -->
      <div class="toolbar-right" :class="{ 'drawer-open': isMobileMenuOpen }">
        
        <button class="drawer-close-btn show-mobile" @click="isMobileMenuOpen = false">
          <X :size="24" />
        </button>

        <!-- Destino do Arquivo no celular: dentro do menu lateral, depois da conta -->
        <div ref="fileMenuMobile" class="drawer-slot show-mobile" style="--mobile-order: 3"></div>
        <span class="toolbar-sep show-mobile" style="--mobile-order: 4" aria-hidden="true"></span>

        <!-- 2. Ajuda: Guia e Instalar com texto; abaixo de 1200px, só o ícone (com dica) -->
        <a v-if="guideUrl" :href="guideUrl" target="_blank" class="guide-btn drawer-item" style="--mobile-order: 5" rel="noopener noreferrer" :title="t('header.guide')" :aria-label="t('header.guide')">
          <BookOpen :size="16" />
          <span class="btn-text show-mobile">{{ $t('header.guide') }}</span>
          <span class="btn-label hide-mobile">{{ $t('header.guide') }}</span>
        </a>

        <!-- Instalar App: some depois de instalado -->
        <button v-if="isInstallable" class="guide-btn drawer-item" @click="promptInstall" style="--mobile-order: 6" :title="t('header.app_install')" :aria-label="t('header.app_install')">
          <Download :size="16" />
          <span class="btn-text show-mobile">{{ $t('header.app_install') }}</span>
          <span class="btn-label hide-mobile">{{ $t('header.app_install') }}</span>
        </button>

        <LanguageSwitcher class="drawer-item" style="--mobile-order: 7" mobile-drawer />

        <button class="info-btn drawer-item" @click="isInfoModalOpen = true" style="--mobile-order: 8" :title="t('header.info_contact')">
          <Info :size="20" />
          <span class="btn-text show-mobile">{{ $t('header.info_contact') }}</span>
        </button>

        <!-- O separador some quando não há conta (fora do WordPress o slot fica vazio) -->
        <span class="toolbar-sep" style="--mobile-order: 2" aria-hidden="true"></span>

        <!-- 3. Auth Menu (Slot): no menu do celular vem primeiro -->
        <div class="drawer-slot" style="--mobile-order: 1">
          <slot name="auth-menu"></slot>
        </div>

        <!-- Créditos no rodapé do Menu (Apenas Mobile) -->
        <div class="drawer-footer show-mobile" style="--mobile-order: 9">
          <span class="made-by-text">{{ $t('header.made_by') }}</span>
          <a :href="logoUrl" class="toolbar-logo-link" target="_blank" rel="noopener noreferrer">
            <img :src="logoClic" alt="CLIC" class="toolbar-logo-small" />
          </a>
        </div>

      </div>
    </div>
  </header>

  <!--
    Um só FileMenu, levado para o destino certo conforme a largura da tela.
    O Teleport move o componente sem recriá-lo: o estado e os modais abertos continuam.
  -->
  <Teleport v-if="fileMenuTarget" :to="fileMenuTarget">
    <slot name="file-menu"></slot>
  </Teleport>

  <!-- Modal de Info/Contato: variante de leitura do BaseModal (texto longo, sem rodapé, com X) -->
  <BaseModal v-if="isInfoModalOpen" :title="t('header.about_clic')" :icon="Info" tone="gray" size="reading" @close="isInfoModalOpen = false">
    <div class="about-body">
      <p v-html="$t('header.about_desc')" />

      <template v-if="!isLoggedIn">
        <h4 class="about-section-title"><Lock :size="18" /> {{ $t('header.full_access') }}</h4>
        <p>{{ $t('header.full_access_desc') }}</p>
      </template>

      <h4 class="about-section-title"><Wrench :size="18" /> {{ $t('header.bugs_suggestions') }}</h4>
      <p>{{ $t('header.bugs_desc') }}</p>

      <div class="about-footer-info">
        <p class="about-footer-item"><Mail :size="18" /> <strong>{{ $t('header.contact') }}</strong> <a href="mailto:clic@tltlab.org">clic@tltlab.org</a></p>
        <p class="about-footer-item"><Globe :size="18" /> <strong>{{ $t('header.site') }}</strong> <a href="https://clic.tltlab.org/" target="_blank" rel="noopener noreferrer">https://clic.tltlab.org/</a></p>
      </div>
      <!-- Versão do app: para relatos de problema e para saber o que está publicado -->
      <p v-if="versionLine" class="about-version">{{ versionLine }}</p>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
// Fonte das peças compartilhadas (.clic-ui). Importado aqui, e não no index.ts, porque o build descarta imports do index (sideEffects).
import '../styles/ui.css';
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import logoClic from '../assets/logo-clic.svg';
import { Info, BookOpen, X, Lock, Wrench, Mail, Globe, Menu, Home, Download } from '@lucide/vue';
import { useAuth } from '../auth/auth';
import { useAppInstall } from '../composables/useAppInstall';
import { useI18n } from 'vue-i18n';
import LanguageSwitcher from './LanguageSwitcher.vue';
import BaseModal from './modals/BaseModal.vue';
import { getAppVersionInfo } from '../utils/appVersion';

const props = defineProps<{
  title: string;
  appLogo?: string;
  guideUrl?: string;
  showHome?: boolean;
}>();

defineEmits(['home-click']);

const auth = useAuth();
const isLoggedIn = computed(() => auth.state.ready && auth.state.loggedIn);
const isInfoModalOpen = ref(false);

const { isInstallable, promptInstall } = useAppInstall();

const logoUrl = computed(() => {
  if (typeof window !== 'undefined' && window.CLIC_CORE) {
    return window.CLIC_CORE.site_url ?? window.CLIC_CORE.app_url ?? '/';
  }
  return 'https://clic.tltlab.org';
});

// Lógica de i18n
const { t, locale } = useI18n();

// Rodapé do modal de Info: "Novelo 2.0.0 · build de 13/10/2026 (3326ca7)"
const versionLine = computed(() => {
  const app = getAppVersionInfo();
  if (!app) return '';
  const date = app.buildDate ? new Date(app.buildDate).toLocaleDateString(locale.value) : '';
  return t('header.version', { app: props.title, version: app.version, date, commit: app.commit });
});
const isMobileMenuOpen = ref(false);

// Destino do FileMenu: no header (desktop/tablet) ou no menu lateral (celular). Mesmo limite do CSS (768px).
const fileMenuDesktop = ref<HTMLElement | null>(null);
const fileMenuMobile = ref<HTMLElement | null>(null);
const isMobile = ref(false);
const fileMenuTarget = computed(() => (isMobile.value ? fileMenuMobile.value : fileMenuDesktop.value));
let mobileQuery: MediaQueryList | null = null;
const onMobileChange = (e: MediaQueryListEvent | MediaQueryList) => { isMobile.value = e.matches; };

onMounted(() => {
  mobileQuery = window.matchMedia('(max-width: 768px)');
  onMobileChange(mobileQuery);
  mobileQuery.addEventListener('change', onMobileChange);
});
onBeforeUnmount(() => mobileQuery?.removeEventListener('change', onMobileChange));
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

/* Centralizado: funciona com qualquer desenho de logo (cada app tem o seu) */
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

/*
 * Cartão da marca: agrupa logo + assinatura sem parecer clicável.
 * Fundo #EFEFEF (o cinza do site), diferente do cinza do hover dos botões (#f3f4f6); sem sombra nem hover.
 */
.brand-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 5px 14px 5px 12px;
  border-radius: 12px;
  background: #EFEFEF;
  flex-shrink: 0;
}

.app-logo {
  height: 36px; /* Destaque do app, dentro do cartão */
  width: auto;
}

/* Destino do Arquivo no desktop/tablet */
.file-menu-desktop { display: flex; align-items: center; min-width: 0; }

/* Margem mínima: a base do texto fica na base das letras do logo do CLIC (as bolinhas ficam abaixo) */
.made-by-text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 400;
  margin: 0 0 1px 0;
  line-height: 1;
}

.toolbar-logo-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.toolbar-logo-small {
  height: 28px; /* Logo do CLIC menor que o do app, mas com as letras legíveis */
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
  gap: 4px;
}

/* Separa os grupos do lado direito: [Arquivo | projeto] │ [ajuda] │ [conta] */
.toolbar-sep {
  width: 1px;
  height: 24px;
  margin: 0 8px;
  background: #e5e7eb;
  flex-shrink: 0;
}
/* Sem conta (fora do WordPress) o slot fica vazio: o separador antes dele some */
.toolbar-sep:has(+ .drawer-slot:empty) { display: none; }
/* O separador do botão início fica em .toolbar-actions, que tem gap maior */
.toolbar-actions > .toolbar-sep { margin: 0 4px; }

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0; /* A direita não encolhe; o nome do projeto, à esquerda, é que corta com reticências */
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
/* Ajuda (Guia, Instalar): discretos, no mesmo estilo dos botões de ícone */
.guide-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  background: transparent;
  color: #4b5563;
  border: none;
  font-weight: 500;
  font-size: 14px;
  padding: 0 10px;
  border-radius: 8px;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.guide-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.info-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  color: #4b5563;
  border: none;
  cursor: pointer;
  padding: 0;
  border-radius: 8px;
  transition: color 0.2s, background 0.2s;
}
.info-btn:hover {
  color: #111827;
  background: #f3f4f6;
}

/* Modal de Info: cartão e cabeçalho vêm do BaseModal; aqui só o texto */
.about-body { font-size: 15px; line-height: 1.55; color: #374151; }
.about-body p { margin: 0 0 12px; }
.about-section-title {
  display: flex; align-items: center; gap: 8px;
  margin: 20px 0 8px;
  font-size: 15px; font-weight: 600; color: #1f2937;
}
.about-footer-info { margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
.about-footer-info a { color: #2563eb; text-decoration: none; }
.about-footer-info a:hover { text-decoration: underline; }
.about-footer-item { display: flex; align-items: center; gap: 8px; margin: 0 0 10px !important; }
.about-version { margin: 16px 0 0 !important; font-size: 12px; color: #6b7280; }

.show-mobile { display: none !important; }

/* Assinatura "feito pelo CLIC" (desktop), dentro do cartão: o cartão já agrupa, sem linha */
.made-by-container {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

/* Tablet: Guia e Instalar só com o ícone (a dica e o aria-label dizem o nome); nada quebra linha */
@media (min-width: 769px) and (max-width: 1200px) {
  .btn-label { display: none !important; }
  .guide-btn { width: 36px; padding: 0; justify-content: center; }
}

@media (max-width: 768px) {
  .hide-mobile { display: none !important; }
  .show-mobile { display: flex !important; }
  
  .toolbar {
    padding: 6px 16px;
    gap: 12px;
  }

  /* Cartão só no desktop/tablet: no celular fica só o logo, como antes */
  .brand-card { background: transparent; padding: 0; }

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

  /* No menu lateral os separadores ficam na horizontal */
  .toolbar-right > .toolbar-sep {
    order: var(--mobile-order);
    width: 100%; height: 1px; margin: 4px 0;
  }

  .guide-btn, .info-btn {
    width: 100%; height: auto; justify-content: flex-start; gap: 12px;
    padding: 12px; font-size: 15px; font-weight: 500; border-radius: 8px;
    background: #f9fafb; color: #374151; border: none;
  }
  
  .drawer-footer {
    margin-top: 20px; flex-direction: column; align-items: flex-start;
    gap: 12px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex !important;
  }
}
</style>