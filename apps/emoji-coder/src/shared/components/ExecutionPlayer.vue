<template>
  <div class="execution-panel" :class="{ 'runtime-mode': isRuntime }">
    
    <!-- MISSÃO DO TUTORIAL (Sanfona Inteligente) -->
    <div 
      v-if="projectStore.isTutorialMode && currentChallenge" 
      class="tutorial-mission-card"
      :class="{ 'collapsed': isMissionCollapsed }"
    >
      <div class="mission-header" @click="toggleMission" :style="isMobile ? 'cursor: pointer' : ''">
        <div class="mission-header-left">
          <span class="mission-progress">{{ t('emojiCoder.player.challenge', { number: projectStore.activeChallengeIndex + 1 }) }}</span>
          <span class="mission-title-inline" v-show="isMissionCollapsed">{{ currentChallenge.title }}</span>
        </div>

        <div class="mission-navigation" v-show="!isMissionCollapsed">
          <div class="nav-arrows">
            <button 
              class="nav-arrow" 
              :disabled="projectStore.activeChallengeIndex === 0"
              @click.stop="goToChallenge(projectStore.activeChallengeIndex - 1)"
            >
              <ChevronLeft :size="18" />
            </button>
            <button 
              class="nav-arrow" 
              :disabled="isLastChallenge"
              @click.stop="goToChallenge(projectStore.activeChallengeIndex + 1)"
            >
              <ChevronRight :size="18" />
            </button>
          </div>
          <div class="mission-dots">
            <span 
              v-for="(_, i) in totalChallenges" 
              :key="i" 
              class="dot" 
              :class="{ active: i === projectStore.activeChallengeIndex, done: i < projectStore.activeChallengeIndex }"
              @click.stop="goToChallenge(i)"
              :title="t('emojiCoder.player.go_to_challenge')"
            ></span>
          </div>
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

    <!-- O Palco Principal -->
    <div class="canvas-container">
      <GridCanvas :engine="engine" :speed-ms="currentSpeedMs" />
      
      <!-- OVERLAY DE SUCESSO DO TUTORIAL -->
      <div v-if="showSuccess" class="success-overlay">
        <div class="success-card">
          <h2 class="title-with-icon"><PartyPopper :size="28" /> {{ t('emojiCoder.player.success') }}</h2>
          <p>{{ currentChallenge?.successMsg }}</p>
          <button class="next-challenge-btn" @click="handleNextChallenge">
            {{ isLastChallenge ? t('emojiCoder.player.finish_tutorial') : t('emojiCoder.player.next_challenge') }}
          </button>
        </div>
      </div>

      <!-- OVERLAY DE CONCLUSÃO DO TUTORIAL -->
      <div v-if="showTutorialComplete" class="success-overlay final-overlay">
        <div class="success-card final-card">
          <h2 class="title-with-icon"><Trophy :size="32" /> {{ t('emojiCoder.player.tutorial_completed') }}</h2>
          <p>{{ t('emojiCoder.player.tutorial_completed_desc') }}</p>
          
          <div class="save-tip" v-if="!isRuntime">
            <Lightbulb :size="18" class="inline-icon-top" /> 
            <span v-html="t('emojiCoder.player.save_tip')"></span>
          </div>

          <button class="next-challenge-btn btn-home" @click="goHome">
            {{ t('emojiCoder.player.back_home') }}
          </button>
        </div>
      </div>
    </div>

    <!-- O Painel de Controle (Dividido em 2 Linhas) -->
    <div class="control-board">
      <div class="settings-row">
        <div class="step-indicator" v-if="engine.state.totalSteps > 0">
          <span class="label">{{ t('emojiCoder.player.step') }}</span>
          <span class="current">{{ engine.state.currentStep }}</span>
          <span class="divider">/</span>
          <span class="total">{{ engine.state.totalSteps }}</span>
        </div>
        <div class="step-indicator empty" v-else>
          <span class="label">{{ t('emojiCoder.player.waiting_code') }}</span>
        </div>

        <div class="speed-control">
          <TurtleIcon :size="16" class="speed-icon"/>
          <input type="range" min="1" max="5" v-model="executionSpeed" :title="t('emojiCoder.player.speed')" />
          <Rabbit :size="16" class="speed-icon"/>
        </div>
      </div>

      <div class="actions-row">
        <div class="action-group left">
          <button class="btn icon-btn reset-btn" :title="t('emojiCoder.player.reset_world')" @click="handleReset" :disabled="showSuccess">
            <RotateCcw :size="20" />
          </button>
        </div>

        <div class="action-group center">
          <button class="btn icon-btn play-btn" v-if="engine.state.status === 'IDLE'" :title="t('emojiCoder.player.run_code')" @click="handlePlay" :disabled="showSuccess">
            <img :src="iconStart" alt="Start" class="svg-icon" />
          </button>
          
          <button class="btn icon-btn resume-btn" v-else-if="engine.state.status === 'PAUSED'" :title="t('emojiCoder.player.resume')" @click="handlePlay" :disabled="showSuccess">
            <Play :size="26" />
          </button>

          <button class="btn icon-btn pause-btn" v-else :title="t('emojiCoder.player.pause')" @click="handlePause" :disabled="showSuccess">
            <Pause :size="26" />
          </button>

          <button class="btn icon-btn step-btn" :title="t('emojiCoder.player.step_by_step')" @click="handleStep" :disabled="engine.state.status === 'RUNNING' || showSuccess">
            <StepForward :size="20" />
          </button>
        </div>

        <div class="action-group right">
          <!-- Botão de Exportar Desenho (Câmera) -->
          <button class="btn icon-btn export-btn" :title="t('emojiCoder.player.export_image')" @click="handleExportImage">
            <Camera :size="20" />
          </button>

          <!-- Esconde o botão de minimizar caso esteja em modo Runtime (Publicado) -->
          <button v-if="!isRuntime" class="btn icon-btn expand-btn" :title="isPreview ? t('emojiCoder.player.editor_mode') : t('emojiCoder.player.full_screen')" @click="$emit('toggle-preview')">
            <Minimize v-if="isPreview" :size="20" />
            <Maximize v-else :size="20" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '@/shared/stores/projectStore';
import { TurtleEngine } from '@/shared/engine/interpreter';
import { getLibrary } from '@/libraries';
import { getTutorialChallenges } from '@/tutorials';
import GridCanvas from '@/editor/components/canvas/GridCanvas.vue';

import { Play, Pause, StepForward, RotateCcw, Maximize, Minimize, Turtle as TurtleIcon, Rabbit, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, PartyPopper, Trophy, Lightbulb, Camera } from '@lucide/vue';
import iconStart from '@/assets/icons/start.svg';
import { exportToImage } from '@/shared/utils/exportImage';

const props = defineProps<{ isPreview?: boolean; isRuntime?: boolean }>();
defineEmits(['toggle-preview']);

const { t } = useI18n();
const projectStore = useProjectStore();

const isMobile = ref(window.innerWidth <= 768);
const isMissionCollapsed = ref(isMobile.value);

// Descobre qual código rodar sem precisar do Blockly!
const getActiveAST = () => {
  if (projectStore.isTutorialMode && projectStore.project.config.tutorialSavedASTs) {
    // Se tiver código salvo pro desafio atual, usa ele. Se não, usa o global como fallback.
    return projectStore.project.config.tutorialSavedASTs[projectStore.activeChallengeIndex] || projectStore.project.compiledAST;
  }
  return projectStore.project.compiledAST;
};

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

const showSuccess = ref(false);
const showTutorialComplete = ref(false);
const showTip = ref(false);

const activeChallengeList = computed(() => {
  if (!projectStore.isTutorialMode) return [];
  return getTutorialChallenges(projectStore.project.config.libraryId, t);
});

const totalChallenges = computed(() => activeChallengeList.value.length);

const currentChallenge = computed(() => {
  if (!projectStore.isTutorialMode) return null;
  return activeChallengeList.value[projectStore.activeChallengeIndex] || activeChallengeList.value[0];
});

const isLastChallenge = computed(() => {
  return projectStore.activeChallengeIndex >= totalChallenges.value - 1;
});

onMounted(() => {
  window.addEventListener('resize', handleResize);
  
  if (projectStore.isTutorialMode && currentChallenge.value) {
    const wasClean = !projectStore.hasUnsavedChanges;
    projectStore.loadChallenge(projectStore.activeChallengeIndex, currentChallenge.value);
    if (wasClean) projectStore.markAsSaved();
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const goToChallenge = (index: number) => {
  if (index === projectStore.activeChallengeIndex) return;
  if (index < 0 || index >= totalChallenges.value) return;

  const wasClean = !projectStore.hasUnsavedChanges;
  showSuccess.value = false;
  showTip.value = false;
  const targetChal = activeChallengeList.value[index];
  
  if (targetChal) {
    projectStore.loadChallenge(index, targetChal);
    engine.reset(targetChal.startPos.x, targetChal.startPos.y);
  }

  if (wasClean) projectStore.markAsSaved();
};

const handleNextChallenge = () => {
  showSuccess.value = false;
  if (!isLastChallenge.value) {
    goToChallenge(projectStore.activeChallengeIndex + 1);
    if (isMobile.value) isMissionCollapsed.value = true;
  } else {
    showTutorialComplete.value = true;
  }
};

// Consome a função blindada direto do App.vue (ou RuntimeApp.vue)
const goHome = inject<() => void>('goHomeAction', () => { 
  window.location.href = window.location.pathname; 
});

const executionSpeed = ref(3);
const currentSpeedMs = computed(() => [250, 150, 100, 40, 5][executionSpeed.value - 1] || 100);
const getSleepTime = () => currentSpeedMs.value;

const engine = new TurtleEngine(getSleepTime);

engine.onHighlight = (blockId) => {
  if (!props.isRuntime) projectStore.activeBlockId = blockId;
};

engine.onExecutionComplete = () => {
  if (projectStore.isTutorialMode && currentChallenge.value) {
    const passed = currentChallenge.value.validate(engine.state, getActiveAST());
    if (passed) showSuccess.value = true;
  }
};

watch(
  () => projectStore.project.compiledAST,
  () => {
    if (showSuccess.value) showSuccess.value = false;
    if (engine.state.status !== 'IDLE') {
      const c = projectStore.project.config;
      engine.reset(c.startX, c.startY, c.gridWidth, c.gridHeight);
    }
  },
  { deep: true }
);

const updateEngineHandlers = () => {
  const libraryId = projectStore.project.config.libraryId || 'turtle-grade-4';
  const activeLibrary = getLibrary(libraryId);
  engine.clearHandlers();
  activeLibrary.registerEngineHandlers(engine);
};

watch(
  () => projectStore.project.meta.id,
  () => {
    const c = projectStore.project.config;
    engine.reset(c.startX || 0, c.startY || 0, c.gridWidth, c.gridHeight);
    updateEngineHandlers();
    showSuccess.value = false;
    showTutorialComplete.value = false;
  }
);

// Registra os handlers pela primeira vez quando a tela carrega
updateEngineHandlers();

const handlePlay = () => {
  showSuccess.value = false;
  const c = projectStore.project.config;
  if (isMobile.value) isMissionCollapsed.value = true; 
  engine.play(getActiveAST(), c.gridWidth, c.gridHeight, c.startX, c.startY);
};

const handlePause = () => engine.pause();

const handleStep = () => {
  showSuccess.value = false;
  const c = projectStore.project.config;
  engine.step(getActiveAST(), c.gridWidth, c.gridHeight, c.startX, c.startY);
};

const handleReset = () => {
  showSuccess.value = false;
  const c = projectStore.project.config;
  engine.reset(c.startX, c.startY, c.gridWidth, c.gridHeight);
};

const handleExportImage = () => {
  const c = projectStore.project.config;
  const safeTitle = projectStore.project.title ? projectStore.project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : t('emojiCoder.player.default_drawing_name');
  const timestamp = Date.now(); 
  exportToImage(c.gridWidth, c.gridHeight, engine.state.paintedCells, `${safeTitle}-${timestamp}.png`);
};
</script>

<style scoped>
.execution-panel { display: flex; flex-direction: column; height: 100%; background: #fff; }
.execution-panel:not(.runtime-mode) { border-left: 1px solid #e5e7eb; }

/* === CARTÃO DE MISSÃO DO TUTORIAL === */
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

/* === PALCO === */
.canvas-container { flex: 1; display: flex; align-items: center; justify-content: center; background: #f3f4f6; padding: 1rem; overflow: hidden; min-height: 0; position: relative; }

/* === OVERLAY DE SUCESSO === */
.success-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 50; animation: fadeIn 0.3s ease; }
.success-card { background: white; padding: 2rem; border-radius: 16px; text-align: center; box-shadow: 0 10px 25px rgba(34, 197, 94, 0.2); border: 2px solid #22c55e; max-width: 80%; animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.success-card h2 { margin: 0 0 0.5rem 0; color: #16a34a; font-size: 1.8rem; }
.success-card p { color: #475569; margin-bottom: 1.5rem; line-height: 1.5; }
.next-challenge-btn { background: #22c55e; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: bold; font-size: 1rem; cursor: pointer; transition: all 0.2s; }
.next-challenge-btn:hover { background: #16a34a; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(34,197,94,0.3); }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

/* === MODAL FINAL DOURADO === */
.final-overlay { z-index: 60; background: rgba(255, 255, 255, 0.95); }
.final-card { border: 3px solid #eab308; box-shadow: 0 15px 35px rgba(234, 179, 8, 0.25); }
.final-card h2 { color: #eab308; font-size: 2rem; }
.btn-home { background: #eab308; margin-top: 1rem; }
.btn-home:hover { background: #ca8a04; box-shadow: 0 4px 12px rgba(234, 179, 8, 0.4); }

/* === O RODAPÉ === */
.control-board { display: flex; flex-direction: column; border-top: 1px solid #e5e7eb; }
.settings-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 1rem; background-color: #f8fafc; border-bottom: 1px solid #f1f5f9; }
.step-indicator { display: flex; align-items: center; gap: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.85rem; color: #64748b; }
.step-indicator.empty { opacity: 0.6; }
.step-indicator .label { text-transform: uppercase; font-size: 0.7rem; font-weight: bold; letter-spacing: 0.5px; }
.step-indicator .current { font-weight: 700; color: #2563eb; font-size: 0.95rem; }
.step-indicator .total { font-weight: 500; }
.speed-control { display: flex; align-items: center; gap: 0.5rem; }
.speed-icon { color: #9ca3af; }
input[type="range"] { max-width: 120px; cursor: pointer; accent-color: #3b82f6; }

.actions-row { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background-color: #ffffff; }
.action-group { display: flex; align-items: center; gap: 0.5rem; flex: 1; }
.action-group.center { justify-content: center; gap: 1rem; }
.action-group.right { justify-content: flex-end; }
.btn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; background: #f1f5f9; color: #475569; }
.btn:hover:not(:disabled) { background: #e2e8f0; color: #1e293b; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }

.play-btn, .pause-btn { width: 54px; height: 54px; border-radius: 50%; box-shadow: 0 4px 10px rgba(34, 197, 94, 0.3); }
.play-btn { background-color: #50A554; color: white; }
.play-btn:hover:not(:disabled) { background-color: #16a34a; transform: scale(1.05); }
.resume-btn { width: 54px; height: 54px; border-radius: 50%; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3); background-color: #3b82f6; color: white; padding-left: 4px; }
.resume-btn:hover:not(:disabled) { background-color: #2563eb; transform: scale(1.05); }
.pause-btn { background-color: #f59e0b; color: white; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3); }
.pause-btn:hover:not(:disabled) { background-color: #d97706; transform: scale(1.05); }
.svg-icon { width: 26px; height: 26px; }
.inline-icon { vertical-align: text-bottom; margin-right: 4px; }
.title-with-icon { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.save-tip { display: flex; align-items: flex-start; gap: 0.5rem; background-color: #fef9c3; color: #854d0e; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.9rem; text-align: left; margin-bottom: 1.5rem; line-height: 1.4; }
.inline-icon-top { flex-shrink: 0; margin-top: 2px; }

@media (max-width: 768px) {
  .settings-row { padding: 0.25rem 0.5rem; }
  .actions-row { padding: 0.5rem; }
  .btn { width: 36px; height: 36px; }
  .play-btn, .pause-btn { width: 44px; height: 44px; }
  .mission-title-inline { font-size: 0.85rem; max-width: 200px; }
  .mission-title { font-size: 1rem; }
  .mission-desc { font-size: 0.85rem; }
}
</style>