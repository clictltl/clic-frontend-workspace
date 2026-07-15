<template>
  <div v-if="ENABLE_LANGUAGE_SWITCHER" class="lang-dropdown-wrapper">
    <button 
      class="lang-btn" 
      :class="{ 'in-drawer': mobileDrawer }"
      @click="isLangMenuOpen = !isLangMenuOpen" 
      :title="t('header.language')"
    >
      <Languages :size="20" />
      <span v-if="mobileDrawer" class="btn-text show-mobile">{{ $t('header.language') }}</span>
    </button>
    
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
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Languages } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { setLocale, availableLocales, ENABLE_LANGUAGE_SWITCHER, type SupportedLocales } from '../i18n';

defineProps<{
  mobileDrawer?: boolean; // Se true, aplica o layout do menu lateral do AppHeader
}>();

const { locale: currentLocale, t } = useI18n();
const isLangMenuOpen = ref(false);

function changeLanguage(code: SupportedLocales) {
  setLocale(code);
  isLangMenuOpen.value = false;
}
</script>

<style scoped>
.lang-dropdown-wrapper {
  position: relative;
}

.lang-btn {
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

.lang-btn:hover {
  color: #111827;
  background: #f3f4f6;
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
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 40;
}

.show-mobile { display: none !important; }

@media (max-width: 768px) {
  .show-mobile { display: flex !important; }
  
  .lang-btn.in-drawer {
    width: 100%; 
    justify-content: flex-start; 
    gap: 12px;
    padding: 12px; 
    font-size: 15px; 
    border-radius: 8px;
    background: #f9fafb; 
    color: #374151; 
    border: none;
  }
}
</style>