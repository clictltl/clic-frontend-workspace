<template>
  <div class="canvas-wrapper" ref="wrapperRef">
    <!-- Container Pai que agrupa a Grade + Réguas -->
    <div 
      class="board-wrapper" 
      :class="{ 'hide-labels': !showLabels }"
      :style="{ 
        '--cols': cols, 
        '--rows': rows,
        '--anim-duration': `${(speedMs || 250) * 0.8}ms`,
        ...fallbackStyles
      }"
    >
      <!-- Etiquetas de Coluna (Letras no Topo) -->
      <div class="col-labels">
        <span v-for="c in cols" :key="'col-' + c" class="label">{{ getColumnLetter(c - 1) }}</span>
      </div>

      <!-- Etiquetas de Linha (Números na Esquerda) -->
      <div class="row-labels">
        <span v-for="r in rows" :key="'row-' + r" class="label">{{ r }}</span>
      </div>

      <div class="grid-board">
        <!-- Células do fundo (O Tabuleiro) -->
        <div 
          v-for="i in (cols * rows)" 
          :key="i" 
          class="grid-cell"
          :style="{ backgroundColor: engine.state.paintedCells[getCellPos(i)] || store.project.config.targetCells?.[getCellPos(i)] }"
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useProjectStore } from '@/shared/stores/projectStore';
import type { TurtleEngine } from '@/shared/engine/interpreter';
import turtleSvg from '@/assets/turtle.svg';

const props = defineProps<{
  engine: TurtleEngine;
  speedMs?: number;
}>();

const store = useProjectStore();

const cols = computed(() => store.project.config.gridWidth);
const rows = computed(() => store.project.config.gridHeight);

// --- LÓGICA DE RESPONSIVIDADE POR DENSIDADE DA CÉLULA ---
const wrapperRef = ref<HTMLElement | null>(null);
const wrapperWidth = ref(0);
const wrapperHeight = ref(0);
let resizeObserver: ResizeObserver | null = null;
const needsFallback = ref(false);

onMounted(() => {
  // Detecção de compatibilidade com CSS Moderno (Para iPads velhos)
  const supportsModernCSS = typeof CSS !== 'undefined' && 
                            CSS.supports('container-type', 'size') && 
                            CSS.supports('aspect-ratio', '1/1');
  needsFallback.value = !supportsModernCSS;

  if (wrapperRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        wrapperWidth.value = entries[0].contentRect.width;
        wrapperHeight.value = entries[0].contentRect.height;
      }
    });
    resizeObserver.observe(wrapperRef.value);
  }
});

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect();
});

const showLabels = computed(() => {
  if (!wrapperWidth.value || !wrapperHeight.value) return true;
  
  const lblSpace = 36; // 2.25rem em pixels
  // Simulando a fórmula do CSS: descobre o tamanho que sobrará para 1 célula
  const cellSizeByWidth = (wrapperWidth.value - lblSpace) / cols.value;
  const cellSizeByHeight = (wrapperHeight.value - lblSpace) / rows.value;
  const realCellSize = Math.min(cellSizeByWidth, cellSizeByHeight);
  
  // Só mostra as legendas se a célula tiver 24px ou mais!
  return realCellSize >= 24; 
});

// A Rede de Segurança: Calcula os pixels exatos apenas se o CSS falhar
const fallbackStyles = computed(() => {
  if (!needsFallback.value || !wrapperWidth.value || !wrapperHeight.value) return {};

  const lblSpace = showLabels.value ? 36 : 0; // 36px equivale a 2.25rem
  const availableWidth = wrapperWidth.value - lblSpace;
  const availableHeight = wrapperHeight.value - lblSpace;
  const ratio = cols.value / rows.value;

  let finalWidth, finalHeight;
  if (availableWidth / ratio <= availableHeight) {
    finalWidth = availableWidth;
    finalHeight = availableWidth / ratio;
  } else {
    finalHeight = availableHeight;
    finalWidth = availableHeight * ratio;
  }

  return {
    width: `${finalWidth}px`,
    height: `${finalHeight}px`
  };
});
// --- FIM DA LÓGICA DE DENSIDADE ---

// Descobre a coordenada X e Y da célula no grid bidimensional
const getCellPos = (index: number) => {
  const x = (index - 1) % cols.value;
  const y = Math.floor((index - 1) / cols.value);
  return `${x},${y}`;
};

// Função auxiliar: Converte índice de coluna em letra (0=A, 1=B, ..., 26=AA)
const getColumnLetter = (index: number) => {
  let letter = '';
  let temp = index;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
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

/* Container que agrupa a grade e as réguas de coordenadas */
.board-wrapper {
  position: relative;
  
  /* Reserva espaço (aprox 36px) para os rótulos não cortarem na tela */
  --lbl-space: 2.25rem;
  
  /* A Fórmula ajustada (- var(--lbl-space)): */
  width: min(calc(100cqw - var(--lbl-space)), calc((100cqh - var(--lbl-space)) * var(--cols) / var(--rows)));
  aspect-ratio: var(--cols) / var(--rows);
  
  /* Centraliza visualmente compensando as réguas da esquerda e do topo */
  margin-top: calc(var(--lbl-space) / 2);
  margin-left: calc(var(--lbl-space) / 2);
  
  /* Suavidade: Anima o recálculo de largura e margens */
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              margin-top 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* O Tabuleiro */
.grid-board {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: repeat(var(--rows), 1fr);
  
  background-color: #ffffff;
  border: 4px solid #334155;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

/* --- ESTILOS DAS RÉGUAS DE COORDENADAS --- */
.col-labels {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 100%;
  height: var(--lbl-space);
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  transition: opacity 0.2s ease, height 0.3s ease;
}

.row-labels {
  position: absolute;
  right: 100%;
  top: 0;
  height: 100%;
  width: var(--lbl-space);
  display: grid;
  grid-template-rows: repeat(var(--rows), 1fr);
  transition: opacity 0.2s ease, width 0.3s ease;
}

.label {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem;
  user-select: none;
}

/* --- RESPONSIVIDADE CONTEXTUAL (VIA DENSIDADE JS) --- */
.board-wrapper.hide-labels {
  --lbl-space: 0px;
  margin-top: 0;
  margin-left: 0;
}

/* Fantasminhas: as réguas ficam transparentes e não clicáveis */
.board-wrapper.hide-labels .col-labels,
.board-wrapper.hide-labels .row-labels {
  opacity: 0;
  pointer-events: none;
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
  
  /* Transição suave Sincronizada com o Motor via GPU */
  transition: transform var(--anim-duration, 0.2s) cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

.actor-icon {
  width: 70%; /* Ocupa 70% da célula para não encostar nas bordas */
  height: 70%;
  color: #10b981; /* Emerald-500 (Verde estilo tartaruga) */
  stroke-width: 2.5px;
}
</style>