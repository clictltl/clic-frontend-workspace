import { defineStore } from 'pinia';
import type {
  Appearance,
  AssignmentValue,
  ChatbotProject,
  ChatNodeOf,
  ChoiceMedia,
  MathOperator,
  Media,
  NodeMedia,
  NodeType,
  Position,
  RichText,
  Rule,
  Value,
  VariableType
} from '../types/chatbot';
import { appDomainDeps } from '../appDeps';
import * as graph from '../domain/graph';
import { ProjectLoadError, createChoice, createCondition, createNode, createProject, createRule, parseProject } from '../domain/project';
import { checkVariableName, coerceVariableValue } from '../domain/variables';
import { withoutUnusedAssets } from '../domain/usages';

const now = () => new Date().toISOString();

const deps = appDomainDeps;

/**
 * STORE DO PROJETO
 *
 * Cada action tracked é um gesto do aluno: gera uma entrada de undo e um evento
 * de telemetria com o nome da action (regra 6 do CLAUDE.md). Por isso:
 * - uma action nunca chama outra action tracked (seleção e markAsSaved são ignoradas);
 * - textos só chegam aqui confirmados (blur/Enter), nunca a cada tecla;
 * - a regra de negócio fica em `domain/`; aqui só se encaminha.
 */
export const useProjectStore = defineStore('chatbot-project', {
  history: {
    stateKey: 'project',
    telemetry: { appSlug: 'chatbot', sessionActions: ['createNew', 'loadProject'] },
    ignoreActions: ['markAsSaved', 'getProjectData', 'selectNode', 'selectEdge', 'clearSelection'],
    clearHistoryActions: ['createNew', 'loadProject'],
    actionLabels: {
      renameProject: 'chatbot.history.renameProject',
      setAppearance: 'chatbot.history.setAppearance',
      addNode: 'chatbot.history.addNode',
      addConnectedNode: 'chatbot.history.addConnectedNode',
      moveNodes: 'chatbot.history.moveNodes',
      deleteNode: 'chatbot.history.deleteNode',
      setNodeContent: 'chatbot.history.setNodeContent',
      setNodeMedia: 'chatbot.history.setNodeMedia',
      setMediaPosition: 'chatbot.history.setMediaPosition',
      setMessageDelay: 'chatbot.history.setMessageDelay',
      connect: 'chatbot.history.connect',
      disconnect: 'chatbot.history.disconnect',
      setEdgeColor: 'chatbot.history.setEdgeColor',
      addChoice: 'chatbot.history.addChoice',
      renameChoice: 'chatbot.history.renameChoice',
      setChoiceMedia: 'chatbot.history.setChoiceMedia',
      removeChoice: 'chatbot.history.removeChoice',
      addRule: 'chatbot.history.addRule',
      removeRule: 'chatbot.history.removeRule',
      setRuleMatch: 'chatbot.history.setRuleMatch',
      addCondition: 'chatbot.history.addCondition',
      updateCondition: 'chatbot.history.updateCondition',
      removeCondition: 'chatbot.history.removeCondition',
      setAnswerVariable: 'chatbot.history.setAnswerVariable',
      setAssignment: 'chatbot.history.setAssignment',
      setMathOperation: 'chatbot.history.setMathOperation',
      addVariable: 'chatbot.history.addVariable',
      renameVariable: 'chatbot.history.renameVariable',
      setVariableDefault: 'chatbot.history.setVariableDefault',
      deleteVariable: 'chatbot.history.deleteVariable'
    }
  },

  state: () => {
    const initialProject = createProject(deps, now());
    return {
      project: initialProject as ChatbotProject,
      lastSavedState: JSON.stringify(initialProject),
      // Estado volátil de UI (fora do JSON)
      selectedNodeId: null as string | null,
      selectedEdgeId: null as string | null
    };
  },

  getters: {
    hasUnsavedChanges: (state) => JSON.stringify(state.project) !== state.lastSavedState,
    activeNode: (state) => (state.selectedNodeId ? state.project.nodes[state.selectedNodeId] ?? null : null),
    activeEdge: (state) => (state.selectedEdgeId ? state.project.edges[state.selectedEdgeId] ?? null : null)
  },

  actions: {
    /** JSON portável para salvar/exportar (regra 1): cópia sem arquivos que nenhum nó usa. */
    getProjectData(): ChatbotProject {
      return withoutUnusedAssets(this.project);
    },

    // --- SESSÃO (iniciam o Frame Zero da telemetria) ---
    markAsSaved() {
      this.project.meta.updatedAt = now();
      this.lastSavedState = JSON.stringify(this.project);
    },

    createNew() {
      this.project = createProject(deps, now());
      this.selectedNodeId = null;
      this.selectedEdgeId = null;
      this.lastSavedState = JSON.stringify(this.project);
    },

    /**
     * Lança `ProjectLoadError` (sem trocar o projeto atual) se o JSON for inválido ou de outra versão.
     * Lançar, e não retornar o erro, evita que o plugin de histórico inicie uma sessão de telemetria.
     */
    loadProject(json: unknown, markAsUnsaved = false) {
      const result = parseProject(json, deps, now());
      if (!result.ok) throw new ProjectLoadError(result.error);

      this.project = result.project;
      this.selectedNodeId = null;
      this.selectedEdgeId = null;
      // Projeto convertido do v1 abre como alterado: salvar grava o formato novo no mesmo registro
      const unsaved = markAsUnsaved || !!result.migration;
      this.lastSavedState = unsaved ? 'FORCED_UNSAVED' : JSON.stringify(this.project);
      return result.migration ?? null;
    },

    // --- SELEÇÃO (ignoradas pelo histórico) ---
    selectNode(id: string | null) {
      this.selectedNodeId = id;
      if (id) this.selectedEdgeId = null;
    },

    selectEdge(id: string | null) {
      this.selectedEdgeId = id;
      if (id) this.selectedNodeId = null;
    },

    clearSelection() {
      this.selectedNodeId = null;
      this.selectedEdgeId = null;
    },

    renameProject(title: string) {
      this.project.title = title;
    },

    setAppearance(changes: Partial<Appearance>) {
      Object.assign(this.project.appearance, changes);
    },

    // --- NÓS ---
    addNode(type: NodeType, position: Position) {
      const node = createNode(type, position, deps);
      graph.addNode(this.project, node);
      this.selectedNodeId = node.id;
      this.selectedEdgeId = null;
      return node.id;
    },

    /** Cria o bloco já ligado a uma saída (conexão solta no vazio): um gesto, um desfazer. */
    addConnectedNode(type: NodeType, position: Position, sourceNode: string, sourceHandle: string) {
      const node = createNode(type, position, deps);
      graph.addNode(this.project, node);
      graph.connect(this.project, sourceNode, sourceHandle, node.id);
      this.selectedNodeId = node.id;
      this.selectedEdgeId = null;
      return node.id;
    },

    moveNodes(moves: { id: string; position: Position }[]) {
      graph.moveNodes(this.project, moves);
    },

    deleteNode(id: string) {
      if (!graph.deleteNode(this.project, id)) return false;
      if (this.selectedNodeId === id) this.selectedNodeId = null;
      if (this.selectedEdgeId && !this.project.edges[this.selectedEdgeId]) this.selectedEdgeId = null;
      return true;
    },

    setNodeContent(id: string, content: RichText) {
      const node = this.project.nodes[id];
      if (node && 'content' in node.data) node.data.content = content;
    },

    /** Um arquivo enviado já está em `project.assets` (assetStore); entra no diff desta action. */
    setNodeMedia(id: string, media: Media | null) {
      return graph.setNodeMedia(this.project, id, media);
    },

    setMediaPosition(id: string, position: NodeMedia['position']) {
      graph.setMediaPosition(this.project, id, position);
    },

    setMessageDelay(id: string, seconds: number) {
      graph.setMessageDelay(this.project, id, seconds);
    },

    // --- CONEXÕES ---
    connect(sourceNode: string, sourceHandle: string, targetNode: string) {
      return graph.connect(this.project, sourceNode, sourceHandle, targetNode);
    },

    disconnect(id: string) {
      if (!graph.disconnect(this.project, id)) return false;
      if (this.selectedEdgeId === id) this.selectedEdgeId = null;
      return true;
    },

    setEdgeColor(id: string, color: string) {
      graph.setEdgeColor(this.project, id, color);
    },

    // --- MÚLTIPLA ESCOLHA ---
    addChoice(nodeId: string) {
      const node = graph.getNodeOfType(this.project, nodeId, 'choice_question');
      if (!node) return;
      graph.addChoice(this.project, nodeId, createChoice(deps, node.data.choices.length + 1));
    },

    renameChoice(nodeId: string, choiceId: string, label: string) {
      graph.renameChoice(this.project, nodeId, choiceId, label);
    },

    /** Um arquivo enviado já está em `project.assets` (assetStore); entra no diff desta action. */
    setChoiceMedia(nodeId: string, choiceId: string, media: ChoiceMedia | null) {
      return graph.setChoiceMedia(this.project, nodeId, choiceId, media);
    },

    removeChoice(nodeId: string, choiceId: string) {
      return graph.removeChoice(this.project, nodeId, choiceId);
    },

    // --- CONDIÇÃO ---
    addRule(nodeId: string) {
      graph.addRule(this.project, nodeId, createRule(deps));
    },

    removeRule(nodeId: string, ruleId: string) {
      return graph.removeRule(this.project, nodeId, ruleId);
    },

    setRuleMatch(nodeId: string, ruleId: string, match: Rule['match']) {
      graph.setRuleMatch(this.project, nodeId, ruleId, match);
    },

    addCondition(nodeId: string, ruleId: string) {
      graph.addCondition(this.project, nodeId, ruleId, createCondition(deps));
    },

    updateCondition(nodeId: string, ruleId: string, conditionId: string, changes: Parameters<typeof graph.updateCondition>[4]) {
      graph.updateCondition(this.project, nodeId, ruleId, conditionId, changes);
    },

    removeCondition(nodeId: string, ruleId: string, conditionId: string) {
      return graph.removeCondition(this.project, nodeId, ruleId, conditionId);
    },

    // --- DEMAIS NÓS ---
    setAnswerVariable(nodeId: string, variableId: string | null) {
      const node = graph.getNodeOfType(this.project, nodeId, 'open_question');
      if (node) node.data.variableId = variableId;
    },

    setAssignment(nodeId: string, changes: Partial<{ variableId: string | null; value: AssignmentValue }>) {
      const node = graph.getNodeOfType(this.project, nodeId, 'set_variable');
      if (node) Object.assign(node.data, changes);
    },

    setMathOperation(nodeId: string, changes: Partial<{ variableId: string | null; operator: MathOperator; operand: Value }>) {
      const node: ChatNodeOf<'math'> | null = graph.getNodeOfType(this.project, nodeId, 'math');
      if (node) Object.assign(node.data, changes);
    },

    // --- VARIÁVEIS ---
    /** Retorna o ID criado, ou null se o nome for vazio/repetido. */
    addVariable(name: string, type: VariableType = 'text') {
      if (checkVariableName(this.project, name)) return null;
      const id = deps.newId();
      this.project.variables[id] = { id, name: name.trim(), type, defaultValue: type === 'number' ? 0 : '' };
      return id;
    },

    renameVariable(id: string, name: string) {
      const variable = this.project.variables[id];
      if (!variable || checkVariableName(this.project, name, id)) return false;
      variable.name = name.trim();
      return true;
    },

    setVariableDefault(id: string, raw: string) {
      const variable = this.project.variables[id];
      if (variable) variable.defaultValue = coerceVariableValue(variable.type, raw);
    },

    /** As referências continuam nos nós; a validação do fluxo aponta onde corrigir. */
    deleteVariable(id: string) {
      delete this.project.variables[id];
    }
  }
});
