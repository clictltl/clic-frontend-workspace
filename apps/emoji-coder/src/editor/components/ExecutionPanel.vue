<template>
  <div class="execution-panel">
    
    <!-- MISSÃO DO TUTORIAL (Sanfona Inteligente) -->
    <div 
      v-if="projectStore.isTutorialMode && currentChallenge" 
      class="tutorial-mission-card"
      :class="{ 'collapsed': isMissionCollapsed }"
    >
      <!-- HEADER (Clicável no celular) -->
      <div class="mission-header" @click="toggleMission" :style="isMobile ? 'cursor: pointer' : ''">
        <div class="mission-header-left">
          <span class="mission-progress">Desafio {{ projectStore.activeChallengeIndex + 1 }}</span>
          <!-- Mostra o título na mesma linha se estiver colapsado (Mobile) -->
          <span class="mission-title-inline" v-show="isMissionCollapsed">{{ currentChallenge.title }}</span>
        </div>

        <div class="mission-dots" v-show="!isMissionCollapsed">
          <span 
            v-for="(_, i) in totalChallenges" 
            :key="i" 
            class="dot" 
            :class="{ active: i === projectStore.activeChallengeIndex, done: i < projectStore.activeChallengeIndex }"
            @click.stop="goToChallenge(i)"
            title="Ir para este desafio"
          ></span>
        </div>

        <!-- Botão de sanfona (Apenas Mobile) -->
        <button class="toggle-btn" v-show="isMobile">
          <ChevronDown v-if="isMissionCollapsed" :size="20"/>
          <ChevronUp v-else :size="20"/>
        </button>
      </div>

      <!-- CORPO (Escondido no celular quando colapsado) -->
      <div class="mission-body" v-show="!isMissionCollapsed">
        <h3 class="mission-title">{{ currentChallenge.title }}</h3>
        <p class="mission-desc">{{ currentChallenge.description }}</p>
        <div class="mission-tip" v-if="currentChallenge.tip">
          <strong><Lightbulb :size="16" class="inline-icon" /> Dica:</strong> {{ currentChallenge.tip }}
        </div>
      </div>
    </div>

    <!-- O Palco Principal -->
    <div class="canvas-container">
      <GridCanvas :engine="engine" :speed-ms="currentSpeedMs" />
      
      <!-- OVERLAY DE SUCESSO DO TUTORIAL -->
      <div v-if="showSuccess" class="success-overlay">
        <div class="success-card">
          <h2 class="title-with-icon"><PartyPopper :size="28" /> Sucesso!</h2>
          <p>{{ currentChallenge?.successMsg }}</p>
          <button class="next-challenge-btn" @click="handleNextChallenge">
            {{ isLastChallenge ? 'Finalizar Tutorial' : 'Próximo Desafio →' }}
          </button>
        </div>
      </div>

      <!-- OVERLAY DE CONCLUSÃO DO TUTORIAL -->
      <div v-if="showTutorialComplete" class="success-overlay final-overlay">
        <div class="success-card final-card">
          <h2 class="title-with-icon"><Trophy :size="32" /> Tutorial Concluído!</h2>
          <p>Você completou todos os desafios com excelência. Você já é um(a) mestre da Tartaruga e está pronto(a) para criar seus próprios projetos livres!</p>
          
          <!-- Dica pedagógica de salvamento -->
          <div class="save-tip">
            <Lightbulb :size="18" class="inline-icon-top" /> 
            <span>Lembre-se de usar o menu <strong>Arquivo &gt; Salvar</strong> para guardar suas soluções antes de sair!</span>
          </div>

          <button class="next-challenge-btn btn-home" @click="goHome">
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>

    <!-- O Painel de Controle (Dividido em 2 Linhas) -->
    <div class="control-board">
      <div class="settings-row">
        <div class="step-indicator" v-if="engine.state.totalSteps > 0">
          <span class="label">Passo</span>
          <span class="current">{{ engine.state.currentStep }}</span>
          <span class="divider">/</span>
          <span class="total">{{ engine.state.totalSteps }}</span>
        </div>
        <div class="step-indicator empty" v-else>
          <span class="label">Aguardando código...</span>
        </div>

        <div class="speed-control">
          <TurtleIcon :size="16" class="speed-icon"/>
          <input type="range" min="1" max="5" v-model="executionSpeed" title="Velocidade" />
          <Rabbit :size="16" class="speed-icon"/>
        </div>
      </div>

      <div class="actions-row">
        <div class="action-group left">
          <button class="btn icon-btn reset-btn" title="Reiniciar Mundo" @click="handleReset" :disabled="showSuccess">
            <RotateCcw :size="20" />
          </button>
        </div>

        <div class="action-group center">
          <!-- 1. Estado Parado (Início) -->
          <button class="btn icon-btn play-btn" v-if="engine.state.status === 'IDLE'" title="Executar Código" @click="handlePlay" :disabled="showSuccess">
            <img :src="iconStart" alt="Start" class="svg-icon" />
          </button>
          
          <!-- 2. Estado Pausado (Continuar) -->
          <button class="btn icon-btn resume-btn" v-else-if="engine.state.status === 'PAUSED'" title="Continuar Execução" @click="handlePlay" :disabled="showSuccess">
            <Play :size="26" />
          </button>

          <!-- 3. Estado Rodando (Pausar) -->
          <button class="btn icon-btn pause-btn" v-else title="Pausar" @click="handlePause" :disabled="showSuccess">
            <Pause :size="26" />
          </button>

          <button class="btn icon-btn step-btn" title="Passo a Passo" @click="handleStep" :disabled="engine.state.status === 'RUNNING' || showSuccess">
            <StepForward :size="20" />
          </button>
        </div>

        <div class="action-group right">
          <button class="btn icon-btn expand-btn" :title="isPreview ? 'Modo Editor' : 'Tela Cheia'" @click="$emit('toggle-preview')">
            <Minimize v-if="isPreview" :size="20" />
            <Maximize v-else :size="20" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '@/shared/stores/projectStore';
import { TurtleEngine } from '@/shared/engine/interpreter';
import { loadLibrary } from '@/libraries';
import { getTutorialChallenges } from '@/tutorials';
import GridCanvas from './canvas/GridCanvas.vue';
import { Play, Pause, StepForward, RotateCcw, Maximize, Minimize, Turtle as TurtleIcon, Rabbit, ChevronDown, ChevronUp, PartyPopper, Trophy, Lightbulb } from '@lucide/vue';
import iconStart from '@/assets/icons/start.svg';

defineProps<{ isPreview?: boolean }>();
defineEmits(['toggle-preview']);

const { t } = useI18n();
const projectStore = useProjectStore();

// --- LÓGICA DE RESPONSIVIDADE (MOBILE) ---
const isMobile = ref(window.innerWidth <= 768);
const isMissionCollapsed = ref(isMobile.value);

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
  if (!isMobile.value) {
    isMissionCollapsed.value = false; // No Desktop, sempre expandido
  }
};

const toggleMission = () => {
  if (isMobile.value) {
    isMissionCollapsed.value = !isMissionCollapsed.value;
  }
};
// ----------------------------------------

// --- LÓGICA DE TUTORIAL ---
const showSuccess = ref(false);
const showTutorialComplete = ref(false);

const activeChallengeList = computed(() => {
  if (!projectStore.isTutorialMode) return [];
  return getTutorialChallenges(projectStore.project.config.libraryId);
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
    projectStore.loadChallenge(projectStore.activeChallengeIndex, currentChallenge.value);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const goToChallenge = (index: number) => {
  if (index === projectStore.activeChallengeIndex) return; // Ignora se for o atual
  if (index < 0 || index >= totalChallenges.value) return;

  showSuccess.value = false;
  const targetChal = activeChallengeList.value[index];
  
  if (targetChal) {
    projectStore.loadChallenge(index, targetChal);
    engine.reset(targetChal.startPos.x, targetChal.startPos.y);
  }
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

const goHome = () => {
  // O recarregamento limpo da rota volta diretamente para o Dashboard inicial
  window.location.href = window.location.pathname;
};
// --------------------------

const executionSpeed = ref(3);
const currentSpeedMs = computed(() => [800, 500, 250, 100, 30][executionSpeed.value - 1] || 250);
const getSleepTime = () => currentSpeedMs.value;

const engine = new TurtleEngine(getSleepTime);

engine.onHighlight = (blockId) => {
  projectStore.activeBlockId = blockId;
};

// VALIDAÇÃO
engine.onExecutionComplete = () => {
  if (projectStore.isTutorialMode && currentChallenge.value) {
    const passed = currentChallenge.value.validate(engine.state);
    if (passed) {
      showSuccess.value = true;
    }
  }
};

// --- RESET AUTOMÁTICO AO EDITAR O CÓDIGO ---
watch(
  () => projectStore.project.compiledAST,
  () => {
    // 1. Esconde a tela de sucesso se o aluno mexer nos blocos depois de ganhar
    if (showSuccess.value) {
      showSuccess.value = false;
    }
    
    // 2. Se o motor estava rodando ou pausado (Step), reseta imediatamente
    if (engine.state.status !== 'IDLE') {
      const c = projectStore.project.config;
      engine.reset(c.startX, c.startY);
    }
  },
  { deep: true }
);

const libraryId = projectStore.project.config.libraryId || 'turtle-grade-4';
const activeLibrary = loadLibrary(libraryId, t as any);
activeLibrary.registerEngineHandlers(engine);

const handlePlay = () => {
  showSuccess.value = false;
  const c = projectStore.project.config;
  // Se estiver no celular, minimiza o card ao rodar o código para a criança focar no grid
  if (isMobile.value) isMissionCollapsed.value = true; 
  engine.play(projectStore.project.compiledAST, c.gridWidth, c.gridHeight, c.startX, c.startY);
};

const handlePause = () => engine.pause();

const handleStep = () => {
  showSuccess.value = false;
  const c = projectStore.project.config;
  engine.step(projectStore.project.compiledAST, c.gridWidth, c.gridHeight, c.startX, c.startY);
};

const handleReset = () => {
  showSuccess.value = false;
  const c = projectStore.project.config;
  engine.reset(c.startX, c.startY);
};
</script>

<style scoped>
.execution-panel { display: flex; flex-direction: column; height: 100%; background: #fff; border-left: 1px solid #e5e7eb; }

/* === CARTÃO DE MISSÃO DO TUTORIAL === */
.tutorial-mission-card {
  padding: 1rem 1.25rem;
  background-color: #f0fdf4;
  border-bottom: 1px solid #bbf7d0;
  flex-shrink: 0;
  transition: padding 0.2s ease;
}
.tutorial-mission-card.collapsed {
  padding: 0.6rem 1rem;
}

.mission-header { display: flex; justify-content: space-between; align-items: center; user-select: none; }
.tutorial-mission-card:not(.collapsed) .mission-header { margin-bottom: 0.5rem; }

.mission-header-left { display: flex; align-items: center; gap: 0.5rem; }
.mission-progress { font-size: 0.75rem; font-weight: 700; color: #16a34a; text-transform: uppercase; letter-spacing: 0.05em; }
.mission-title-inline { font-size: 0.9rem; font-weight: 600; color: #14532d; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }

.toggle-btn { background: none; border: none; color: #16a34a; display: flex; align-items: center; padding: 0; }

.mission-dots { display: flex; gap: 4px; }
.mission-dots .dot { 
  width: 8px; height: 8px; border-radius: 50%; 
  background-color: #dcfce7; 
  cursor: pointer; 
  transition: transform 0.2s ease, background-color 0.2s; 
}
.mission-dots .dot:hover { transform: scale(1.4); }
.mission-dots .dot.done { background-color: #22c55e; }
.mission-dots .dot.active { background-color: #16a34a; transform: scale(1.2); }
.mission-title { margin: 0 0 0.25rem 0; font-size: 1.1rem; color: #14532d; }
.mission-desc { margin: 0; font-size: 0.9rem; color: #166534; line-height: 1.4; }
.mission-tip { margin-top: 0.75rem; padding: 0.5rem; background-color: #dcfce7; border-radius: 6px; font-size: 0.85rem; color: #15803d; border-left: 3px solid #22c55e; }

/* === PALCO === */
.canvas-container { flex: 1; display: flex; align-items: center; justify-content: center; background: #f3f4f6; padding: 1rem; overflow: hidden; min-height: 0; position: relative; }

/* === OVERLAY DE SUCESSO === */
.success-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 50;
  animation: fadeIn 0.3s ease;
}
.success-card {
  background: white; padding: 2rem; border-radius: 16px; text-align: center;
  box-shadow: 0 10px 25px rgba(34, 197, 94, 0.2);
  border: 2px solid #22c55e;
  max-width: 80%;
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.success-card h2 { margin: 0 0 0.5rem 0; color: #16a34a; font-size: 1.8rem; }
.success-card p { color: #475569; margin-bottom: 1.5rem; line-height: 1.5; }
.next-challenge-btn {
  background: #22c55e; color: white; border: none; padding: 0.75rem 1.5rem;
  border-radius: 8px; font-weight: bold; font-size: 1rem; cursor: pointer; transition: all 0.2s;
}
.next-challenge-btn:hover { background: #16a34a; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(34,197,94,0.3); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

/* === MODAL FINAL DOURADO === */
.final-overlay {
  z-index: 60; /* Fica acima de tudo */
  background: rgba(255, 255, 255, 0.95);
}
.final-card {
  border: 3px solid #eab308; /* Amarelo/Dourado */
  box-shadow: 0 15px 35px rgba(234, 179, 8, 0.25);
}
.final-card h2 {
  color: #eab308;
  font-size: 2rem;
}
.btn-home {
  background: #eab308;
  margin-top: 1rem;
}
.btn-home:hover {
  background: #ca8a04;
  box-shadow: 0 4px 12px rgba(234, 179, 8, 0.4);
}

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
.play-btn { background-color: #22c55e; color: white; }
.play-btn:hover:not(:disabled) { background-color: #16a34a; transform: scale(1.05); }
.resume-btn { width: 54px; height: 54px; border-radius: 50%; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3); background-color: #3b82f6; color: white; padding-left: 4px; /* Ajuste óptico da seta */ }
.resume-btn:hover:not(:disabled) { background-color: #2563eb; transform: scale(1.05); }
.pause-btn { background-color: #f59e0b; color: white; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3); }
.pause-btn:hover:not(:disabled) { background-color: #d97706; transform: scale(1.05); }
.svg-icon { width: 26px; height: 26px; }

/* === ÍCONES LUCIDE === */
.inline-icon {
  vertical-align: text-bottom;
  margin-right: 4px;
}
.title-with-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* === ALERTA DE SALVAMENTO === */
.save-tip {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background-color: #fef9c3; /* Fundo amarelo claro */
  color: #854d0e; /* Texto amarelo escuro/marrom */
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: left;
  margin-bottom: 1.5rem;
  line-height: 1.4;
}
.inline-icon-top {
  flex-shrink: 0;
  margin-top: 2px;
}

/* === OTIMIZAÇÃO MOBILE (CSS Media Queries) === */
@media (max-width: 768px) {
  .settings-row { padding: 0.25rem 0.5rem; }
  .actions-row { padding: 0.5rem; }
  
  /* Reduz os botões do rodapé para salvar espaço vertical */
  .btn { width: 36px; height: 36px; }
  .play-btn, .pause-btn { width: 44px; height: 44px; }
  
  /* Minimiza a barra do tutorial */
  .mission-title-inline { font-size: 0.85rem; max-width: 200px; }
  .mission-title { font-size: 1rem; }
  .mission-desc { font-size: 0.85rem; }
}
</style>