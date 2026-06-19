<template>
  <ExecutionPlayer 
    :is-preview="isPreview" 
    @toggle-preview="$emit('toggle-preview')" 
  />
</template>

<script setup lang="ts">
import ExecutionPlayer from '@/shared/components/ExecutionPlayer.vue';

defineProps<{ isPreview?: boolean }>();
defineEmits(['toggle-preview']);
</script>