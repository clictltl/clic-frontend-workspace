import type { ChatbotProject } from '../types/chatbot';

export type VariableNameError = 'EMPTY' | 'TAKEN';

/** Valida um nome de variável (sem diferenciar maiúsculas). `exceptId` ignora a própria variável ao renomear. */
export function checkVariableName(project: ChatbotProject, name: string, exceptId?: string): VariableNameError | null {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return 'EMPTY';
  const taken = Object.values(project.variables).some(v => v.id !== exceptId && v.name.trim().toLowerCase() === normalized);
  return taken ? 'TAKEN' : null;
}

export function findVariableByName(project: ChatbotProject, name: string) {
  const normalized = name.trim().toLowerCase();
  return Object.values(project.variables).find(v => v.name.trim().toLowerCase() === normalized);
}
