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
import { getLibrary, compileWorkspaceToAST } from '@/libraries';

const { t, locale, fallbackLocale } = useI18n(); 
const projectStore = useProjectStore();
const blocklyDiv = ref<HTMLElement | null>(null);
let workspace: Blockly.WorkspaceSvg | null = null;

const loadBlocklyLocale = async (vueLocale: string) => {
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
    await tryLoad(lowerLocale);
  } catch (error) {
    try {
      const prefix = lowerLocale.split('-')[0];
      if (!prefix) throw new Error('Prefixo de idioma inválido');
      await tryLoad(prefix);
    } catch (fallbackError) {
      try {
        const fallback = (fallbackLocale.value as string).toLowerCase();
        await tryLoad(fallback);
      } catch (criticalError) {
        console.error(`[Emoji Coder] Falha crítica ao carregar idiomas do Blockly.`, criticalError);
      }
    }
  }

  Blockly.Msg['PROCEDURES_DEFNORETURN_TITLE'] = (t('emojiCoder.blocks.define') as string);
};

// --- FUNÇÃO BLINDADA DE RECARREGAMENTO DO WORKSPACE ---
const reloadWorkspace = () => {
  if (!workspace) return;

  const wasClean = !projectStore.hasUnsavedChanges;

  // 1. Pausa o ChangeListener para não sobrescrever a Store enquanto desenhamos os blocos
  Blockly.Events.disable();

  try {
    const libraryId = projectStore.project.config.libraryId || 'turtle-grade-4';
    const activeLibrary = getLibrary(libraryId);
    activeLibrary.registerBlocks(t as any);
    activeLibrary.registerParsers();

    workspace.clear();

    const isTutorial = projectStore.isTutorialMode;
    const currentIdx = projectStore.activeChallengeIndex;
    
    let stateToLoad = null;
    if (isTutorial) {
      stateToLoad = projectStore.project.config.tutorialSavedWorkspaces?.[currentIdx];
    } else {
      stateToLoad = projectStore.project.blocksWorkspace;
    }

    if (stateToLoad && Object.keys(stateToLoad).length > 0) {
      Blockly.serialization.workspaces.load(stateToLoad, workspace);
    } else {
      const startBlock = workspace.newBlock('start');
      startBlock.initSvg();
      startBlock.render();
      startBlock.moveBy(40, 40);
    }

    workspace.clearUndo();
    
    // Atualiza a Toolbox por último, pois ela pode precisar ler as funções recém desenhadas
    workspace.updateToolbox(activeLibrary.getToolboxXml(t as any, workspace));
  } finally {
    // 2. Reativa os eventos e compila o estado inicial correto
    Blockly.Events.enable();
    
    // Forçamos uma compilação inicial silenciosa para garantir que a Store reflita a tela exata
    const ast = compileWorkspaceToAST(workspace);
    const workspaceJson = Blockly.serialization.workspaces.save(workspace);
    projectStore.updateWorkspaceSilent(workspaceJson, ast);

    if (wasClean) {
      projectStore.markAsSaved();
    }
  }
};

onMounted(async () => {
  if (!blocklyDiv.value) return;

  await loadBlocklyLocale(locale.value);
  registerFieldColour();

  // Injeta o Blockly inicialmente VAZIO e Genérico
  workspace = Blockly.inject(blocklyDiv.value, {
    toolbox: '<xml></xml>',
    scrollbars: true,
    trashcan: true,
    theme: Blockly.Themes.Zelos,
    zoom: {
      controls: true,
      wheel: true,
    }
  });

  // O Change Listener fica restrito apenas às interações MANUAIS do usuário
  let previousFunctions = '';
  workspace.addChangeListener((event) => {
    if (event.isUiEvent || event.type === Blockly.Events.FINISHED_LOADING) return;

    if (workspace) {
      const ast = compileWorkspaceToAST(workspace);
      const libraryId = projectStore.project.config.libraryId || 'turtle-grade-4';
      const activeLibrary = getLibrary(libraryId);
      activeLibrary.registerBlocks(t as any);
      activeLibrary.registerParsers();

      if (activeLibrary.isToolboxDynamic) {
        const definedFunctions = Array.from(new Set(
          ast.filter(node => node.isDefinition).map(node => node.definitionName).filter(Boolean)
        )).sort().join(',');

        if (definedFunctions !== previousFunctions) {
          previousFunctions = definedFunctions;
          workspace.updateToolbox(activeLibrary.getToolboxXml(t as any, workspace));
        }
      }

      const workspaceJson = Blockly.serialization.workspaces.save(workspace);
      projectStore.updateWorkspaceSilent(workspaceJson, ast);
    }
  });

  // Dispara o carregamento blindado na montagem
  reloadWorkspace();
});

onUnmounted(() => {
  if (workspace) workspace.dispose();
});

// --- REATIVIDADE COMBINADA DE ROTAS E DESAFIOS ---
// Observamos tanto o ID do projeto quanto o índice do desafio num lugar só!
watch(
  () => [projectStore.project.meta.id, projectStore.activeChallengeIndex],
  () => {
    reloadWorkspace();
  }
);

// --- REATIVIDADE DE IDIOMA ---
watch(locale, async (newLocale) => {
  if (!workspace) return;
  await loadBlocklyLocale(newLocale);
  reloadWorkspace(); // Reutilizamos a lógica blindada para trocar de idioma também!
});

// --- HIGHLIGHT DE EXECUÇÃO (DEBUGGER VISUAL) ---
watch(() => projectStore.activeBlockId, (newId) => {
  if (!workspace) return;
  workspace.highlightBlock(newId);
});
</script>

<style scoped>
.block-editor-container { width: 100%; height: 100%; position: relative; }
.blockly-div { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
</style>