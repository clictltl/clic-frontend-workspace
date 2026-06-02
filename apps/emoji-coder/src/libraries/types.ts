// Tipo genérico para a função de tradução (t do vue-i18n)
export type TranslateFn = (key: string) => string;

export interface BlockLibrary {
  id: string;
  name: string;
  getToolboxXml: (t: TranslateFn) => string;
  registerBlocks: (t: TranslateFn) => void;
  registerGenerators: (generator: any) => void;
}