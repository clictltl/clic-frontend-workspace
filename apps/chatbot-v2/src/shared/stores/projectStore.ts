import { defineStore } from 'pinia';
import { generateUUID, i18n } from '@clic/shared';
import type {
  ChatbotProject,
  ChatNodeOf,
  MathOperator,
  NodeType,
  Position,
  RichText,
  Rule,
  Value,
  VariableType
} from '../types/chatbot';
import type { DomainDeps } from '../domain/deps';
import * as graph from '../domain/graph';
import { createChoiceLabel, createCondition, createNode, createProject, createRule, parseProject } from '../domain/project';
import { checkVariableName } from '../domain/variables';

const now = () => new Date().toISOString();

const deps: DomainDeps = {
  newId: generateUUID,
  t: (key, params) => i18n.global.t(key, params ?? {})
};

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
    ignoreActions: ['markAsSaved', 'selectNode', 'selectEdge', 'clearSelection'],
    clearHistoryActions: ['createNew', 'loadProject'],
    actionLabels: {
      renameProject: 'chatbot.history.renameProject',
      addNode: 'chatbot.history.addNode',
      moveNodes: 'chatbot.history.moveNodes',
      deleteNode: 'chatbot.history.deleteNode',
      setNodeContent: 'chatbot.history.setNodeContent',
      connect: 'chatbot.history.connect',
      disconnect: 'chatbot.history.disconnect',
      setEdgeColor: 'chatbot.history.setEdgeColor',
      addChoice: 'chatbot.history.addChoice',
      renameChoice: 'chatbot.history.renameChoice',
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

    /** Retorna o erro sem trocar o projeto atual se o JSON for inválido ou de outra versão. */
    loadProject(json: unknown, markAsUnsaved = false) {
      const result = parseProject(json, deps, now());
      if (!result.ok) return result.error;

      this.project = result.project;
      this.selectedNodeId = null;
      this.selectedEdgeId = null;
      this.lastSavedState = markAsUnsaved ? 'FORCED_UNSAVED' : JSON.stringify(this.project);
      return null;
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

    // --- NÓS ---
    addNode(type: NodeType, position: Position) {
      const node = createNode(type, position, deps);
      graph.addNode(this.project, node);
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
      graph.addChoice(this.project, nodeId, { id: deps.newId(), label: createChoiceLabel(deps, node.data.choices.length + 1) });
    },

    renameChoice(nodeId: string, choiceId: string, label: string) {
      graph.renameChoice(this.project, nodeId, choiceId, label);
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

    setAssignment(nodeId: string, changes: Partial<{ variableId: string | null; value: Value }>) {
      const node = graph.getNodeOfType(this.project, nodeId, 'set_variable');
      if (node) Object.assign(node.data, changes);
    },

    setMathOperation(nodeId: string, changes: Partial<{ variableId: string | null; operator: MathOperator; operand: Value }>) {
      const node: ChatNodeOf<'math'> | null = graph.getNodeOfType(this.project, nodeId, 'math');
      if (node) Object.assign(node.data, changes);
    },

    // --- VARIÁVEIS ---
    /** Retorna o ID criado, ou null se o nome for vazio/repetido. */
    addVariable(name: string, type: VariableType) {
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

    /** As referências continuam nos nós; a validação do fluxo aponta onde corrigir. */
    deleteVariable(id: string) {
      delete this.project.variables[id];
    }
  }
});
