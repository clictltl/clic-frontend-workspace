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
      <a v-if="guideUrl" :href="guideUrl" target="_blank" class="guide-btn" rel="noopener noreferrer">
        <BookOpen :size="16" />
        Guia
      </a>
      
      <button class="info-btn" @click="isInfoModalOpen = true" title="Informações e Contato">
        <Info :size="20" />
      </button>

      <!-- O slot permite que o App pai injete o FileMenu, AuthMenu, etc. -->
      <slot></slot>
    </div>
  </header>

  <!-- Modal de Info/Contato -->
  <teleport to="body">
    <div v-if="isInfoModalOpen" class="about-modal-overlay" @click.self="isInfoModalOpen = false">
      <div class="about-modal-content">
        <div class="about-modal-header">
          <h2>Sobre o CLIC</h2>
          <button class="about-close-btn" @click="isInfoModalOpen = false"><X :size="20" /></button>
        </div>
        
        <div class="about-modal-body">
          <p>Esta ferramenta faz parte do <strong>CLIC</strong>, uma iniciativa do Transformative Learning Technologies Lab (TLTL) da Universidade de Columbia.</p>
          
          <template v-if="!isLoggedIn">
            <h3 class="about-section-title"><Lock :size="18" /> Acesso Completo</h3>
            <p>Você está utilizando a ferramenta no modo livre. Caso seja um educador e queira salvar seus projetos na nuvem, criar turmas e acessar nossas Sequências Didáticas, solicite a sua conta através do nosso e-mail de contato.</p>
          </template>

          <h3 class="about-section-title"><Wrench :size="18" /> Bugs e Sugestões</h3>
          <p>Sua contribuição é muito importante para a evolução contínua deste projeto. Se você encontrou algum erro na ferramenta ou quer nos enviar feedbacks e sugestões de melhoria, não hesite em nos contatar.</p>
          
          <div class="about-footer-info">
            <p class="about-footer-item"><Mail :size="18" /> <strong>Contato:</strong> <a href="mailto:clic@tltlab.org">clic@tltlab.org</a></p>
            <p class="about-footer-item"><Globe :size="18" /> <strong>Site:</strong> <a href="https://clic.tltlab.org/" target="_blank">https://clic.tltlab.org/</a></p>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import logoClic from '../assets/logo-clic.svg';
import { Info, BookOpen, X, Lock, Wrench, Mail, Globe } from 'lucide-vue-next';
import { useAuth } from '../auth/auth';

defineProps<{
  title: string;
  appLogo?: string;
  guideUrl?: string;
}>();

const auth = useAuth();
const isLoggedIn = computed(() => auth.state.ready && auth.state.loggedIn);
const isInfoModalOpen = ref(false);

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
</style>