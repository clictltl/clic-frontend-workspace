import { describe, it, expect } from 'vitest';
import { checkVariableName, findVariableByName } from '../variables';
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

  it('finds a variable by name ignoring case', () => {
    const { project, addVariable } = setup();
    const name = addVariable('Nome');
    expect(findVariableByName(project, 'nome')).toBe(name);
    expect(findVariableByName(project, 'outra')).toBeUndefined();
  });
});
