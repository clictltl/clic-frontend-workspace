import { describe, it, expect } from 'vitest';
import type { ClicAsset } from '../../types/asset';
import { canonicalFileName, useSharedAssetStore } from '../useSharedAssetStore';

// Cabeçalho mínimo de um JPEG/JFIF: o suficiente para o file-type reconhecer
const JPEG_BYTES = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
]);

describe('canonicalFileName', () => {
  it.each([
    ['foto.jfif', 'jpg', 'foto.jpg'],
    ['foto.pjpeg', 'jpg', 'foto.jpg'],
    ['foto.pjp', 'jpg', 'foto.jpg'],
    ['foto.jpe', 'jpg', 'foto.jpg'],
    ['minha.foto.JFIF', 'jpg', 'minha.foto.jpg'],
    ['foto', 'jpg', 'foto.jpg'],
    ['falsa.jpg', 'webp', 'falsa.webp'],
  ])('%s (%s) → %s', (name, ext, expected) => {
    expect(canonicalFileName(name, ext)).toBe(expected);
  });

  it.each([
    ['foto.jpg', 'jpg'],
    ['foto.jpeg', 'jpg'],
    ['foto.JPG', 'jpg'],
    ['foto.png', 'png'],
  ])('mantém %s', (name, ext) => {
    expect(canonicalFileName(name, ext)).toBe(name);
  });
});

describe('addAssetFile', () => {
  function makeStore() {
    const assets: Record<string, ClicAsset> = {};
    const store = useSharedAssetStore({ appName: 'test', getAssets: () => assets, isAssetUsed: () => false });
    return { assets, store };
  }

  it('grava um .jfif como .jpg, com o tipo detectado nos bytes', async () => {
    const { assets, store } = makeStore();
    const file = new File([JPEG_BYTES], 'gato.jfif', { type: '' });

    const id = await store.addAssetFile(file, { allowedMimeTypes: ['image/jpeg'] });

    expect(assets[id]).toMatchObject({ originalName: 'gato.jpg', type: 'image/jpeg' });
  });

  it('não renomeia um .jpeg', async () => {
    const { assets, store } = makeStore();
    const file = new File([JPEG_BYTES], 'gato.jpeg', { type: 'image/jpeg' });

    const id = await store.addAssetFile(file, { allowedMimeTypes: ['image/jpeg'] });

    expect(assets[id]).toMatchObject({ originalName: 'gato.jpeg', type: 'image/jpeg' });
  });
});
