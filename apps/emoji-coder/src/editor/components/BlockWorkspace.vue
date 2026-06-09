<template>
  <div class="workspace-layout" :class="{ 'is-preview': isPreview }">
    
    <!-- Painel Esquerdo: Lógica (Oculto via CSS no modo preview) -->
    <div class="panel-logic" v-show="!isPreview">
      <BlockEditor />
    </div>

    <!-- Painel Direito: Execução (Ganha 100% do espaço no modo preview) -->
    <div class="panel-execution">
      <ExecutionPanel />
    </div>

  </div>
</template>

<script setup lang="ts">
import BlockEditor from './BlockEditor.vue';
import ExecutionPanel from './ExecutionPanel.vue';

defineProps<{
  isPreview?: boolean;
}>();
</script>

<style scoped>
.workspace-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  transition: all 0.3s ease;
  background-color: #f9fafb;
}

.panel-logic {
  flex: 1; /* Ocupa o espaço restante (aprox 60%) */
  min-width: 0; /* Evita vazamento no flexbox */
  height: 100%;
}

.panel-execution {
  width: 40%;
  min-width: 350px;
  max-width: 600px;
  height: 100%;
  transition: all 0.3s ease;
  box-shadow: -4px 0 15px rgba(0,0,0,0.03); /* Leve sombra para separar do Blockly */
}

/* --- MODO PREVIEW: Esconde o Blockly e centraliza o Canvas --- */
.workspace-layout.is-preview {
  justify-content: center;
}

.workspace-layout.is-preview .panel-execution {
  width: 100%;
  max-width: 800px; /* Expande o palco no modo de apresentação */
  border-left: none;
  box-shadow: 0 0 30px rgba(0,0,0,0.08); /* Destaque teatral */
}

/* --- SUPORTE A MOBILE E TABLET (TOUCHSCREEN) --- */
@media (max-width: 768px) {
  .workspace-layout {
    flex-direction: column; /* Empilha verticalmente em telas menores */
  }

  .panel-execution {
    width: 100%;
    min-width: 0; /* Remove a trava de 350px que causava vazamento no celular */
    max-width: none;
    height: 45%; /* O Canvas ganha a parte de cima da tela */
    border-left: none;
    border-bottom: 2px solid #e5e7eb;
    order: -1; /* Força o palco a ficar em cima dos blocos */
  }

  .panel-logic {
    height: 55%; /* Blockly na parte de baixo */
    width: 100%;
    min-width: 0; 
  }
}
</style>