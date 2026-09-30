import { describe, it, expect } from 'vitest';
import { checkVariableName, coerceVariableValue, findVariableByName } from '../variables';
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

  it('finds a variable by name ignoring case', () => {
    const { project, addVariable } = setup();
    const name = addVariable('Nome');
    expect(findVariableByName(project, 'nome')).toBe(name);
    expect(findVariableByName(project, 'outra')).toBeUndefined();
  });
});
