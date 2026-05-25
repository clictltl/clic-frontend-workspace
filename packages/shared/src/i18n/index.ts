import { createI18n } from 'vue-i18n';
import ptBR from './locales/pt-BR';
import en from './locales/en';

// Feature Flag para exibir ou ocultar o seletor no Header na produção
export const ENABLE_LANGUAGE_SWITCHER = false; // TODO: Mudar para true quando a tradução do 'en' estiver pronta

// 1. A Fonte Única de Verdade (Adicione novos idiomas APENAS aqui!)
const localesConfig = {
  'pt-BR': { label: 'Português (Brasil)', prefix: 'pt', messages: ptBR },
  'en': { label: 'English', prefix: 'en', messages: en }
} as const;

// 2. Tipos e Listas Dinâmicas (Derivados automaticamente)
export type SupportedLocales = keyof typeof localesConfig;

export const availableLocales = Object.entries(localesConfig).map(([code, config]) => ({
  code: code as SupportedLocales,
  label: config.label
}));

// Função auxiliar (Type Guard) para verificar se a string é um idioma válido
const isValidLocale = (code: any): code is SupportedLocales => code in localesConfig;

function getInitialLocale(): SupportedLocales {
  // 1. Prioridade Máxima: localStorage
  const storedLocale = localStorage.getItem('clic_user_locale');
  if (isValidLocale(storedLocale)) return storedLocale;

  // 2. Prioridade Média: window.CLIC_CORE (Injetado pelo WordPress)
  const wpLocale = window.CLIC_CORE?.locale;
  if (isValidLocale(wpLocale)) return wpLocale;

  // 3. Prioridade Baixa: Idioma nativo do Navegador (para o GH Pages)
  const navLocale = navigator.language;
  for (const [code, config] of Object.entries(localesConfig)) {
    if (navLocale.startsWith(config.prefix)) {
      return code as SupportedLocales;
    }
  }

  // 4. Último Recurso: Fallback rígido
  return 'pt-BR';
}

// Monta o objeto de 'messages' para o vue-i18n automaticamente
const messages = Object.fromEntries(
  Object.entries(localesConfig).map(([code, config]) => [code, config.messages])
);

export const i18n = createI18n({
  legacy: false, // Habilita o uso da Composition API (useI18n)
  locale: getInitialLocale(),
  fallbackLocale: 'pt-BR',
  messages
});

// Função utilitária para trocar o idioma e garantir a persistência local
export function setLocale(locale: SupportedLocales) {
  // Atualiza a interface instantaneamente
  (i18n.global.locale as any).value = locale;
  
  // Persiste no navegador
  localStorage.setItem('clic_user_locale', locale);
  
  // Atualiza a tag <html> para acessibilidade (leitores de tela)
  document.documentElement.lang = locale;
}