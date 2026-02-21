<template>
  <div class="modal-backdrop">
    <div class="modal-card">
      <div class="icon-container">
        <span class="icon">🔗</span>
      </div>
      
      <h3>Link Inválido ou Expirado</h3>
      
      <p>
        Não foi possível carregar o projeto compartilhado. <br>
        O link pode estar incorreto, ter sido revogado pelo proprietário ou o projeto foi excluído.
      </p>

      <div class="modal-actions">
        <button class="btn-primary" @click="$emit('close')">
          Entendi, criar novo projeto
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits(['close']);
</script>

<style scoped>
.modal-backdrop { 
  position: fixed; inset: 0; z-index: 20000; /* Z-index alto para ficar sobre tudo */
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  font-family: sans-serif;
}

.modal-card { 
  background: white; width: 100%; max-width: 400px; 
  padding: 2rem; border-radius: 12px; 
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); 
  text-align: center;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.icon-container { 
  background: #fef2f2; color: #dc2626; 
  width: 64px; height: 64px; border-radius: 50%; 
  display: flex; align-items: center; justify-content: center; 
  margin: 0 auto 1.5rem auto; 
}
.icon { font-size: 32px; }

h3 { margin: 0 0 1rem 0; color: #111827; font-size: 1.25rem; }
p { margin: 0 0 2rem 0; color: #6b7280; font-size: 0.95rem; line-height: 1.6; }

.modal-actions { display: flex; justify-content: center; }

.btn-primary { 
  background: #2563eb; color: white; border: none; 
  padding: 0.8rem 1.5rem; border-radius: 8px; 
  cursor: pointer; font-weight: 500; font-size: 1rem;
  transition: background 0.2s;
  width: 100%;
}
.btn-primary:hover { background: #1d4ed8; }

@keyframes popIn { 
  from { opacity: 0; transform: scale(0.9); } 
  to { opacity: 1; transform: scale(1); } 
}
</style>