/**
 * Projeto salvo pelo editor v1 (formato de `apps/chatbot/src/shared/types`).
 * Cobre todos os tipos de bloco e as conversões com regras especiais.
 */
export function v1Project() {
  return {
    uuid: 'project-v1',
    meta: { version: '1.0.0', createdAt: '2025-03-01T10:00:00.000Z', updatedAt: '2025-03-02T10:00:00.000Z' },
    variables: {
      nome: { name: 'nome', type: 'string', value: null },
      idade: { name: 'idade', type: 'number', value: 0 },
      bonus: { name: 'bonus', type: 'number', value: 2 }
    },
    assets: {
      img1: { id: 'img1', type: 'image/png', originalName: 'gato.png', size: 10, hash: 'h1', source: 'remote', url: 'https://site/gato.png' }
    },
    connections: [{ id: 'conn_1', fromBlockId: 'start', toBlockId: 'msg', waypoints: [{ x: 1, y: 2 }] }],
    blocks: [
      { id: 'start', type: 'start', position: { x: 100, y: 120 }, content: '', nextBlockId: 'msg' },
      { id: 'msg', type: 'message', position: { x: 420, y: 180 }, content: '<p>Oi!</p>', nextBlockId: 'ask' },
      { id: 'ask', type: 'openQuestion', position: { x: 740, y: 180 }, content: '<p>Qual é o seu nome?</p>', variableName: 'nome', nextBlockId: 'hello' },
      { id: 'hello', type: 'message', position: { x: 0, y: 400 }, content: '<p>Olá, <strong>{{nome}}</strong>! {{desconhecida}}</p>', nextBlockId: 'pick' },
      {
        id: 'pick', type: 'choiceQuestion', position: { x: 300, y: 400 }, content: '<p>Escolha:</p>',
        choices: [{ id: 'c1', label: 'Gato', nextBlockId: 'img' }, { id: 'c2', label: 'Cão' }]
      },
      { id: 'img', type: 'image', position: { x: 600, y: 400 }, content: 'Imagem', assetId: 'img1', nextBlockId: 'cond' },
      { id: 'img-url', type: 'image', position: { x: 600, y: 600 }, content: 'Imagem', imageUrl: 'https://site/cao.gif' },
      {
        id: 'cond', type: 'condition', position: { x: 900, y: 400 }, content: 'Verificando condição...',
        conditions: [
          { id: 'r1', variableName: 'idade', operator: '>=', value: 18, nextBlockId: 'copy' },
          { id: 'r2', variableName: 'idade', operator: '<', value: 18, nextBlockId: 'ghost' } // destino inexistente
        ]
      },
      { id: 'copy', type: 'setVariable', position: { x: 0, y: 700 }, content: 'Definindo variável...', variableName: 'nome', variableValue: '{{nome}}', nextBlockId: 'mixed' },
      { id: 'mixed', type: 'setVariable', position: { x: 200, y: 700 }, content: '', variableName: 'nome', variableValue: 'Olá {{nome}}', nextBlockId: 'add' },
      { id: 'add', type: 'math', position: { x: 400, y: 700 }, content: 'Operação matemática', variableName: 'idade', mathOperation: '+', mathValue: '{{bonus}}', nextBlockId: 'mul' },
      { id: 'mul', type: 'math', position: { x: 600, y: 700 }, content: '', variableName: 'idade', mathOperation: '*', mathValue: '3', nextBlockId: 'end' },
      { id: 'end', type: 'end', position: { x: 800, y: 700 }, content: '<p>Tchau, {{nome}}</p>' }
    ]
  };
}
