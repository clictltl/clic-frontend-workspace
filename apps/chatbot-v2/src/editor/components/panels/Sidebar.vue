<script setup lang="ts">
import { useProjectStore } from '../../../shared/stores/projectStore';
import VariablesPanel from './VariablesPanel.vue';
import NodePropertiesPanel from './NodePropertiesPanel.vue';
import EdgePropertiesPanel from './EdgePropertiesPanel.vue';

const projectStore = useProjectStore();
</script>

<template>
  <aside class="sidebar-container">
    <NodePropertiesPanel v-if="projectStore.selectedNodeId" />
    <EdgePropertiesPanel v-else-if="projectStore.selectedEdgeId" />
    <VariablesPanel v-else />
  </aside>
</template>

<style scoped>
.sidebar-container {
  width: 320px;
  background: #ffffff;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}
</style>