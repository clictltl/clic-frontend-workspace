<script setup lang="ts">
import { onMounted, ref, onUnmounted, watch } from 'vue';
import cytoscape from 'cytoscape';
import { useProjectStore } from '@/shared/stores/projectStore';

const props = withDefaults(defineProps<{
  activeNodeId?: string;
  depth?: number;
  forceGlobal?: boolean;
  isExpanded?: boolean;
}>(), {
  depth: 1,
  forceGlobal: false,
  isExpanded: false
});

const store = useProjectStore();
const cyContainer = ref<HTMLElement | null>(null);
let cyInstance: cytoscape.Core | null = null;

// --- 1. Lógica de Tamanho (Grau de Conexão Global) ---
const getNodeSize = (nodeId: string) => {
  const allEdges = store.project.edges;
  const degree = allEdges.filter(e => e.source === nodeId || e.target === nodeId).length;
  const baseSize = 20;    
  const multiplier = 5;   
  const maxSize = 120;    
  return Math.min(baseSize + (degree * multiplier), maxSize);
};

// --- 2. Mappers ---
const mapNodeToCy = (n: any) => {
  const category = store.project.categories.find(c => c.id === n.categoryId);
  const size = getNodeSize(n.id);
  return {
    data: { 
      id: n.id, label: n.title, color: category ? category.color : '#94a3b8', size: size 
    },
    classes: n.id === props.activeNodeId ? 'center-node' : ''
  };
};


const mapEdgeToCy = (e: any) => ({
  data: { id: e.id, source: e.source, target: e.target }
});

// --- 3. Lógica de Profundidade (BFS) ---
const getFilteredElements = () => {
  const allNodes = store.project.nodes;
  const allEdges = store.project.edges;

  if (props.forceGlobal || !props.activeNodeId) {
    return [...allNodes.map(mapNodeToCy), ...allEdges.map(mapEdgeToCy)];
  }
  if (props.depth >= 5) {
    return [...allNodes.map(mapNodeToCy), ...allEdges.map(mapEdgeToCy)];
  }

  const startNodeId = props.activeNodeId;
  const visitedNodes = new Set<string>([startNodeId]);
  const visibleEdges = new Set<string>();
  let currentLayer = [startNodeId];

  for (let i = 0; i < props.depth; i++) {
    const nextLayer: string[] = [];
    currentLayer.forEach(nodeId => {
      const connectedEdges = allEdges.filter(e => e.source === nodeId || e.target === nodeId);
      connectedEdges.forEach(edge => {
        visibleEdges.add(edge.id);
        const neighborId = edge.source === nodeId ? edge.target : edge.source;
        if (!visitedNodes.has(neighborId)) {
          visitedNodes.add(neighborId);
          nextLayer.push(neighborId);
        }
      });
    });
    currentLayer = nextLayer;
  }

  const finalNodes = allNodes.filter(n => visitedNodes.has(n.id));
  const finalEdges = allEdges.filter(e => visibleEdges.has(e.id));
  return [...finalNodes.map(mapNodeToCy), ...finalEdges.map(mapEdgeToCy)];
};

// --- 4. Renderização ---
const renderGraph = () => {
  if (!cyContainer.value) return;

  const elements = getFilteredElements();

  if (cyInstance) {
    cyInstance.elements().remove();
    cyInstance.add(elements);
    runLayout();
    return;
  }

  cyInstance = cytoscape({
    container: cyContainer.value,
    elements: elements,
    minZoom: 0.2,
    maxZoom: 3,
    wheelSensitivity: 0.2,
    style: [
      {
        selector: 'node',
        style: {
          'background-color': 'data(color)',
          'label': 'data(label)',
          'color': '#334155',
          'font-weight': 'bold',
          'text-valign': 'bottom',
          'text-margin-y': 6,
          'font-size': '12px',
          'width': 'data(size)',
          'height': 'data(size)',
          'transition-property': 'background-opacity, line-color, target-arrow-color, opacity',
          'transition-duration': 300
        } as any
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#cbd5e1',
          'curve-style': 'bezier',
          'transition-property': 'line-color, opacity',
          'transition-duration': 300
        } as any
      },
      {
        selector: '.faded',
        style: { 'opacity': 0.1, 'label': '' } as any
      },
      {
        selector: '.highlight',
        style: { 'opacity': 1, 'line-color': '#94a3b8', 'target-arrow-color': '#94a3b8', 'z-index': 9999 } as any
      },
      {
        selector: '.center-node',
        style: { 'border-width': 4, 'border-color': '#2563eb' }
      }
    ]
  });

  runLayout();
  setupInteractions();
};

const runLayout = () => {
  if (!cyInstance) return;
  
  const isLocal = !props.forceGlobal && props.depth === 1 && props.activeNodeId;

  const layoutConfig = isLocal
    ? {
        name: 'concentric',
        animate: true,
        animationDuration: 500,
        padding: 30,
        minNodeSpacing: 60,
        concentric: (node: any) => node.id() === props.activeNodeId ? 2 : 1,
        levelWidth: () => 1
      }
    : {
        name: 'cose',
        animate: true,
        animationDuration: 500,
        padding: 30,
        nodeRepulsion: 450000,
        idealEdgeLength: 100
      };
      
  cyInstance.layout(layoutConfig as any).run();
};

const setupInteractions = () => {
  if (!cyInstance) return;

  cyInstance.on('tap', 'node', (evt) => {
    const nodeId = evt.target.id();
    if (nodeId !== props.activeNodeId) {
      store.selectedNodeId = nodeId;
    }
  });

  cyInstance.on('mouseover', 'node', (e) => {
    const node = e.target;
    const neighbors = node.neighborhood();
    cyInstance?.elements().addClass('faded');
    node.removeClass('faded').addClass('highlight');
    neighbors.removeClass('faded').addClass('highlight');
  });

  cyInstance.on('mouseout', 'node', () => {
    cyInstance?.elements().removeClass('faded').removeClass('highlight');
  });
};

onMounted(() => renderGraph());

watch(() => [props.activeNodeId, props.depth, props.forceGlobal], () => {
  renderGraph();
});

watch(() => props.isExpanded, () => {
  setTimeout(() => {
    if (cyInstance) {
      cyInstance.resize();
      cyInstance.animate({
        fit: {
          eles: cyInstance.elements(),
          padding: 50
        }
      }, { duration: 500 });
    }
  }, 350);
});

onUnmounted(() => { if (cyInstance) cyInstance.destroy(); });
</script>

<template>
  <div class="graph-wrapper">
    <div ref="cyContainer" class="cy-container"></div>
  </div>
</template>

<style scoped>
.graph-wrapper {
  width: 100%;
  height: 100%;
  background-color: #f8fafc;
  position: relative;
}
.cy-container { width: 100%; height: 100%; display: block; }
</style>