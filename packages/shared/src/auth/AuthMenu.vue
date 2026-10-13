<template>
  <!-- Só renderiza se estiver no WordPress e o sistema de auth estiver carregado -->
  <div v-if="isWordPress" class="auth-menu-container clic-ui">
    
    <!-- Estado: Verificando -->
    <span v-if="!auth.state.ready" class="loading-state">
      <span class="spinner"></span>
    </span>

    <!-- Estado: Usuário NÃO logado -->
    <button v-else-if="!auth.state.loggedIn" class="btn-login" @click="auth.state.showLoginModal = true">
      <User :size="16" class="icon" /> {{ $t('auth.login') }}
    </button>

    <!-- Estado: Usuário LOGADO -->
    <div v-else class="user-profile-wrapper" ref="userMenuContainer">
      <!-- Botão do Perfil -->
      <!-- Ícone em vez de iniciais: as contas de aluno são anônimas (TURMA-01), e as iniciais não diriam nada -->
      <button class="user-trigger" :class="{ 'active': showUserMenu }" @click="toggleUserMenu" :title="t('auth.account')" :aria-label="t('auth.account')">
        <div class="avatar-circle">
          <User :size="16" />
        </div>
        <!-- Só no menu do celular: lá a linha da conta ficaria só com o ícone -->
        <span v-if="accountLabel" class="user-trigger-label">{{ accountLabel }}</span>
        <ChevronDown :size="16" class="chevron" />
      </button>

      <!-- Dropdown Menu (Logout) -->
      <transition name="fade-slide">
        <div v-if="showUserMenu" class="user-dropdown">
          <!-- Em computador compartilhado, o aluno confere em qual conta entrou -->
          <div v-if="accountLabel" class="user-info">
            <span class="user-info-caption">{{ $t('auth.signed_in_as') }}</span>
            <span class="user-info-name">{{ accountLabel }}</span>
          </div>
          <div class="menu-item danger" @click="logout">
            <LogOut :size="16" class="icon" /> {{ $t('auth.logout') }}
          </div>
        </div>
      </transition>
    </div>

    <!-- Modal de Login -->
    <transition name="fade">
      <div v-if="auth.state.showLoginModal" class="modal-backdrop clic-ui">
        <div class="modal-overlay" @click="closeModal"></div>
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ $t('auth.welcome_back') }}</h3>
            <p>{{ $t('auth.login_prompt') }}</p>
          </div>

          <form @submit.prevent="submitLogin" class="login-form">
            <div class="form-group">
              <label>{{ $t('auth.user_or_email') }}</label>
              <input ref="usernameInput" v-model="username" type="text" required :placeholder="$t('auth.type_user')" />
            </div>

            <div class="form-group">
              <label>{{ $t('auth.password') }}</label>
              <input v-model="password" type="password" required :placeholder="$t('auth.type_password')" />
            </div>

            <p v-if="error" class="error-msg">
              <AlertTriangle :size="16" class="icon" /> {{ error }}
            </p>

            <div class="form-actions">
              <button type="button" class="btn-cancel" @click="closeModal">{{ $t('global.cancel') }}</button>
              <button type="submit" class="btn-confirm" :disabled="loading">
                <span v-if="loading" class="spinner-sm"></span>
                {{ loading ? $t('auth.logging_in') : $t('auth.login') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
// Fonte das peças compartilhadas (.clic-ui). Importado aqui, e não no index.ts, porque o build descarta imports do index (sideEffects).
import '../styles/ui.css';
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useAuth, applyLoginResponse } from './auth';
import { decodeHtml } from '../utils/decodeHtml';
import { telemetryService } from '../analytics/telemetry';
import { User, LogOut, ChevronDown, AlertTriangle } from '@lucide/vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Avisa o App pai depois que o login já foi aplicado (sem recarregar a página)
const emit = defineEmits(['login-success']);

// Estado auth (singleton)
const auth = useAuth();

// Estados
const showUserMenu = ref(false); 
const userMenuContainer = ref<HTMLElement | null>(null);

const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const usernameInput = ref<HTMLInputElement | null>(null);

// Detecta WP
const isWordPress = typeof window !== 'undefined' && !!window.CLIC_AUTH;

// --- Lógica de Interação ---
watch(() => auth.state.showLoginModal, (open) => {
  if (open) {
    requestAnimationFrame(() => usernameInput.value?.focus());
  }
});

const handleClickOutside = (event: MouseEvent) => {
  if (showUserMenu.value && userMenuContainer.value && !userMenuContainer.value.contains(event.target as Node)) {
    showUserMenu.value = false;
  }
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value;
}

function closeModal() {
  auth.state.showLoginModal = false;
  username.value = '';
  password.value = '';
  error.value = '';
}

// Login (ex.: TURMA7B-01) quando o clic-auth enviar; até lá, o nome de exibição
const accountLabel = computed(() => decodeHtml(auth.state.login || auth.state.name || ''));

// --- Lógica de Auth ---
const ERROR_MESSAGES: Record<string, string> = {
  'MISSING_CREDENTIALS': 'auth.fill_fields',
  'LOGIN_FAILED': 'auth.invalid_credentials',
  'TOO_MANY_ATTEMPTS': 'auth.too_many_attempts',
  'LGPD_REQUIRED': 'auth.blocked_terms',
  'ACCOUNT_BLOCKED': 'auth.blocked_teacher'
}

async function submitLogin() {
  error.value = '';
  loading.value = true;

  const restRoot = window.CLIC_AUTH?.rest_root ?? '/wp-json/clic-auth/v1/';
 
  try {
    const res = await fetch(restRoot + 'login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      // Sem recarregar: o projeto, os arquivos locais e a fila da telemetria continuam na memória
      if (!(await applyLoginResponse(data))) {
        error.value = t('auth.session_refresh_failed');
        return;
      }
      closeModal();
      telemetryService.onLogin();
      emit('login-success');
      return;
    }

    const errorKey = ERROR_MESSAGES[data.error];
    error.value = errorKey ? t(errorKey) : t('auth.login_error');
  } catch (err: any) {
    error.value = err?.message || t('global.unexpected_error');
  } finally {
    loading.value = false;
  }
}

function logout() {
  const rawUrl = window.CLIC_AUTH?.logout_url || '/wp-login.php?action=logout';
  window.location.href = decodeHtml(rawUrl);
}
</script>

<style scoped>
/* Fonte Padrão */
.auth-menu-container {
  display: flex;
  align-items: center;
}

/* --- Estado Loading --- */
.loading-state { padding: 0 10px; }
.spinner {
  display: inline-block; width: 16px; height: 16px;
  border: 2px solid #e5e7eb; border-top-color: #6b7280;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}

/* --- Botão Login (Unlogged) --- */
/* Laranja do site (brand-orange): a única cor forte do header, igual em todos os apps */
.btn-login {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #C64F28;
  border: 1px solid #C64F28;
  color: #fff;
  padding: 7px 18px;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-login:hover {
  background: #9B3C1E;
  border-color: #9B3C1E;
}

/* --- Usuário Logado (Logged) --- */
.user-profile-wrapper {
  position: relative;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.user-trigger:hover, .user-trigger.active {
  background: #f3f4f6;
}

/* Avatar Circle */
.avatar-circle {
  width: 28px; height: 28px;
  background: #C64F28;
  color: white;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}

.user-trigger-label { display: none; }

.chevron { color: #9ca3af; transition: transform 0.2s; }
.user-trigger.active .chevron { transform: rotate(180deg); }

/* --- Dropdown User --- */
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 4px;
  z-index: 50;
}

.user-info {
  display: flex; flex-direction: column; gap: 2px;
  padding: 8px 12px 10px;
  margin-bottom: 4px;
  border-bottom: 1px solid #e5e7eb;
}
.user-info-caption { font-size: 12px; color: #6b7280; }
.user-info-name { font-size: 14px; font-weight: 600; color: #1f2937; white-space: nowrap; }

.menu-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  transition: background 0.15s;
}

.menu-item:hover { background: #f3f4f6; }
.menu-item.danger { color: #dc2626; }
.menu-item.danger:hover { background: #fef2f2; }

/* --- Modal Login Styles --- */
.modal-backdrop {
  position: fixed; inset: 0;
  z-index: 10000;
  display: flex; align-items: center; justify-content: center;
}

.modal-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(2px);
}

.modal-card {
  position: relative;
  background: white;
  width: 100%; max-width: 360px;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
  animation: slideUp 0.3s ease-out;
}

.modal-header h3 { margin: 0 0 0.5rem 0; color: #111827; font-size: 1.25rem; text-align: center; }
.modal-header p { margin: 0 0 1.5rem 0; color: #6b7280; font-size: 0.875rem; text-align: center; }

.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 500; color: #374151; margin-bottom: 0.4rem; }
.form-group input {
  width: 100%; padding: 0.6rem 0.8rem;
  border: 1px solid #d1d5db; border-radius: 6px;
  font-size: 0.95rem; outline: none; transition: border 0.2s;
}
.form-group input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }

.error-msg {
  background: #fef2f2; color: #b91c1c; font-size: 0.85rem;
  padding: 0.6rem; border-radius: 6px; display: flex; align-items: center; gap: 6px;
  margin-bottom: 1rem;
}
.error-msg .icon { flex-shrink: 0; }

.form-actions {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem;
}

.btn-cancel {
  background: white; border: 1px solid #d1d5db; color: #374151;
  padding: 0.6rem; border-radius: 6px; cursor: pointer; font-weight: 500;
  transition: background 0.2s;
}
.btn-cancel:hover { background: #f9fafb; }

.btn-confirm {
  background: #2563eb; border: none; color: white;
  padding: 0.6rem; border-radius: 6px; cursor: pointer; font-weight: 500;
  display: flex; justify-content: center; align-items: center; gap: 8px;
  transition: background 0.2s;
}
.btn-confirm:hover { background: #1d4ed8; }
.btn-confirm:disabled { opacity: 0.7; cursor: wait; }

/* Animações */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.fade-slide-enter-active, .fade-slide-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-8px); }

@media (max-width: 768px) {
  .auth-menu-container {
    width: 100%;
  }
  
  .user-profile-wrapper, .btn-login {
    width: 100%;
  }

  .btn-login, .user-trigger {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    font-size: 15px;
  }
  .btn-login { justify-content: center; }
  .user-trigger { justify-content: flex-start; background-color: #f3f4f6; }
  .user-trigger-label { display: inline; font-size: 15px; font-weight: 500; color: #374151; margin-right: auto; }

  .user-dropdown {
    position: static;
    width: 100%;
    box-shadow: none;
    border: none;
    border-left: 3px solid #e5e7eb;
    border-radius: 0;
    margin-top: 8px;
    padding: 0 0 0 12px;
  }
}
</style>