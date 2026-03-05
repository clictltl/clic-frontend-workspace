<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div 
        v-for="item in toasts" 
        :key="item.id" 
        class="toast-item"
        :class="item.type"
        @click="remove(item.id)"
      >
        <CheckCircle v-if="item.type === 'success'" :size="18" class="icon" />
        <XCircle v-if="item.type === 'error'" :size="18" class="icon" />
        <Info v-if="item.type === 'info'" :size="18" class="icon" />
        <span class="message">{{ item.message }}</span>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useToast } from './useToast';
import { CheckCircle, XCircle, Info } from 'lucide-vue-next';

const { toasts, remove } = useToast();
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 11000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  min-width: 250px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  border-left: 4px solid #ccc;
  overflow: hidden;
}

.toast-item.success { border-left-color: #10b981; }
.toast-item.error { border-left-color: #ef4444; }
.toast-item.info { border-left-color: #3b82f6; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(30px); }
</style>