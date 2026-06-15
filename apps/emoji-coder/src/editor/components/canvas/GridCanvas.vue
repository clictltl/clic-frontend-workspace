<template>
  <div class="canvas-wrapper">
    <div 
      class="grid-board" 
      :style="{ 
        '--cols': cols, 
        '--rows': rows 
      }"
    >
      <!-- Células do fundo (O Tabuleiro) -->
      <div 
        v-for="i in (cols * rows)" 
        :key="i" 
        class="grid-cell"
        :style="{ backgroundColor: engine.state.paintedCells[getCellPos(i)] }"
      ></div>
      
      <!-- O Ator (Nossa Tartaruga em SVG nativo) -->
      <div 
        class="actor" 
        :style="{ 
          transform: `translate(calc(${engine.state.turtleX} * 100%), calc(${engine.state.turtleY} * 100%)) rotate(${engine.state.turtleRotation}deg)` 
        }"
      >
        <img :src="turtleSvg" class="actor-icon" alt="Tartaruga" draggable="false" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useProjectStore } from '@/shared/stores/projectStore';
import type { TurtleEngine } from '@/shared/engine/interpreter';
import turtleSvg from '@/assets/turtle.svg';

const props = defineProps<{
  engine: TurtleEngine;
}>();

const store = useProjectStore();

const cols = computed(() => store.project.config.gridWidth);
const rows = computed(() => store.project.config.gridHeight);

// Descobre a coordenada X e Y da célula no grid bidimensional
const getCellPos = (index: number) => {
  const x = (index - 1) % cols.value;
  const y = Math.floor((index - 1) / cols.value);
  return `${x},${y}`;
};
</script>

<style scoped>
.canvas-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;
  
  /* 1. Transforma o container em um 'Sensor de Tamanho Físico' */
  container-type: size;
}

/* O Tabuleiro */
.grid-board {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: repeat(var(--rows), 1fr);
  
  /* 2. A Fórmula Perfeita de Resolução:
     Pega o MENOR valor entre a largura total disponível (100cqw) 
     e a altura total (100cqh) ajustada para a proporção da grade. */
  width: min(100cqw, calc(100cqh * var(--cols) / var(--rows)));
  aspect-ratio: var(--cols) / var(--rows);
  
  background-color: #ffffff;
  border: 4px solid #334155;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

/* As Células */
.grid-cell {
  border: 1px solid #e2e8f0;
  box-sizing: border-box;
  background-color: transparent;
  transition: background-color 0.3s ease; /* Animação suave ao pintar */
}

/* Linhas zebradas para facilitar a contagem visual das crianças */
/* O estilo inline dinâmico (background-color) do Vue sempre terá prioridade sobre isso! */
.grid-cell:nth-child(even) {
  background-color: #f8fafc;
}

/* O Ator */
.actor {
  position: absolute;
  top: 0;
  left: 0;
  
  /* O tamanho do ator é exatamente o tamanho de uma célula (1 fração) */
  width: calc(100% / var(--cols));
  height: calc(100% / var(--rows));
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* Transição suave usando GPU-Acceleration */
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

.actor-icon {
  width: 70%; /* Ocupa 70% da célula para não encostar nas bordas */
  height: 70%;
  color: #10b981; /* Emerald-500 (Verde estilo tartaruga) */
  stroke-width: 2.5px;
}
</style>