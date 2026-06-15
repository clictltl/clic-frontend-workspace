<template>
  <div class="execution-panel">
    <!-- O Palco Principal -->
    <div class="canvas-container">
      <GridCanvas :engine="engine" />
    </div>

    <!-- O Painel de Controle (Dividido em 2 Linhas) -->
    <div class="control-board">
      
      <!-- Linha 1: Status e Configurações (Fundo Cinza) -->
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

      <!-- Linha 2: Ações Principais (Fundo Branco) -->
      <div class="actions-row">
        <!-- Esquerda -->
        <div class="action-group left">
          <button class="btn icon-btn reset-btn" title="Reiniciar Mundo" @click="handleReset">
            <RotateCcw :size="20" />
          </button>
        </div>

        <!-- Centro (Os Controles de Jogo) -->
        <div class="action-group center">
          <button class="btn icon-btn play-btn" v-if="engine.state.status !== 'RUNNING'" title="Executar" @click="handlePlay">
            <img :src="iconStart" alt="Play" class="svg-icon" />
          </button>
          <button class="btn icon-btn pause-btn" v-else title="Pausar" @click="handlePause">
            <Pause :size="24" />
          </button>

          <button class="btn icon-btn step-btn" title="Passo a Passo" @click="handleStep" :disabled="engine.state.status === 'RUNNING'">
            <StepForward :size="20" />
          </button>
        </div>

        <!-- Direita -->
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
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProjectStore } from '@/shared/stores/projectStore';
import { TurtleEngine } from '@/shared/engine/interpreter';
import { loadLibrary } from '@/libraries';
import GridCanvas from './canvas/GridCanvas.vue';
import { Pause, StepForward, RotateCcw, Maximize, Minimize, Turtle as TurtleIcon, Rabbit } from '@lucide/vue';
import iconStart from '@/assets/icons/start.svg';

defineProps<{ isPreview?: boolean }>();
defineEmits(['toggle-preview']);

const { t } = useI18n();
const projectStore = useProjectStore();

const executionSpeed = ref(3);
const getSleepTime = () => [1500, 1000, 500, 250, 100][executionSpeed.value - 1] || 500;

const engine = new TurtleEngine(getSleepTime);

// O Painel faz a ponte: Ouve o motor e salva no Pinia para o Blockly ler
engine.onHighlight = (blockId) => {
  projectStore.activeBlockId = blockId;
};

const libraryId = projectStore.project.config.libraryId || 'turtle-grade-4';
const activeLibrary = loadLibrary(libraryId, t as any);
activeLibrary.registerEngineHandlers(engine);

const handlePlay = () => {
  engine.play(
    projectStore.project.compiledAST, 
    projectStore.project.config.gridWidth, 
    projectStore.project.config.gridHeight
  );
};

const handlePause = () => engine.pause();

const handleStep = () => {
  engine.step(
    projectStore.project.compiledAST, 
    projectStore.project.config.gridWidth, 
    projectStore.project.config.gridHeight
  );
};

const handleReset = () => engine.reset();
</script>

<style scoped>
.execution-panel { display: flex; flex-direction: column; height: 100%; background: #fff; border-left: 1px solid #e5e7eb; }
.canvas-container { flex: 1; display: flex; align-items: center; justify-content: center; background: #f3f4f6; padding: 1rem; overflow: hidden; min-height: 0; }

/* O Container do Rodapé inteiro */
.control-board {
  display: flex;
  flex-direction: column;
  border-top: 1px solid #e5e7eb;
}

/* === LINHA 1: STATUS & CONFIG === */
.settings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.step-indicator {
  display: flex; align-items: center; gap: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem; color: #64748b;
}
.step-indicator.empty { opacity: 0.6; }
.step-indicator .label { text-transform: uppercase; font-size: 0.7rem; font-weight: bold; letter-spacing: 0.5px; }
.step-indicator .current { font-weight: 700; color: #2563eb; font-size: 0.95rem; }
.step-indicator .total { font-weight: 500; }

.speed-control { display: flex; align-items: center; gap: 0.5rem; }
.speed-icon { color: #9ca3af; }
input[type="range"] { max-width: 120px; cursor: pointer; accent-color: #3b82f6; }

/* === LINHA 2: AÇÕES === */
.actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #ffffff;
}

.action-group { display: flex; align-items: center; gap: 0.5rem; flex: 1; }
.action-group.center { justify-content: center; gap: 1rem; }
.action-group.right { justify-content: flex-end; }

/* Botões Genéricos */
.btn {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border: none; border-radius: 8px;
  cursor: pointer; transition: all 0.2s ease; background: #f1f5f9; color: #475569;
}
.btn:hover:not(:disabled) { background: #e2e8f0; color: #1e293b; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Destaque para o Play/Pause (Estilo Videogame) */
.play-btn, .pause-btn {
  width: 54px; height: 54px; border-radius: 50%; /* Bolota gigante no centro */
  box-shadow: 0 4px 10px rgba(34, 197, 94, 0.3);
}
.play-btn { background-color: #22c55e; color: white; }
.play-btn:hover:not(:disabled) { background-color: #16a34a; transform: scale(1.05); }

.pause-btn { background-color: #f59e0b; color: white; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3); }
.pause-btn:hover:not(:disabled) { background-color: #d97706; transform: scale(1.05); }

.svg-icon { width: 26px; height: 26px; }
</style>