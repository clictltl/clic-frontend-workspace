import type { ChatbotProject, VariableType } from '../types/chatbot';

const NUMBER_PATTERN = /^[+-]?\d+([.,]\d+)?$/;

/**
 * Lê um número digitado, independente do idioma: aceita um único separador decimal (`.` ou `,`)
 * e não aceita separador de milhar (`"1.000"` é 1). Texto vazio ou não numérico vira `null`.
 */
export function parseNumber(raw: string | number): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const text = raw.trim();
  if (!NUMBER_PATTERN.test(text)) return null;
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

/** Converte um valor digitado para o tipo da variável (número inválido vira 0). */
export function coerceVariableValue(type: VariableType, raw: string | number): string | number {
  if (type === 'text') return String(raw);
  return parseNumber(raw) ?? 0;
}

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
