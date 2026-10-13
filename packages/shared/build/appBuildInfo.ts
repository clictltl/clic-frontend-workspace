import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

/**
 * Versão do app no build (usado pelos vite.config.ts de cada app, roda no Node).
 * - `version`: do package.json do app; sobe a cada publicação (`npm version patch|minor|major -w apps/<app>`).
 * - `commit`: commit curto do build; termina com "+" se havia alterações não commitadas.
 * - `buildDate`: data e hora do build (ISO).
 * Vira as constantes globais __APP_VERSION__, __APP_COMMIT__ e __APP_BUILD_DATE__
 * (lidas por getAppBuildInfo em @clic/shared) e o arquivo dist/version.json.
 */
export interface AppBuildInfo { app: string; version: string; commit: string; buildDate: string }

function git(command: string): string {
  try {
    return execSync(`git ${command}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return ''; // Sem git (ex.: código baixado em zip)
  }
}

export function readAppBuildInfo(packageJsonUrl: URL): AppBuildInfo {
  const pkg = JSON.parse(readFileSync(packageJsonUrl, 'utf8')) as { name: string; version: string };
  const hash = git('rev-parse --short HEAD');
  const dirty = hash && git('status --porcelain') !== '';
  return {
    app: pkg.name,
    version: pkg.version,
    commit: hash ? `${hash}${dirty ? '+' : ''}` : 'unknown',
    buildDate: new Date().toISOString()
  };
}

/** `define` com as constantes e o plugin que grava dist/version.json. */
export function appBuildInfo(packageJsonUrl: URL): { define: Record<string, string>; plugin: Plugin } {
  const info = readAppBuildInfo(packageJsonUrl);
  return {
    define: {
      __APP_VERSION__: JSON.stringify(info.version),
      __APP_COMMIT__: JSON.stringify(info.commit),
      __APP_BUILD_DATE__: JSON.stringify(info.buildDate)
    },
    plugin: {
      name: 'clic-app-build-info',
      apply: 'build',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify(info, null, 2) + '\n' });
      }
    }
  };
}
