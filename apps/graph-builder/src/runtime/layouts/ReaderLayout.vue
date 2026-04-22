<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useProjectStore } from '@/shared/stores/projectStore';
import Navigation from '../components/Navigation.vue';
import GraphCanvas from '../components/GraphCanvas.vue';
import ReferencesPanel from '../components/ReferencesPanel.vue';
import { Maximize2, Minimize2 } from 'lucide-vue-next';
import MarkdownRenderer from '@/shared/components/ui/MarkdownRenderer.vue';

const props = defineProps<{ isPreview?: boolean }>();
const store = useProjectStore();

// Sincronização: Hash do Navegador -> Store (Lida com o botão "Voltar" e Links Diretos)
const syncHashToStore = () => {
  if (props.isPreview) return;

  const hashId = window.location.hash.replace('#', '');
  
  if (hashId && store.project.nodes[hashId]) {
    store.selectedNodeId = hashId; // Entrou num deep link ou voltou/avançou
  } else if (!hashId) {
    store.selectedNodeId = null;   // Voltou para a Home (Mapa Global)
  }
};

onMounted(() => {
  syncHashToStore(); // Lê a URL logo que o aluno abre a página
  window.addEventListener('hashchange', syncHashToStore);
});

onUnmounted(() => {
  window.removeEventListener('hashchange', syncHashToStore);
});

// Sincronização: Store -> Hash do Navegador (Lida com cliques internos em qualquer componente)
watch(() => store.selectedNodeId, (newId) => {
  if (props.isPreview) return;
  
  const currentHash = window.location.hash.replace('#', '');
  
  if (newId !== currentHash) {
    if (newId) {
      window.location.hash = newId;
    } else {
      // Se clicou em "Ver Mapa Global", remove o hash da URL mantendo o histórico limpo
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
  }
});

// Profundidade do grafo (1 a 5)
const graphDepth = ref(1);
const isGraphExpanded = ref(false);

const activeNode = computed(() => {
  if (store.selectedNodeId) {
    return store.project.nodes[store.selectedNodeId] || null;
  }
  return null;
});

const activeNodeContent = computed(() => {
  if (!activeNode.value) return '';
  return store.getNodeContent(activeNode.value.id);
});

const isEmpty = computed(() => Object.keys(store.project.nodes).length === 0);

const contentAreaRef = ref<HTMLElement | null>(null);

// Resetar ao mudar de nó (opcional, mas bom para UX)
watch(activeNode, (newVal) => {
  if (newVal) {
    graphDepth.value = 1; // Volta ao foco local
    isGraphExpanded.value = false; // Sai do modo tela cheia se mudar de nó

    nextTick(() => {
      if (contentAreaRef.value) {
        contentAreaRef.value.scrollTop = 0;
      }
    });
  }
});
</script>

<template>
  <div class="preview-layout">
    <!-- COLUNA 1: Navegação -->
    <Navigation />

    <!-- COLUNA 2: Conteúdo Central -->
    <main class="content-area" ref="contentAreaRef">
      
      <!-- CASO 1: Vazio -->
      <div v-if="isEmpty" class="empty-msg">
        O projeto está vazio.
      </div>

      <!-- CASO 2: Home View (Grafo Global) -->
      <div v-else-if="!activeNode" class="home-view">
        <div class="home-header">
          <h1>Mapa Global de Conexões</h1>
          <span class="header-divider">—</span>
          <p>Explore o mapa e clique em um item para descobrir mais.</p>
        </div>
        <div class="full-graph-container">
          <GraphCanvas :force-global="true" />
        </div>
      </div>

      <!-- CASO 3: Leitura (Com Slider e Expandir) -->
      <div v-else class="document-view">
        
        <!-- Área do Grafo com classe dinâmica para Fullscreen -->
        <div class="graph-section" :class="{ 'expanded': isGraphExpanded }">
          
          <div class="graph-controls">
            <span class="label">Conexões:</span>
            
            <!-- Slider -->
            <div class="slider-container">
              <span class="small-label">Nível</span>
              <input 
                type="range" 
                min="1" 
                max="5" 
                step="1" 
                v-model.number="graphDepth"
              />
              <span class="small-label">{{ graphDepth >= 5 ? 'Todos' : graphDepth }}</span>
            </div>

            <div class="spacer"></div>

            <!-- Botão Expandir -->
            <button 
              class="btn-expand" 
              @click="isGraphExpanded = !isGraphExpanded"
              :title="isGraphExpanded ? 'Reduzir' : 'Expandir'"
            >
              <Minimize2 v-if="isGraphExpanded" class="icon-xs" />
              <Maximize2 v-else class="icon-xs" />
              <span>{{ isGraphExpanded ? 'Reduzir' : 'Expandir' }}</span>
            </button>
          </div>

          <div class="graph-box">
            <GraphCanvas 
              :active-node-id="activeNode.id"
              :depth="graphDepth"
              :is-expanded="isGraphExpanded"
            />
          </div>
        </div>

        <article class="markdown-body">
          <h1 class="node-title">{{ activeNode.title }}</h1>
          <div class="node-content">
            <MarkdownRenderer 
              v-if="activeNodeContent" 
              :source="activeNodeContent" 
            />
            <p v-else class="no-content">Sem conteúdo escrito.</p>
          </div>
        </article>

      </div>
    </main>

    <!-- COLUNA 3: Referências (Só aparece se tiver nó ativo) -->
    <ReferencesPanel v-if="activeNode" />

  </div>
</template>

<style scoped>
.preview-layout {
  display: flex; height: 100%; width: 100%; background: #fff; overflow: hidden;
}
.content-area {
  flex: 1; overflow-y: auto; display: flex; flex-direction: column; background: #fff;
}

/* --- HOME VIEW --- */
/* --- HOME VIEW --- */
.home-view { flex: 1; display: flex; flex-direction: column; height: 100%; }
.home-header { 
  padding: 12px 24px; 
  background: #f8fafc; 
  border-bottom: 1px solid #e2e8f0; 
  display: flex; 
  align-items: center; 
  gap: 12px;
}
.home-header h1 { margin: 0; color: #1e293b; font-size: 1.1rem; }
.home-header p { margin: 0; color: #64748b; font-size: 0.95rem; }
.header-divider { color: #cbd5e1; user-select: none; }
.full-graph-container { flex: 1; background: #f1f5f9; }

/* --- DOCUMENT VIEW --- */
.document-view {
  width: 100%; max-width: 800px; margin: 0 auto;
  padding: 30px; display: flex; flex-direction: column; gap: 30px;
}

/* --- GRAPH SECTION & CONTROLS --- */
.graph-section {
  border: 1px solid #e2e8f0; border-radius: 8px;
  overflow: hidden; background: #f8fafc;
  display: flex; flex-direction: column;
  transition: all 0.3s ease;
}

.graph-controls {
  padding: 8px 16px; border-bottom: 1px solid #e2e8f0;
  background: #fff; display: flex; gap: 16px; align-items: center;
  height: 50px;
}

.slider-container {
  display: flex; align-items: center; gap: 8px; flex: 1; max-width: 200px;
}

input[type=range] { flex: 1; cursor: pointer; }

.label { font-size: 0.9rem; font-weight: 600; color: #475569; }
.small-label { font-size: 0.8rem; color: #94a3b8; width: 30px; text-align: center; }

.spacer { flex: 1; }

.btn-expand {
  background: transparent; border: 1px solid #e2e8f0;
  padding: 6px 10px; border-radius: 4px; cursor: pointer;
  font-size: 0.85rem; color: #64748b;
  display: flex; align-items: center; gap: 6px;
}
.btn-expand:hover { background: #f1f5f9; color: #334155; }
.icon-xs { width: 14px; height: 14px; }

.graph-box { height: 300px; width: 100%; background: #f8fafc; }

/* --- ESTADO EXPANDIDO (FULLSCREEN) --- */
.graph-section.expanded {
  position: fixed;
  top: 20px; left: 20px; right: 20px; bottom: 20px;
  z-index: 9999;
  border-radius: 8px;
  box-shadow: 0 0 0 1000px rgba(0,0,0,0.5); /* Backdrop escuro */
  height: auto; /* Reseta altura fixa */
  width: auto;
}

.graph-section.expanded .graph-box {
  flex: 1; /* Ocupa todo o espaço restante do container fixo */
  height: auto;
}

/* --- TYPOGRAPHY --- */
.node-title { font-size: 2.2rem; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 24px; }
.node-content { font-size: 1.1rem; line-height: 1.6; color: #334155; }
.no-content { font-style: italic; color: #94a3b8; }
.empty-msg { margin: 50px auto; color: #64748b; font-size: 1.2rem; }
</style>