<template>
  <div class="execution-panel">
    <!-- O Palco (FUTURO: GridCanvas.vue) -->
    <div class="canvas-container">
      <div class="grid-stub">
        <p>🐢 Mundo {{ projectStore.project.config.gridWidth }}x{{ projectStore.project.config.gridHeight }}</p>
      </div>
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
import { useProjectStore } from '@/shared/stores/projectStore';
const projectStore = useProjectStore();

// [PREPARAÇÃO PARA TELEMETRIA / PESQUISA TLTL]
// Wrappers que logarão a intenção do aluno antes de disparar a ação de fato.
const handlePlay = () => {
  // log.push({ action: 'EXECUTION_PLAY', time: Date.now() })
  console.log('Motor: Executar o código');
};

const handleStep = () => {
  // log.push({ action: 'EXECUTION_STEP' })
  console.log('Motor: Executar apenas um bloco');
};

const handleStop = () => {
  // log.push({ action: 'EXECUTION_STOP' })
  console.log('Motor: Parar e resetar tartaruga');
};

const handleSpeedChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  // log.push({ action: 'SPEED_CHANGE', value: target.value })
  console.log('Motor: Velocidade alterada para', target.value);
};
</script>

<style scoped>
.execution-panel { display: flex; flex-direction: column; height: 100%; background: #fff; border-left: 1px solid #e5e7eb; }
.canvas-container { flex: 1; display: flex; align-items: center; justify-content: center; background: #f3f4f6; padding: 1rem; overflow: hidden; }
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