/**
 * Versão do app em execução, gravada no build (ver packages/shared/build/appBuildInfo.ts).
 * Fora de um build com o helper (ex.: testes), devolve null.
 */
export interface AppVersionInfo { version: string; commit: string; buildDate: string }

export function getAppVersionInfo(): AppVersionInfo | null {
  if (typeof __APP_VERSION__ === 'undefined') return null;
  return {
    version: __APP_VERSION__,
    commit: typeof __APP_COMMIT__ === 'undefined' ? 'unknown' : __APP_COMMIT__,
    buildDate: typeof __APP_BUILD_DATE__ === 'undefined' ? '' : __APP_BUILD_DATE__
  };
}
