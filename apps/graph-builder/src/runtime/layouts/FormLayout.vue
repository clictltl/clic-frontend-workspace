<script setup lang="ts">
import { ref, computed } from 'vue';
import { Send, CheckCircle } from 'lucide-vue-next';

const props = defineProps<{
  formConfig: any;      // { reference_id, config: { nameFieldLabel, targetCategories } }
  projectData: any;     // { categories: [], nodes:[] }
  token: string;
}>();

const isLoading = ref(false);
const isSuccess = ref(false);
const errorMsg = ref('');

// --- ESTADO DO FORMULÁRIO (RESPOSTAS DO ALUNO) ---
const studentName = ref('');
// Mapeia { 'id-categoria': 'id-do-no-escolhido' }
const selections = ref<Record<string, string>>({});

// Monta as perguntas com base nas categorias alvo do professor
const questions = computed(() => {
  const targets: string[] = props.formConfig.config.targetCategories ||[];
  
  return targets.map(catId => {
    const category = props.projectData.categories.find((c: any) => c.id === catId);
    const options = props.projectData.nodes
      .filter((n: any) => n.categoryId === catId)
      .sort((a: any, b: any) => a.order - b.order);
      
    return {
      id: catId,
      name: category?.name || 'Opção',
      color: category?.color || '#3b82f6',
      options
    };
  }).filter(q => q.options.length > 0); // Esconde perguntas sem opções
});

const isFormValid = computed(() => {
  if (!studentName.value.trim()) return false;
  // Exige que todas as perguntas de múltipla escolha sejam respondidas
  return questions.value.every(q => !!selections.value[q.id]);
});

const submitForm = async () => {
  if (!isFormValid.value) return;
  
  isLoading.value = true;
  errorMsg.value = '';

  try {
    const restRoot = window.CLIC_CORE?.rest_root ?? '/wp-json/clic/v1/graph-builder/';
    
    // Converte o objeto de seleções em um array flat de IDs de conexões
    const connectionIds = Object.values(selections.value);

    // O payload genérico que o back-end espera
    const payload = {
      name: studentName.value.trim(),
      connections: connectionIds
    };

    const res = await fetch(`${restRoot}forms/${props.token}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: payload })
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Erro ao enviar resposta.');

    isSuccess.value = true;
  } catch (err: any) {
    errorMsg.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const reloadPage = () => {
  window.location.reload();
};
</script>

<template>
  <div class="form-layout">
    <div class="form-container">
      
      <!-- TELA DE SUCESSO -->
      <div v-if="isSuccess" class="success-screen">
        <CheckCircle class="icon-success" :size="64" />
        <h2>Resposta Enviada!</h2>
        <p>Obrigado, {{ studentName }}. Sua resposta foi registrada no sistema.</p>
        <button class="btn-primary" @click="reloadPage">Enviar outra resposta</button>
      </div>

      <!-- TELA DO FORMULÁRIO -->
      <div v-else class="form-content">
        <div class="form-header">
          <h2>Pesquisa</h2>
          <p>Preencha os campos abaixo para participar do mapeamento.</p>
        </div>

        <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>

        <!-- Pergunta 1: Nome -->
        <div class="question-block">
          <label class="question-title">{{ formConfig.config.nameFieldLabel || 'Qual o seu nome?' }}</label>
          <input 
            type="text" 
            v-model="studentName" 
            placeholder="Digite sua resposta..." 
            class="input-text"
            :disabled="isLoading"
          />
        </div>

        <!-- Perguntas Dinâmicas (Categorias Alvo) -->
        <div 
          v-for="question in questions" 
          :key="question.id" 
          class="question-block"
        >
          <label class="question-title">
            <span class="color-dot" :style="{ backgroundColor: question.color }"></span>
            Escolha uma opção de: {{ question.name }}
          </label>
          
          <div class="options-grid">
            <label 
              v-for="option in question.options" 
              :key="option.id" 
              class="option-card"
              :class="{ selected: selections[question.id] === option.id }"
            >
              <input 
                type="radio" 
                :name="'q_' + question.id" 
                :value="option.id" 
                v-model="selections[question.id]"
                :disabled="isLoading"
              />
              <span class="option-text">{{ option.title }}</span>
            </label>
          </div>
        </div>

        <!-- Botão de Envio -->
        <div class="form-footer">
          <button 
            class="btn-submit" 
            :disabled="!isFormValid || isLoading"
            @click="submitForm"
          >
            <Send v-if="!isLoading" :size="18" />
            {{ isLoading ? 'Enviando...' : 'Enviar Resposta' }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.form-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 40px 20px;
  background-color: #f8fafc;
  box-sizing: border-box;
}

.form-container {
  width: 100%;
  max-width: 500px;
  margin: auto;
  flex-shrink: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  overflow: hidden;
}

.form-header {
  padding: 24px 30px;
  background: #1e293b;
  color: white;
  text-align: center;
}

.form-header h2 { margin: 0 0 8px 0; font-size: 1.5rem; }
.form-header p { margin: 0; font-size: 0.9rem; color: #94a3b8; }

.form-content { padding: 30px; }

.question-block { margin-bottom: 24px; }
.question-title {
  display: flex; align-items: center; gap: 8px;
  font-weight: 600; color: #334155; margin-bottom: 12px; font-size: 1rem;
}
.color-dot { width: 10px; height: 10px; border-radius: 50%; }

.input-text {
  width: 100%; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 8px;
  font-size: 1rem; color: #1e293b; transition: border-color 0.2s; box-sizing: border-box;
}
.input-text:focus { border-color: #3b82f6; outline: none; }

.options-grid { display: flex; flex-direction: column; gap: 8px; }
.option-card {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 8px;
  cursor: pointer; transition: all 0.2s;
}
.option-card:hover:not(.selected) { border-color: #cbd5e1; background: #f8fafc; }
.option-card.selected { border-color: #3b82f6; background: #eff6ff; }
.option-card input[type="radio"] { width: 18px; height: 18px; accent-color: #3b82f6; }
.option-text { font-size: 0.95rem; color: #334155; font-weight: 500; }

.form-footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 24px; }
.btn-submit {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  background: #3b82f6; color: white; padding: 14px; border: none; border-radius: 8px;
  font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: background 0.2s;
}
.btn-submit:hover:not(:disabled) { background: #2563eb; }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

.error-banner {
  background: #fee2e2; color: #b91c1c; padding: 12px; border-radius: 8px;
  margin-bottom: 20px; font-size: 0.9rem; text-align: center; font-weight: 500;
}

.success-screen { padding: 40px 30px; text-align: center; }
.icon-success { color: #10b981; margin-bottom: 16px; }
.success-screen h2 { color: #1e293b; margin: 0 0 12px 0; }
.success-screen p { color: #64748b; margin: 0 0 24px 0; line-height: 1.5; }
.btn-primary {
  background: #1e293b; color: white; border: none; padding: 10px 20px;
  border-radius: 6px; cursor: pointer; font-weight: 500; transition: background 0.2s;
}
.btn-primary:hover { background: #334155; }
</style>