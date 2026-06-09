<template>
  <div class="execution-panel">
    <div class="canvas-container">
      <!-- Passamos a instância da Engine pro Canvas saber onde a tartaruga está! -->
      <GridCanvas :engine="engine" />
    </div>

    <!-- Controles de Execução -->
    <div class="controls-container">
      <div class="buttons">
        <button class="btn play" @click="handlePlay">▶ Play</button>
        <button class="btn step" @click="handleStep">⏭ Passo</button>
        <button class="btn stop" @click="handleStop">⏹ Parar</button>
      </div>
      
      <div class="speed-control">
        <label>Velocidade:</label>
        <input type="range" min="1" max="5" value="3" @change="handleSpeedChange" />
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

const { t } = useI18n();
const projectStore = useProjectStore();

// Controle de velocidade gerido pela UI
const executionSpeed = ref(3);
const getSleepTime = () => [1500, 1000, 500, 250, 100][executionSpeed.value - 1] || 500;

// Instanciamos o Motor passando apenas a forma de ler a velocidade atual
const engine = new TurtleEngine(getSleepTime);

const libraryId = projectStore.project.config.libraryId || 'turtle-grade-4';
const activeLibrary = loadLibrary(libraryId, t as any);
activeLibrary.registerEngineHandlers(engine);

const handlePlay = async () => {
  if (engine.state.isRunning) return;
  
  // Entrega a AST e o tamanho atual do mundo (lido da Store JSON) para o motor
  engine.run(
    projectStore.project.compiledAST, 
    projectStore.project.config.gridWidth, 
    projectStore.project.config.gridHeight
  );
};

const handleStep = () => {
  handlePlay();
};

const handleStop = () => {
  engine.stop();
};

const handleSpeedChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  executionSpeed.value = parseInt(target.value, 10);
};
</script>

<style scoped>
.execution-panel { display: flex; flex-direction: column; height: 100%; background: #fff; border-left: 1px solid #e5e7eb; }
.canvas-container { flex: 1; display: flex; align-items: center; justify-content: center; background: #f3f4f6; padding: 1rem; overflow: hidden; min-height: 0; }
.grid-stub { width: 100%; height: 100%; max-width: 400px; max-height: 400px; background: white; border: 2px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-weight: bold; color: #64748b; font-size: 1.2rem; }
.controls-container { padding: 1rem; border-top: 1px solid #e5e7eb; display: flex; flex-direction: column; gap: 1rem; background: white; }
.buttons { display: flex; gap: 0.5rem; justify-content: center; }
.btn { padding: 0.5rem 1rem; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; color: white; transition: opacity 0.2s; }
.btn:hover { opacity: 0.9; }
.btn.play { background-color: #22c55e; }
.btn.step { background-color: #3b82f6; }
.btn.stop { background-color: #ef4444; }
.speed-control { display: flex; align-items: center; gap: 0.5rem; justify-content: center; font-size: 0.9rem; color: #4b5563; }
</style>