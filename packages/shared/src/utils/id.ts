import { v4 as uuidv4 } from 'uuid';

/**
 * Gera um identificador único universal (UUID v4).
 * Abstraído aqui para que os apps não dependam diretamente da biblioteca 'uuid'.
 */
export function generateUUID(): string {
  return uuidv4();
}