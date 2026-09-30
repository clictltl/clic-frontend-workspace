<script setup lang="ts">
import { computed } from 'vue';
import { useProjectStore } from '../../../shared/stores/projectStore';
import type { RichText } from '../../../shared/types/chatbot';
import RichTextEditor from '../canvas/nodes/RichTextEditor.vue';

/**
 * Editor do texto de um nó. Recebe o `nodeId` como prop para que o commit feito
 * ao desmontar (ex.: trocar de nó durante a edição) vá para o nó certo.
 */
const props = withDefaults(defineProps<{
  nodeId: string;
  variant?: 'canvas' | 'sidebar';
}>(), {
  variant: 'canvas'
});

const emit = defineEmits<{ blur: [] }>();
const projectStore = useProjectStore();

const content = computed(() => {
  const node = projectStore.project.nodes[props.nodeId];
  return node && 'content' in node.data ? node.data.content : null;
});

function commit(doc: RichText) {
  projectStore.setNodeContent(props.nodeId, doc);
}
</script>

<template>
  <RichTextEditor v-if="content" :model-value="content" :variant="variant" @commit="commit" @blur="emit('blur')" />
</template>
