import { createReadStream, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Mídia do Blockly (sprites da lixeira e do zoom, sons, cursores, ícones de comentário) servida
 * pelo próprio app. Sem a opção `media`, o Blockly busca em blockly-demo.appspot.com, que saiu do ar.
 * - build: copia node_modules/blockly/media para assets/blockly-media/ (ao lado dos chunks).
 * - dev: serve a mesma pasta em {base}blockly-media/.
 * - offline (single-file): não copia nada; a mídia fica de fora (`media` indefinido).
 * Uso em um app com Blockly: registrar `blocklyMedia({ offline })` nos plugins do vite.config.ts e
 * passar `...blocklyMediaOptions` (de '@clic/shared/src/blockly/media') no Blockly.inject.
 * Se usar PWA, incluir 'assets/blockly-media/*' no globPatterns do Workbox.
 */
const VIRTUAL_ID = 'virtual:blockly-media';
const RESOLVED_ID = '\0' + VIRTUAL_ID;
const DIR = 'blockly-media/';

// Resolvido a partir da raiz do app, para usar a versão do Blockly que o próprio app instalou
const findMediaDir = (appRoot: string) =>
  join(dirname(createRequire(join(appRoot, 'package.json')).resolve('blockly')), 'media');
const listFiles = (dir: string) => readdirSync(dir).filter((f) => statSync(join(dir, f)).isFile());

const MIME: Record<string, string> = {
  png: 'image/png', svg: 'image/svg+xml', gif: 'image/gif', mp3: 'audio/mpeg', cur: 'image/x-icon'
};

export function blocklyMedia({ offline }: { offline: boolean }): Plugin {
  let command: 'build' | 'serve' = 'build';
  let base = '/';
  let assetsDir = 'assets';
  let mediaDir = '';

  return {
    name: 'clic-blockly-media',
    configResolved(config) {
      command = config.command;
      base = config.base;
      assetsDir = config.build.assetsDir;
      mediaDir = findMediaDir(config.root);
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      if (command === 'serve') return `export default ${JSON.stringify(base + DIR)};`;
      if (offline) return 'export default undefined;';
      // Os chunks ficam em assets/, ao lado da pasta copiada. Funciona com base relativa (WordPress)
      // e absoluta (GitHub). A variável evita que o Vite trate o new URL() como import de asset.
      return `const dir = ${JSON.stringify(DIR)};\nexport default new URL(dir, import.meta.url).href;`;
    },
    configureServer(server) {
      server.middlewares.use(base + DIR, (req, res, next) => {
        const name = decodeURIComponent((req.url ?? '').split('?')[0].replace(/^\//, ''));
        if (!listFiles(mediaDir).includes(name)) return next();
        res.setHeader('Content-Type', MIME[name.split('.').pop() ?? ''] ?? 'application/octet-stream');
        createReadStream(join(mediaDir, name)).pipe(res);
      });
    },
    generateBundle() {
      if (offline) return;
      for (const name of listFiles(mediaDir)) {
        this.emitFile({ type: 'asset', fileName: `${assetsDir}/${DIR}${name}`, source: readFileSync(join(mediaDir, name)) });
      }
    }
  };
}
