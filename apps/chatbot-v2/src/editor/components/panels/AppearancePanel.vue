<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Check } from '@lucide/vue';
import { useProjectStore } from '../../../shared/stores/projectStore';
import { CHAT_FONTS, FONT_SIZES, THEMES } from '../../../shared/types/chatbot';
import { FONT_FAMILIES, FONT_SIZE_PX, THEME_COLORS, WELCOME_TITLE_MAX } from '../../../shared/domain/appearance';
import { loadChatFont } from '../../../shared/chat/chatFonts';
import DraftInput from '../common/DraftInput.vue';
import ChoiceMediaPicker from '../common/ChoiceMediaPicker.vue';

/** Título, tela inicial e aparência do chat (runtime e painel Testar). Cada escolha é uma action. */
const { t } = useI18n();
const projectStore = useProjectStore();
const appearance = computed(() => projectStore.project.appearance);

// As amostras usam a própria fonte: só o editor baixa todas
onMounted(() => CHAT_FONTS.forEach(loadChatFont));

function commitWelcomeTitle(raw: string) {
  const welcomeTitle = raw.trim().slice(0, WELCOME_TITLE_MAX);
  if (welcomeTitle !== appearance.value.welcomeTitle) projectStore.setAppearance({ welcomeTitle });
}
</script>

<template>
  <div class="panel-content properties">
    <div class="form-group">
      <label>{{ t('chatbot.appearance.title') }}</label>
      <DraftInput
        :model-value="projectStore.project.title"
        :placeholder="t('chatbot.appearance.title_placeholder')"
        @commit="title => projectStore.renameProject(title.trim())"
      />
    </div>

    <div class="form-group">
      <label>{{ t('chatbot.appearance.avatar') }}</label>
      <div class="avatar-row">
        <ChoiceMediaPicker
          :media="appearance.avatar"
          :size="36"
          @change="avatar => projectStore.setAppearance({ avatar })"
        />
      </div>
    </div>

    <div class="form-group">
      <label>{{ t('chatbot.appearance.welcome_title') }}</label>
      <DraftInput
        :model-value="appearance.welcomeTitle"
        :placeholder="t('chatbot.runtime.player.title')"
        :maxlength="WELCOME_TITLE_MAX"
        @commit="commitWelcomeTitle"
      />
    </div>

    <hr class="divider" />

    <div class="form-group">
      <label>{{ t('chatbot.appearance.theme') }}</label>
      <div class="theme-grid">
        <button
          v-for="theme in THEMES"
          :key="theme"
          type="button"
          class="theme-card"
          :class="{ active: appearance.theme === theme }"
          :aria-pressed="appearance.theme === theme"
          @click="appearance.theme !== theme && projectStore.setAppearance({ theme })"
        >
          <!-- Miniatura: fundo, balão do bot e balão do aluno -->
          <span
            class="theme-preview"
            :style="{ backgroundColor: THEME_COLORS[theme].background, backgroundImage: THEME_COLORS[theme].backgroundImage }"
          >
            <span class="mini-bubble bot" :style="{ background: THEME_COLORS[theme].botBubble, borderColor: THEME_COLORS[theme].botBorder }"></span>
            <span class="mini-bubble user" :style="{ background: THEME_COLORS[theme].userBubble }"></span>
            <span v-if="appearance.theme === theme" class="theme-check"><Check :size="12" :stroke-width="3" /></span>
          </span>
          <span class="theme-name">{{ t(`chatbot.appearance.themes.${theme}`) }}</span>
        </button>
      </div>
    </div>

    <div class="form-group">
      <label>{{ t('chatbot.appearance.font') }}</label>
      <div class="font-list">
        <button
          v-for="font in CHAT_FONTS"
          :key="font"
          type="button"
          class="font-option"
          :class="{ active: appearance.font === font }"
          :aria-pressed="appearance.font === font"
          :style="{ fontFamily: FONT_FAMILIES[font] }"
          @click="appearance.font !== font && projectStore.setAppearance({ font })"
        >
          <span class="font-name">{{ t(`chatbot.appearance.fonts.${font}`) }}</span>
          <span class="font-sample">{{ t('chatbot.appearance.font_sample') }}</span>
        </button>
      </div>
    </div>

    <div class="form-group">
      <label>{{ t('chatbot.appearance.font_size') }}</label>
      <div class="size-options">
        <button
          v-for="size in FONT_SIZES"
          :key="size"
          type="button"
          class="size-option"
          :class="{ active: appearance.fontSize === size }"
          :aria-pressed="appearance.fontSize === size"
          @click="appearance.fontSize !== size && projectStore.setAppearance({ fontSize: size })"
        >
          <span class="size-sample" :style="{ fontSize: `${FONT_SIZE_PX[size]}px`, fontFamily: FONT_FAMILIES[appearance.font] }">Aa</span>
          <span class="size-label">{{ t(`chatbot.appearance.font_sizes.${size}`) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-content { padding: 16px; }
.avatar-row { display: flex; align-items: center; min-height: 40px; }

/* Botões de escolha (tema, fonte, tamanho) */
.theme-card, .font-option, .size-option {
  border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; color: #374151;
}
.theme-card:hover, .font-option:hover, .size-option:hover { border-color: #9ca3af; }
.theme-card.active, .font-option.active, .size-option.active { border-color: #3b82f6; background: #eff6ff; color: #1d4ed8; }
.theme-card:focus-visible, .font-option:focus-visible, .size-option:focus-visible { outline: 3px solid #93c5fd; outline-offset: 1px; }

.theme-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.theme-card { display: flex; flex-direction: column; gap: 4px; padding: 4px; }
.theme-preview {
  position: relative; display: flex; flex-direction: column; justify-content: center; gap: 4px;
  height: 46px; padding: 6px; border-radius: 4px; background-size: 60px 60px;
}
.mini-bubble { display: block; height: 9px; border-radius: 4px; }
.mini-bubble.bot { width: 65%; border: 1px solid; align-self: flex-start; }
.mini-bubble.user { width: 50%; align-self: flex-end; }
.theme-check {
  position: absolute; top: 3px; right: 3px; width: 16px; height: 16px; border-radius: 50%;
  background: #1d4ed8; color: white; display: flex; align-items: center; justify-content: center;
}
.theme-name { font-size: 11px; font-weight: 600; line-height: 1.2; }

.font-list { display: flex; flex-direction: column; gap: 6px; }
.font-option { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 8px 10px; text-align: left; }
.font-name { font-size: 15px; font-weight: 700; }
.font-sample { font-size: 14px; color: #6b7280; white-space: nowrap; }
.font-option.active .font-sample { color: #1d4ed8; }

.size-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.size-option { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 4px; padding: 10px 4px; }
.size-sample { font-weight: 700; line-height: 1; }
.size-label { font-size: 12px; }
</style>
