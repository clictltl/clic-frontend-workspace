import { createRichTextExtensions } from '../../shared/richText/extensions';
import { useProjectStore } from '../../shared/stores/projectStore';
import { i18n } from '@clic/shared';

/**
 * Extensões do editor: o nome da variável é lido do store na hora de renderizar.
 * Dentro de um `computed`, essa leitura é reativa (renomear atualiza o texto exibido).
 */
export const editorRichTextExtensions = createRichTextExtensions({
  variableName: id => useProjectStore().project.variables[id]?.name,
  variablePrefix: () => i18n.global.t('chatbot.editor.variable_prefix')
});
