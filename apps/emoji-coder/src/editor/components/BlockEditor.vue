<template>
  <div class="block-editor-container">
    <div ref="blocklyDiv" class="blockly-div"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { registerFieldColour } from '@blockly/field-colour';

import { useProjectStore } from '@/shared/stores/projectStore';
import { loadLibrary, compileWorkspaceToAST } from '@/libraries';

const { t, locale, fallbackLocale } = useI18n(); 
const projectStore = useProjectStore();
const blocklyDiv = ref<HTMLElement | null>(null);
let workspace: Blockly.WorkspaceSvg | null = null;

// Função que carrega dinamicamente o arquivo de tradução nativo do Blockly
const loadBlocklyLocale = async (vueLocale: string) => {
  
  // Mapa de Lazy Loading Estático exigido pelo Vite/Rollup.
  // Como o Blockly é uma dependência local do Emoji Coder, mapeamos as chaves do @clic/shared 
  // diretamente para os chunks estáticos do Blockly que o Vite precisa empacotar para Produção.
  const blocklyLocalesMap: Record<string, () => Promise<any>> = {
    'pt-br': () => import('blockly/msg/pt-br'),
    'en': () => import('blockly/msg/en')
  };

  const tryLoad = async (langPath: string) => {
    const loader = blocklyLocalesMap[langPath];
    if (!loader) throw new Error(`[Emoji Coder] Idioma '${langPath}' não mapeado no blocklyLocalesMap.`);
    
    const msgModule = await loader();
    Blockly.setLocale(msgModule.default || msgModule);
  };

  const lowerLocale = vueLocale.toLowerCase();

  try {
    // 1. Tenta a tradução exata do idioma atual (ex: 'pt-br', 'es-es')
    await tryLoad(lowerLocale);
  } catch (error) {
    try {
      // 2. Tenta apenas o prefixo (ex: converte 'es-ar' para 'es')
      const prefix = lowerLocale.split('-')[0];
      if (!prefix) throw new Error('Prefixo de idioma inválido');
      
      await tryLoad(prefix);
    } catch (fallbackError) {
      // 3. Fallback dinâmico usando a Fonte de Verdade da Plataforma (@clic/shared)
      try {
        const fallback = (fallbackLocale.value as string).toLowerCase();
        await tryLoad(fallback);
        console.warn(`[Emoji Coder] Blockly não possui tradução nativa para '${vueLocale}'. Usando fallback da plataforma: '${fallback}'.`);
      } catch (criticalError) {
        console.error(`[Emoji Coder] Falha crítica ao carregar idiomas do Blockly.`, criticalError);
      }
    }
  }

  // --- OVERRIDES CUSTOMIZADOS DA PLATAFORMA CLIC ---
  // Substitui os textos padrões do Blockly pelos termos educacionais solicitados,
  // mantendo compatibilidade com o sistema i18n caso você cadastre essas chaves depois.
  Blockly.Msg['PROCEDURES_DEFNORETURN_TITLE'] = (t('emojiCoder.blocks.define') as string);
};

onMounted(async () => {
  if (!blocklyDiv.value) return;

  // 1. Aguarda o carregamento dinâmico do idioma nativo do Blockly ANTES de injetar
  await loadBlocklyLocale(locale.value);

  // Registra os plugins adicionais do Blockly (como o Seletor de Cores)
  registerFieldColour();

  // 2. Carrega a biblioteca dinâmica usando a função de tradução (t) do @clic/shared
  const libraryId = projectStore.project.config.libraryId || 'turtle-grade-4';
  const activeLibrary = loadLibrary(libraryId, t as any);

  // 3. Injeta o Google Blockly na div
  workspace = Blockly.inject(blocklyDiv.value, {
    toolbox: activeLibrary.getToolboxXml(t as any),
    scrollbars: true,
    trashcan: true,
    theme: Blockly.Themes.Zelos,
  });

  // 3.5 Hidratação Inicial: Carrega blocos salvos do projeto
  if (projectStore.project.blocksWorkspace && Object.keys(projectStore.project.blocksWorkspace).length > 0) {
    Blockly.serialization.workspaces.load(projectStore.project.blocksWorkspace, workspace);
  }

  // 3.6 Fixa o bloco de 'Início' no Workspace caso a tela esteja vazia (Novo Projeto)
  if (!workspace.getTopBlocks(true).some(b => b.type === 'start')) {
    const startBlock = workspace.newBlock('start');
    startBlock.initSvg();
    startBlock.render();
    startBlock.moveBy(40, 40); // Dá uma margem bonita do topo-esquerdo
  }

  // Limpa a memória de Ctrl+Z inicial para o aluno não conseguir apagar o Início
  workspace.clearUndo();

  // 3.7 Atualiza o Toolbox inicial caso o projeto recém-carregado já tenha funções
  workspace.updateToolbox(activeLibrary.getToolboxXml(t as any, workspace));

  // 4. Compilação do AST e Reatividade de Funções
  let previousFunctions = '';
  workspace.addChangeListener((event) => {
    if (event.isUiEvent) return;

    if (workspace) {
      // 1. Gera o AST limpo e unificado
      const ast = compileWorkspaceToAST(workspace);

      // 2. Se a biblioteca exigir um menu dinâmico (Ex: Grade 5), atualiza a Toolbox
      if (activeLibrary.isToolboxDynamic) {
        // Pega qualquer função que o AST tenha lido
        const definedFunctions = Array.from(new Set(
          ast.filter(node => node.isDefinition).map(node => node.definitionName).filter(Boolean)
        )).sort().join(',');

        if (definedFunctions !== previousFunctions) {
          previousFunctions = definedFunctions;
          workspace.updateToolbox(activeLibrary.getToolboxXml(t as any, workspace));
        }
      }

      // 3. Salva no estado silencioso
      const workspaceJson = Blockly.serialization.workspaces.save(workspace);
      projectStore.updateWorkspaceSilent(workspaceJson, ast);
    }
  });
});

onUnmounted(() => {
  if (workspace) workspace.dispose();
});

// --- REATIVIDADE DE IMPORTAÇÃO E NOVO ARQUIVO ---
watch(() => projectStore.project.meta.id, () => {
  if (!workspace) return;
  
  workspace.clear();
  
  if (projectStore.project.blocksWorkspace && Object.keys(projectStore.project.blocksWorkspace).length > 0) {
    // 1. Carrega o projeto importado
    Blockly.serialization.workspaces.load(projectStore.project.blocksWorkspace, workspace);
  } else {
    // 2. Se for um "Novo Projeto" (JSON vazio), cria o bloco Início do zero
    const startBlock = workspace.newBlock('start');
    startBlock.initSvg();
    startBlock.render();
    startBlock.moveBy(40, 40);
  }

  // Define este exato momento como o "Marco Zero" do Histórico
  workspace.clearUndo();
});

// --- REATIVIDADE DE IDIOMA ---
// Escuta as mudanças no seletor de idioma do Header
watch(locale, async (newLocale) => {
  if (!workspace) return;

  // 1. Baixa o dicionário nativo do Blockly para o novo idioma
  await loadBlocklyLocale(newLocale);

  // 2. Recarrega a biblioteca para pegar os novos textos do i18n
  const libraryId = projectStore.project.config.libraryId || 'turtle-grade-4';
  const activeLibrary = loadLibrary(libraryId, t as any);

  // 3. Atualiza o Menu Lateral (Toolbox)
  workspace.updateToolbox(activeLibrary.getToolboxXml(t as any, workspace));

  // 4. "Recarrega" os blocos que já estão no quadro para forçar a tradução visual
  const state = Blockly.serialization.workspaces.save(workspace);
  workspace.clear();
  Blockly.serialization.workspaces.load(state, workspace);
});

// --- HIGHLIGHT DE EXECUÇÃO (DEBUGGER VISUAL) ---
watch(() => projectStore.activeBlockId, (newId) => {
  if (!workspace) return;
  // O Blockly aceita um ID válido para brilhar, ou 'null' para limpar a tela
  workspace.highlightBlock(newId);
});
</script>

<style scoped>
.block-editor-container { width: 100%; height: 100%; position: relative; }
.blockly-div { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
</style>