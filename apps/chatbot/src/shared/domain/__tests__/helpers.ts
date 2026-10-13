import type { DomainDeps } from '../deps';
import type { ChatbotProject, ChatNode, NodeType, Variable } from '../../types/chatbot';
import { createNode, createProject } from '../project';
import { addNode } from '../graph';

export const NOW = '2026-01-01T00:00:00.000Z';

/** IDs previsíveis (id-1, id-2...) e `t()` que devolve a chave com os parâmetros. */
export function createDeps(): DomainDeps {
  let counter = 0;
  return {
    newId: () => `id-${++counter}`,
    t: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key)
  };
}

export function setup() {
  const deps = createDeps();
  const project = createProject(deps, NOW);
  const start = Object.values(project.nodes).find(n => n.type === 'start')!;
  const message = Object.values(project.nodes).find(n => n.type === 'message')!;

  const add = <T extends NodeType>(type: T) => {
    const node = createNode(type, { x: 0, y: 0 }, deps);
    addNode(project, node as ChatNode);
    return node;
  };

  const addVariable = (name: string, type: Variable['type'] = 'text'): Variable => {
    const variable: Variable = { id: deps.newId(), name, type, defaultValue: type === 'number' ? 0 : '' };
    project.variables[variable.id] = variable;
    return variable;
  };

  return { deps, project: project as ChatbotProject, start, message, add, addVariable };
}
