<script setup lang="ts">
import ReaderLayout from './layouts/ReaderLayout.vue';
import ToastContainer from '@/shared/components/layout/ToastContainer.vue';
</script>

<template>
  <div class="runtime-root">
    <ReaderLayout />
    <ToastContainer />
  </div>
</template>

<style>
/* CSS Reset Global para o Runtime */
html, body, #app {
  margin: 0; padding: 0; width: 100%; height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #fff;
  color: #1f2937;
}
.runtime-root { height: 100vh; display: flex; flex-direction: column; }
</style>