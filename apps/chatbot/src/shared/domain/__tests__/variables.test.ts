import { describe, it, expect } from 'vitest';
import { checkVariableName, coerceVariableValue, findVariableByName, parseNumber } from '../variables';
import { setup } from './helpers';

describe('variable names', () => {
  it('rejects empty and duplicated names ignoring case and spaces', () => {
    const { project, addVariable } = setup();
    const name = addVariable('Nome');

    expect(checkVariableName(project, '   ')).toBe('EMPTY');
    expect(checkVariableName(project, ' nome ')).toBe('TAKEN');
    expect(checkVariableName(project, 'idade')).toBeNull();
    expect(checkVariableName(project, 'NOME', name.id)).toBeNull();
  });

  it('coerces typed values to the variable type', () => {
    expect(coerceVariableValue('text', 42)).toBe('42');
    expect(coerceVariableValue('number', ' 3,5 ')).toBe(3.5);
    expect(coerceVariableValue('number', 'abc')).toBe(0);
    expect(coerceVariableValue('number', '')).toBe(0);
  });

  it('parses numbers with a single decimal separator (dot or comma)', () => {
    expect(parseNumber('10')).toBe(10);
    expect(parseNumber(' -3 ')).toBe(-3);
    expect(parseNumber('1,5')).toBe(1.5);
    expect(parseNumber('1.5')).toBe(1.5);
    expect(parseNumber('1.000')).toBe(1); // Sem separador de milhar
    expect(parseNumber(7)).toBe(7);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('1.000,50')).toBeNull();
    expect(parseNumber('.5')).toBeNull();
    expect(parseNumber(Number.NaN)).toBeNull();
  });

  it('finds a variable by name ignoring case', () => {
    const { project, addVariable } = setup();
    const name = addVariable('Nome');
    expect(findVariableByName(project, 'nome')).toBe(name);
    expect(findVariableByName(project, 'outra')).toBeUndefined();
  });
});
