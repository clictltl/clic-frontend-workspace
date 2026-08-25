<template>
  <div class="replay-app">
    
    <!-- MODO 1: DASHBOARD DE BUSCA -->
    <div v-if="viewMode === 'dashboard'" class="replay-dashboard">
      <header class="dashboard-header">
        <h2>CLIC Session Replay <span>(Emoji Coder)</span></h2>
      </header>

      <main class="dashboard-content">
        <section class="search-panel">
          <div class="form-group">
            <label>Data Inicial:</label>
            <input type="date" v-model="startDate" />
          </div>
          <div class="form-group">
            <label>Data Final:</label>
            <input type="date" v-model="endDate" />
          </div>
          <button class="btn-search" @click="fetchSessions" :disabled="loading">
            {{ loading ? 'Buscando...' : 'Buscar Sessões' }}
          </button>
        </section>

        <div v-if="limitReached" class="alert-warning">
          Muitos resultados encontrados. Apenas as últimas 250 sessões estão sendo exibidas.
        </div>
        <div v-if="error" class="alert-error">{{ error }}</div>

        <section class="results-panel">
          <table v-if="sessions.length > 0" class="sessions-table">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Sessão</th>
                <th>Eventos</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="session in sessions" :key="session.session_id">
                <td><strong>{{ session.student_name }}</strong></td>
                <td>{{ new Date(session.session_start).toLocaleString() }}</td>
                <td>{{ session.event_count }}</td>
                <td>
                  <button class="btn-play" @click="openTimeline(session.session_id)">Replay</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else-if="!loading && hasSearched" class="empty-state">Nenhuma sessão encontrada.</div>
        </section>
      </main>
    </div>

    <!-- MODO 2: O REPRODUTOR (MÁQUINA DO TEMPO) -->
    <div v-else class="replay-player">
      
      <!-- CABEÇALHO DO REPRODUTOR -->
      <header class="player-header">
        <button class="btn-back" @click="closePlayer">← Voltar</button>
        <div class="player-controls">
          <button class="btn-control play-btn" @click="engine.play()" v-if="!engine.isPlaying.value">▶ Play</button>
          <button class="btn-control pause-btn" @click="engine.pause()" v-else>⏸ Pause</button>
          
          <div class="scrubber">
            <span class="time-label">{{ formatTime(engine.currentTime.value) }}</span>
            <input type="range" :max="engine.duration.value" v-model="engine.currentTime.value" disabled />
            <span class="time-label">{{ formatTime(engine.duration.value) }}</span>
          </div>

          <select v-model="engine.playbackSpeed.value" class="speed-select">
            <option :value="1">1x Velocidade</option>
            <option :value="2">2x Velocidade</option>
            <option :value="4">4x Velocidade</option>
            <option :value="8">8x Velocidade</option>
          </select>
        </div>
      </header>

      <!-- CORPO DO REPRODUTOR (SPLIT VIEW) -->
      <div class="player-body">
        
        <!-- Esquerda: O Palco do Fantasma -->
        <main class="player-stage">
          <div class="blockly-wrapper">
            <div ref="blocklyDiv" class="blockly-container"></div>
          </div>
          <div class="canvas-wrapper">
            <GridCanvas :engine="turtleEngine" :speed-ms="currentSpeedMs" />
          </div>
        </main>

        <!-- Direita: O Log da Sessão (Event Feed) -->
        <aside class="player-feed">
          <div class="feed-header">
            <h3>Linha do Tempo</h3>
            <span class="badge">{{ eventFeed.length }} eventos passados</span>
          </div>
          <ul class="feed-list" ref="feedListEl">
            <li v-for="(ev, idx) in eventFeed" :key="idx" class="feed-item" :class="getEventFormat(ev).class">
              
              <div class="feed-main">
                <span class="feed-time">[{{ formatTime(ev._relativeTime) }}]</span>
                <span class="feed-icon" :title="ev.event_type">
                  <component :is="getEventFormat(ev).icon" :size="16" />
                </span>
                <strong class="feed-action">{{ ev.action_name }}</strong>
              </div>
              
              <!-- Exibição de Informações Extras e Payload Raw -->
              <div class="feed-details" v-if="getEventFormat(ev).details">
                {{ getEventFormat(ev).details }}
              </div>

            </li>
            <li v-if="eventFeed.length === 0" class="feed-empty">Aguardando início...</li>
          </ul>
        </aside>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onUnmounted, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { telemetryApi } from '@clic/shared';
import { useReplayEngine } from './composables/useReplayEngine';

import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { getLibrary, compileWorkspaceToAST } from '@/libraries';
import { getTutorialChallenges } from '@/tutorials'; // <-- Adicionado
import { useProjectStore } from '@/shared/stores/projectStore'; // <-- Adicionado
import { registerFieldColour } from '@blockly/field-colour'; 
import { Puzzle, Zap, Settings, Pin } from '@lucide/vue';

// Importações do Motor da Tartaruga
import GridCanvas from '@/editor/components/canvas/GridCanvas.vue';
import { TurtleEngine } from '@/shared/engine/interpreter';

const { t } = useI18n();

// --- DASHBOARD STATE ---
const viewMode = ref<'dashboard' | 'player'>('dashboard');
const today = new Date();
const lastWeek = new Date();
lastWeek.setDate(today.getDate() - 7);
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const startDate = ref(formatDate(lastWeek));
const endDate = ref(formatDate(today));
const sessions = ref<any[]>([]);
const loading = ref(false);
const limitReached = ref(false);
const error = ref<string | null>(null);
const hasSearched = ref(false);

const fetchSessions = async () => {
  loading.value = true;
  error.value = null;
  limitReached.value = false;
  hasSearched.value = true;
  try {
    const data = await telemetryApi.getSessions(startDate.value || '', endDate.value || '');
    sessions.value = data.sessions || [];
    if (data.meta && data.meta.limit_reached) limitReached.value = true;
  } catch (err: any) {
    error.value = err.message || 'Falha ao buscar sessões.';
    sessions.value = [];
  } finally {
    loading.value = false;
  }
};

// --- PLAYER STATE ---
const engine = useReplayEngine();
const blocklyDiv = ref<HTMLElement | null>(null);
let workspace: Blockly.WorkspaceSvg | null = null;

// Sincroniza os blocos do Fantasma com a memória (Store)
const syncPhantomToStore = () => {
  if (!workspace) return;
  const ast = compileWorkspaceToAST(workspace);
  const workspaceJson = Blockly.serialization.workspaces.save(workspace);
  projectStore.updateWorkspaceSilent(workspaceJson, ast);
};

// MÁGICA: Olha para o futuro na linha do tempo para descobrir qual ID o Blockly
// deu para o bloco "Start" na tela do aluno, garantindo que as conexões funcionem!
const findStartBlockId = (fromTime: number) => {
  const futureEvents = engine.timeline.value.filter(e => e._relativeTime >= fromTime);
  const createdIds = new Set();
  
  for (const ev of futureEvents) {
    const name = ev.action_name;
    // Se mudou de fase no futuro, paramos de procurar
    if (name === 'challenge_navigate' || name === 'challenge_next_button' || name === 'loadChallenge') break;
    
    const p = ev.payload;
    if (!p) continue;

    // Registra todos os blocos novos que o aluno puxou nesta fase
    if (name === 'blockly_create') {
      if (p.blockId) createdIds.add(p.blockId);
      if (p.ids) p.ids.forEach((id: string) => createdIds.add(id));
      continue;
    }
    
    // Se qualquer outro evento mencionar um bloco que NÃO foi criado acima, ESTE É O START!
    if (p.blockId && !createdIds.has(p.blockId)) return p.blockId;
    if (p.newParentId && !createdIds.has(p.newParentId)) return p.newParentId;
    if (p.oldParentId && !createdIds.has(p.oldParentId)) return p.oldParentId;
  }
  return undefined; 
};

/// --- MOTOR DA TARTARUGA (FANTASMA) ---
const projectStore = useProjectStore();
let currentLibId = 'turtle-grade-4';

const worldConfig = ref({ gridWidth: 8, gridHeight: 8, startX: 0, startY: 0 });

// Resgata a velocidade real que o aluno usou (1 a 5)
const studentSpeedLevel = ref(3);
const currentSpeedMs = computed(() => {
  const baseMs = [250, 150, 100, 40, 5][studentSpeedLevel.value - 1] || 100;
  return baseMs / engine.playbackSpeed.value;
});

const turtleEngine = new TurtleEngine(() => currentSpeedMs.value);

// Se o pesquisador pausar a "Máquina", pausamos a tartaruga. 
// Mas se a fita acabar, deixamos a tartaruga terminar a sua animação final!
watch(engine.isPlaying, (playing) => {
  if (!playing && engine.currentTime.value < engine.duration.value && turtleEngine.state.status === 'RUNNING') {
    turtleEngine.pause();
  } else if (playing && turtleEngine.state.status === 'PAUSED') {
    turtleEngine.play([], worldConfig.value.gridWidth, worldConfig.value.gridHeight); // Isso apenas retoma a execução sem resetar
  }
});

const eventFeed = ref<any[]>([]);
const feedListEl = ref<HTMLElement | null>(null);

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

// Mapeia eventos priorizando o dado bruto e detalhando as mutações do Blockly
const getEventFormat = (ev: any) => {
  const type = ev.event_type; // 'mutation', 'semantic' ou 'system'
  const p = ev.payload;
  
  let icon = Pin; // Fallback
  let cssClass = `event-${type}`;
  let details = '';

  // 1. Tratamento para MUTAÇÕES (Blockly)
  if (type === 'mutation') {
    icon = Puzzle;
    
    if (ev.action_name === 'loadChallenge') {
      icon = Settings;
      details = ''; // Esconde o dump gigante do Pinia!
      cssClass = 'event-system';
      return { icon, details, class: cssClass };
    }
    
    // Extrai informações cruciais dependendo da ação do Blockly
    if (ev.action_name === 'blockly_create' && p.json?.type) {
      details = `Bloco: ${p.json.type}`;
    } else if (ev.action_name === 'blockly_change') {
      details = `Campo '${p.name}': ${p.oldValue} ➔ ${p.newValue}`;
    } else if (ev.action_name === 'blockly_move') {
      if (p.reason && p.reason.includes('connect')) {
        details = `Conectado ao pai: ${p.newParentId}`;
      } else {
        details = `Movido para: ${p.newCoordinate}`;
      }
    } else if (ev.action_name === 'blockly_delete') {
      details = `Bloco IDs: ${p.ids?.join(', ')}`;
    } else {
      details = JSON.stringify(p);
    }
  } 
  // 2. Tratamento para SEMÂNTICA (Comportamento/Engine)
  else if (type === 'semantic') {
    icon = Zap;
    if (ev.action_name === 'engine_play') {
      details = `Velocidade do Motor: ${p.speed}x`;
    } else if (ev.action_name === 'engine_complete' || ev.action_name === 'engine_success') {
      details = '';
    } else if (ev.action_name.startsWith('challenge_') || ev.action_name === 'reveal_tip') {
      details = ''; 
    } else {
      details = Object.keys(p).length > 0 ? JSON.stringify(p) : '';
    }
  }
  // 3. Tratamento para SISTEMA (project_loaded, etc)
  else if (type === 'system') {
    icon = Settings;
    details = 'Carregamento estrutural';
  }

  return { icon, details, class: cssClass };
};

// --- O CORAÇÃO DO FANTASMA ---
let lastRenderedChallenge = -1;

engine.onFrameZero((initialState) => {
  eventFeed.value = [];
  lastRenderedChallenge = -1;

  if (!blocklyDiv.value) return;
  if (workspace) workspace.dispose();

  registerFieldColour();

  workspace = Blockly.inject(blocklyDiv.value, {
    readOnly: true,
    scrollbars: true,
    zoom: { controls: true, wheel: false } 
  });

  // 1. Hidrata a Store em memória para que o GridCanvas renderize maçãs e alvos
  projectStore.loadProject(initialState);
  currentLibId = initialState.config?.libraryId || 'turtle-grade-4';

  // Força o carregamento do cenário exato (maçãs, paredes e posições) do desafio inicial
  const challenges = getTutorialChallenges(currentLibId, t as any);
  const initIdx = projectStore.activeChallengeIndex || 0;
  if (challenges.length > 0 && challenges[initIdx]) {
    projectStore.loadChallenge(initIdx, challenges[initIdx]);
  }

  // 2. Salva as configurações do mundo e prepara a Tartaruga
  const conf = projectStore.project.config;
  worldConfig.value = {
    gridWidth: conf.gridWidth ?? 8,
    gridHeight: conf.gridHeight ?? 8,
    startX: conf.startX ?? 0,
    startY: conf.startY ?? 0
  };
  turtleEngine.reset(worldConfig.value.startX, worldConfig.value.startY, worldConfig.value.gridWidth, worldConfig.value.gridHeight);

  // 2. Carrega a Biblioteca e injeta no Blockly E na TurtleEngine
  const libId = conf.libraryId || 'turtle-grade-4';
  try {
    const activeLibrary = getLibrary(libId);
    activeLibrary.registerBlocks(t as any);
    activeLibrary.registerParsers(); // <-- CORREÇÃO: Essencial para gerar a AST!
    turtleEngine.clearHandlers();
    activeLibrary.registerEngineHandlers(turtleEngine);
  } catch (e) {
    console.warn("Biblioteca não encontrada.", e);
  }

  if (initialState.blocksWorkspace && Object.keys(initialState.blocksWorkspace).length > 0) {
    Blockly.serialization.workspaces.load(initialState.blocksWorkspace, workspace);
  } else {
    const startBlockId = findStartBlockId(0);
    const startBlock = workspace.newBlock('start', startBlockId); 
    startBlock.initSvg();
    startBlock.render();
    startBlock.moveBy(40, 40);
  }
});

engine.onEvent((event) => {
  if (!workspace) return;

  eventFeed.value.push(event);
  nextTick(() => {
    if (feedListEl.value) feedListEl.value.scrollTop = feedListEl.value.scrollHeight;
  });

  const name = event.action_name;

  // Aplica as Mutações ao Blockly
  if (name.startsWith('blockly_')) {
    try {
      Blockly.Events.disable();
      const blocklyEvent = Blockly.Events.fromJson(event.payload, workspace);
      if (blocklyEvent) blocklyEvent.run(true);
      
      // MÁGICA 1: Salva o progresso do fantasma na memória do Replay!
      syncPhantomToStore(); 
    } catch (err) {
      console.warn("Falha ao aplicar evento fantasma", event, err);
    } finally {
      Blockly.Events.enable();
    }
  } 
  // ... (Deixe os if/else do engine_play, engine_pause, engine_step e engine_reset INTACTOS aqui no meio) ...
  else if (name === 'engine_play') {
    if (event.payload && event.payload.speed) studentSpeedLevel.value = event.payload.speed;
    const ast = compileWorkspaceToAST(workspace);
    turtleEngine.play(ast, worldConfig.value.gridWidth, worldConfig.value.gridHeight, worldConfig.value.startX, worldConfig.value.startY);
  } else if (name === 'engine_pause') {
    turtleEngine.pause();
  } else if (name === 'engine_reset') {
    turtleEngine.reset(worldConfig.value.startX, worldConfig.value.startY, worldConfig.value.gridWidth, worldConfig.value.gridHeight);
  } else if (name === 'engine_step') {
    const ast = compileWorkspaceToAST(workspace);
    turtleEngine.step(ast, worldConfig.value.gridWidth, worldConfig.value.gridHeight, worldConfig.value.startX, worldConfig.value.startY);
  }
  // Interceptador Mágico: Suporta logs antigos (loadChallenge) e novos (challenge_navigate)
  else if (name === 'challenge_navigate' || name === 'challenge_next_button' || name === 'loadChallenge') {
    let toIndex = undefined;

    // Resolve onde está o index, dependendo se é evento semântico novo ou mutação antiga do Pinia
    if (name === 'loadChallenge') {
      if (event.payload?.args && event.payload.args.length > 0) toIndex = event.payload.args[0];
    } else {
      toIndex = event.payload?.toIndex;
    }

    // Se encontramos o nível e ele é diferente do que já está desenhado na tela
    if (toIndex !== undefined && lastRenderedChallenge !== toIndex) {
      lastRenderedChallenge = toIndex;
      
      const challenges = getTutorialChallenges(currentLibId, t as any);
      if (challenges[toIndex]) {
        // 1. Atualiza a Store (maçãs e grade do GridCanvas)
        projectStore.loadChallenge(toIndex, challenges[toIndex]);
        
        // 2. Atualiza e Reseta a Tartaruga
        const conf = projectStore.project.config;
        worldConfig.value = { 
          gridWidth: conf.gridWidth ?? 8, gridHeight: conf.gridHeight ?? 8, 
          startX: conf.startX ?? 0, startY: conf.startY ?? 0 
        };
        turtleEngine.reset(worldConfig.value.startX, worldConfig.value.startY, worldConfig.value.gridWidth, worldConfig.value.gridHeight);

        // 3. Limpa a tela do Fantasma!
        Blockly.Events.disable();
        workspace.clear();
        
        // 4. Se o aluno já havia trabalhado nesta fase antes, recupera a memória!
        const stateToLoad = projectStore.project.config.tutorialSavedWorkspaces?.[toIndex];
        
        if (stateToLoad && Object.keys(stateToLoad).length > 0) {
          Blockly.serialization.workspaces.load(stateToLoad, workspace);
        } else {
          // Fase virgem: cria o Start com o ID "Vidente"
          const startBlockId = findStartBlockId(event._relativeTime);
          const startBlock = workspace.newBlock('start', startBlockId);
          startBlock.initSvg();
          startBlock.render();
          startBlock.moveBy(40, 40);
        }
        
        Blockly.Events.enable();
        syncPhantomToStore();
      }
    }
  }
});

// --- CONTROLES DA TELA ---
const openTimeline = async (sessionId: string) => {
  try {
    const timelineData = await telemetryApi.getSessionTimeline(sessionId);
    viewMode.value = 'player';
    await nextTick();
    engine.loadTimeline(timelineData);
  } catch (err: any) {
    alert('Erro ao carregar a timeline: ' + err.message);
  }
};

const closePlayer = () => {
  engine.reset();
  if (workspace) workspace.dispose();
  workspace = null;
  viewMode.value = 'dashboard';
};

onUnmounted(() => {
  engine.pause();
  if (workspace) workspace.dispose();
});
</script>

<style scoped>
/* DASHBOARD GERAL */
.replay-app { height: 100vh; overflow: hidden; background-color: #f8fafc; font-family: sans-serif; }
.dashboard-header { background: #1e293b; color: white; padding: 1rem 2rem; }
.dashboard-header h2 { margin: 0; font-size: 1.5rem; }
.dashboard-header span { font-weight: normal; color: #94a3b8; font-size: 1rem; }
.dashboard-content { padding: 2rem; max-width: 1000px; margin: 0 auto; }
.search-panel { display: flex; gap: 1rem; align-items: flex-end; background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; }
.form-group label { font-size: 0.85rem; font-weight: bold; color: #475569; }
.form-group input { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 4px; }
.btn-search, .btn-play { background-color: #2563eb; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: bold; }
.btn-search:hover, .btn-play:hover { background-color: #1d4ed8; }
.sessions-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.sessions-table th, .sessions-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
.alert-warning, .alert-error { padding: 1rem; border-radius: 4px; margin-bottom: 1rem; }
.alert-warning { background-color: #fef08a; color: #854d0e; }
.alert-error { background-color: #fecaca; color: #991b1b; }

/* REPRODUTOR (PLAYER) */
.replay-player { display: flex; flex-direction: column; height: 100vh; }
.player-header { display: flex; align-items: center; gap: 1.5rem; background: #0f172a; padding: 0.75rem 1.5rem; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index: 10; }
.btn-back { background: transparent; color: #94a3b8; border: 1px solid #475569; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-weight: bold; }
.btn-back:hover { background: #334155; color: white; }
.player-controls { display: flex; align-items: center; gap: 1rem; flex: 1; }
.btn-control { border: none; padding: 0.5rem 1rem; border-radius: 4px; font-weight: bold; cursor: pointer; width: 90px; }
.play-btn { background: #10b981; color: white; }
.play-btn:hover { background: #059669; }
.pause-btn { background: #f59e0b; color: white; }
.pause-btn:hover { background: #d97706; }

.scrubber { display: flex; align-items: center; gap: 1rem; flex: 1; font-family: monospace; font-size: 1.1rem; }
.time-label { min-width: 50px; text-align: center; }
.scrubber input[type="range"] { flex: 1; cursor: not-allowed; accent-color: #3b82f6; }
.speed-select { background: #1e293b; color: white; border: 1px solid #475569; padding: 0.4rem; border-radius: 4px; font-weight: bold; }

/* CORPO DO REPRODUTOR (SPLIT VIEW) */
.player-body { display: flex; flex: 1; min-height: 0; }

/* O Palco é dividido em Lógica (Blockly) e Execução (Canvas) */
.player-stage { flex: 7; display: flex; flex-direction: row; min-width: 0; }
.blockly-wrapper { flex: 6; position: relative; border-right: 2px solid #cbd5e1; }
.blockly-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

.canvas-wrapper { 
  flex: 4; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  background: #f3f4f6; 
  overflow: hidden; 
  position: relative; 
  padding: 1rem;
}

/* FEED DE LOGS LATERAIS */
.player-feed { flex: 3; background: #ffffff; border-left: 1px solid #cbd5e1; display: flex; flex-direction: column; min-width: 320px; max-width: 450px; }
.feed-header { padding: 1rem; background: #f8fafc; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center; }
.feed-header h3 { margin: 0; font-size: 1rem; color: #1e293b; }
.badge { background: #3b82f6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; }

.feed-list { flex: 1; overflow-y: auto; list-style: none; padding: 0; margin: 0; scroll-behavior: smooth; }
.feed-item { padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 0.25rem; }

.feed-main { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
.feed-time { font-family: monospace; color: #64748b; font-weight: bold; }
.feed-icon { display: flex; align-items: center; color: #64748b; }
.feed-action { color: #0f172a; font-family: monospace; font-size: 0.9rem; }

/* Exibição do Payload/Detalhes em formato código */
.feed-details { 
  margin-left: 5.5rem; 
  background: #f1f5f9; 
  padding: 0.4rem; 
  border-radius: 4px; 
  font-family: monospace; 
  font-size: 0.75rem; 
  color: #475569; 
  word-break: break-all;
}

.feed-empty { padding: 2rem; text-align: center; color: #94a3b8; font-style: italic; }

/* Cores por Categoria Nativa (event_type) */
.event-mutation { background-color: #ffffff; border-left: 3px solid #3b82f6; } /* Azul para o Blockly */
.event-semantic { background-color: #f0fdf4; border-left: 3px solid #22c55e; } /* Verde para Ações */
.event-system { background-color: #f8fafc; border-left: 3px solid #94a3b8; }   /* Cinza para Sistema */
</style>