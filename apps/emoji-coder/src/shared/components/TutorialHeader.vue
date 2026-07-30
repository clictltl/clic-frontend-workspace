<template>
  <div 
    v-if="projectStore.isSequenceMode && currentChallenge" 
    class="tutorial-mission-card"
    :class="[{ 'collapsed': isMissionCollapsed, 'activity-mode': projectStore.isActivityMode }]"
  >
    <div class="mission-header" @click="toggleMission" :style="isMobile ? 'cursor: pointer' : ''">
      <div class="mission-header-left">
        <span class="mission-progress">
          {{ projectStore.isActivityMode 
             ? t('emojiCoder.player.activity', { number: projectStore.activeChallengeIndex + 1 }) 
             : t('emojiCoder.player.challenge', { number: projectStore.activeChallengeIndex + 1 }) 
          }}
        </span>
        <span class="mission-title-inline" v-show="isMissionCollapsed">{{ currentChallenge.title }}</span>
      </div>

      <div class="mission-navigation" v-show="!isMissionCollapsed">
        
        <!-- MODO TUTORIAL: Navegação Verde com Bolinhas -->
        <template v-if="projectStore.isTutorialMode">
          <div class="nav-arrows">
            <button class="nav-arrow" :disabled="projectStore.activeChallengeIndex === 0" @click.stop="goToChallenge(projectStore.activeChallengeIndex - 1)">
              <ChevronLeft :size="18" />
            </button>
            <button class="nav-arrow" :disabled="isLastChallenge" @click.stop="goToChallenge(projectStore.activeChallengeIndex + 1)">
              <ChevronRight :size="18" />
            </button>
          </div>
          <div class="mission-dots">
            <span v-for="(_, i) in totalChallenges" :key="i" class="dot" :class="{ active: i === projectStore.activeChallengeIndex, done: i < projectStore.activeChallengeIndex }" @click.stop="goToChallenge(i)"></span>
          </div>
        </template>

        <!-- MODO ATIVIDADE: Navegação Azul Simples (Botões Circulares) -->
        <template v-else-if="projectStore.isActivityMode">
          <div class="activity-nav-arrows">
            <button class="activity-arrow" :disabled="projectStore.activeChallengeIndex === 0" @click.stop="goToChallenge(projectStore.activeChallengeIndex - 1)">
              <ArrowLeft :size="20" />
            </button>
            <button class="activity-arrow" :disabled="isLastChallenge" @click.stop="goToChallenge(projectStore.activeChallengeIndex + 1)">
              <ArrowRight :size="20" />
            </button>
          </div>
        </template>

      </div>

      <button class="toggle-btn" v-show="isMobile">
        <ChevronDown v-if="isMissionCollapsed" :size="20"/>
        <ChevronUp v-else :size="20"/>
      </button>
    </div>

    <div class="mission-body" v-show="!isMissionCollapsed">
      <h3 class="mission-title">{{ currentChallenge.title }}</h3>
      <p class="mission-desc">{{ currentChallenge.description }}</p>
      
      <div class="mission-tip-container" v-if="currentChallenge.tip">
        <button v-if="!showTip" class="reveal-tip-btn" @click.stop="showTip = true">
          <Lightbulb :size="16" class="inline-icon" /> {{ t('emojiCoder.player.need_hint') }}
        </button>
        <div v-else class="mission-tip">
          <strong><Lightbulb :size="16" class="inline-icon" /> {{ t('emojiCoder.player.hint') }}</strong> {{ currentChallenge.tip }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '@/shared/stores/projectStore';
import { getTutorialChallenges } from '@/tutorials';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Lightbulb, ArrowLeft, ArrowRight } from '@lucide/vue';

const { t } = useI18n();
const projectStore = useProjectStore();

const isMobile = ref(window.innerWidth <= 768);
const isMissionCollapsed = ref(isMobile.value);
const showTip = ref(false);

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
  if (!isMobile.value) {
    isMissionCollapsed.value = false;
  }
};

const toggleMission = () => {
  if (isMobile.value) {
    isMissionCollapsed.value = !isMissionCollapsed.value;
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const activeChallengeList = computed(() => {
  if (!projectStore.isSequenceMode) return [];
  return getTutorialChallenges(projectStore.project.config.libraryId, t);
});

const totalChallenges = computed(() => activeChallengeList.value.length);

const currentChallenge = computed(() => {
  if (!projectStore.isSequenceMode) return null;
  return activeChallengeList.value[projectStore.activeChallengeIndex] || activeChallengeList.value[0];
});

const isLastChallenge = computed(() => {
  return projectStore.activeChallengeIndex >= totalChallenges.value - 1;
});

const goToChallenge = (index: number) => {
  if (index === projectStore.activeChallengeIndex) return;
  if (index < 0 || index >= totalChallenges.value) return;

  const wasClean = !projectStore.hasUnsavedChanges;
  showTip.value = false;
  const targetChal = activeChallengeList.value[index];
  
  if (targetChal) {
    projectStore.loadChallenge(index, targetChal);
  }

  if (wasClean) projectStore.markAsSaved();
};
</script>

<style scoped>
.tutorial-mission-card { padding: 1rem 1.25rem; background-color: #f0fdf4; border-bottom: 1px solid #bbf7d0; flex-shrink: 0; transition: padding 0.2s ease; }
.tutorial-mission-card.collapsed { padding: 0.6rem 1rem; }
.mission-header { display: flex; justify-content: space-between; align-items: center; user-select: none; }
.tutorial-mission-card:not(.collapsed) .mission-header { margin-bottom: 0.5rem; }
.mission-header-left { display: flex; align-items: center; gap: 0.5rem; }
.mission-progress { font-size: 0.75rem; font-weight: 700; color: #16a34a; text-transform: uppercase; letter-spacing: 0.05em; }
.mission-title-inline { font-size: 0.9rem; font-weight: 600; color: #14532d; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
.toggle-btn { background: none; border: none; color: #16a34a; display: flex; align-items: center; padding: 0; }
.mission-navigation { display: flex; align-items: center; gap: 10px; }
.nav-arrows { display: flex; align-items: center; gap: 2px; }
.nav-arrow { background: none; border: none; padding: 2px; display: flex; align-items: center; justify-content: center; color: #15803d; cursor: pointer; border-radius: 4px; transition: background-color 0.2s, opacity 0.2s; }
.nav-arrow:hover:not(:disabled) { background-color: #dcfce7; }
.nav-arrow:disabled { opacity: 0.3; cursor: not-allowed; }
.mission-dots { display: flex; gap: 4px; }
.mission-dots .dot { width: 8px; height: 8px; border-radius: 50%; background-color: #dcfce7; cursor: pointer; transition: transform 0.2s ease, background-color 0.2s; }
.mission-dots .dot:hover { transform: scale(1.4); }
.mission-dots .dot.done { background-color: #22c55e; }
.mission-dots .dot.active { background-color: #16a34a; transform: scale(1.2); }
.mission-title { margin: 0 0 0.25rem 0; font-size: 1.1rem; color: #14532d; }
.mission-desc { margin: 0; font-size: 0.9rem; color: #166534; line-height: 1.4; }
.mission-tip-container { margin-top: 0.75rem; }
.reveal-tip-btn { display: inline-flex; align-items: center; background: none; border: 1px dashed #86efac; color: #15803d; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; font-weight: 500; }
.reveal-tip-btn:hover { background-color: #dcfce7; border-color: #22c55e; }
.mission-tip { padding: 0.5rem; background-color: #dcfce7; border-radius: 6px; font-size: 0.85rem; color: #15803d; border-left: 3px solid #22c55e; animation: fadeIn 0.3s ease; }
.inline-icon { vertical-align: text-bottom; margin-right: 4px; }

/* =========================================
   VARIANTE: MODO ATIVIDADE (AZUL)
========================================== */
.tutorial-mission-card.activity-mode { 
  background-color: #eff6ff; 
  border-bottom-color: #bfdbfe; 
}
.tutorial-mission-card.activity-mode .mission-progress { 
  color: #2563eb; 
}
.tutorial-mission-card.activity-mode .mission-title-inline,
.tutorial-mission-card.activity-mode .mission-title { 
  color: #1e3a8a; 
}
.tutorial-mission-card.activity-mode .mission-desc { 
  color: #1d4ed8; 
}
.tutorial-mission-card.activity-mode .toggle-btn { 
  color: #2563eb; 
}

/* Dicas no Modo Atividade */
.tutorial-mission-card.activity-mode .reveal-tip-btn { 
  border-color: #93c5fd; 
  color: #1d4ed8; 
}
.tutorial-mission-card.activity-mode .reveal-tip-btn:hover { 
  background-color: #dbeafe; 
  border-color: #3b82f6; 
}
.tutorial-mission-card.activity-mode .mission-tip { 
  background-color: #dbeafe; 
  color: #1d4ed8; 
  border-left-color: #3b82f6; 
}

/* Navegação Exclusiva do Modo Atividade */
.activity-nav-arrows { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
}
.activity-arrow { 
  background-color: #3b82f6; 
  color: white; 
  border: none; 
  width: 34px; 
  height: 34px; 
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  cursor: pointer; 
  transition: all 0.2s ease; 
  box-shadow: 0 2px 5px rgba(59, 130, 246, 0.3);
}
.activity-arrow:hover:not(:disabled) { 
  background-color: #2563eb; 
  transform: scale(1.05); 
}
.activity-arrow:disabled { 
  background-color: #bfdbfe; 
  color: #eff6ff; 
  cursor: not-allowed; 
  box-shadow: none; 
}

@media (max-width: 768px) {
  .mission-title-inline { font-size: 0.85rem; max-width: 200px; }
  .mission-title { font-size: 1rem; }
  .mission-desc { font-size: 0.85rem; }
}
</style>