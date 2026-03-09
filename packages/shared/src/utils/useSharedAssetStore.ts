import { reactive } from 'vue';
import imageCompression from 'browser-image-compression';
import { fileTypeFromBlob } from 'file-type';
import type { ClicAsset } from '../types/asset';

// --- REGISTRO EM MEMÓRIA (Global para a sessão atual) ---
const blobRegistry = reactive<Record<string, string>>({});

export interface UseAssetStoreOptions {
  appName: string; // Ex: 'chatbot' ou 'graph-builder' (Para isolar os IndexedDBs)
  getAssets: () => Record<string, ClicAsset>; // Função que retorna o estado atual (dicionário de assets do App)
  isAssetUsed: (assetId: string, excludeElementId?: string) => boolean; // App diz se o asset tá em uso
}

export interface AddAssetOptions {
  allowedMimeTypes?: string[]; // Ex:['image/jpeg', 'text/markdown', 'audio/mp3']
  maxSizeMB?: number;          // Tamanho máximo permitido para este upload
  compressImages?: boolean;    // Se true, tenta comprimir imagens grandes
}

// Helper para calcular o SHA-256
async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useSharedAssetStore(config: UseAssetStoreOptions) {
  const DB_NAME = `ClicAssets_${config.appName}`;
  const STORE_NAME = 'local_blobs';
  const DB_VERSION = 1;

  function getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // --- VALIDAÇÃO PREPARADA PARA O FUTURO (TEXTOS, VÍDEOS, ÁUDIOS) ---
  async function validateFileSecurity(file: File, allowedMimes?: string[]): Promise<string> {
    // Arquivos de texto (.md, .txt, .csv, json) não possuem Magic Numbers binários.
    // Confiamos no MIME reportado pelo navegador, pois texto não é executável por si só.
    const isTextBased = file.type.startsWith('text/') || file.type === 'application/json';
    
    let detectedMime = file.type;

    if (!isTextBased) {
      const typeInfo = await fileTypeFromBlob(file);
      if (typeInfo) {
        detectedMime = typeInfo.mime;
      } else if (file.size > 0) {
        throw new Error('Formato de arquivo inválido ou não reconhecido por motivos de segurança.');
      }
    }

    if (allowedMimes && allowedMimes.length > 0) {
      if (!allowedMimes.includes(detectedMime)) {
        throw new Error(`Tipo de arquivo não permitido. Detectado: ${detectedMime}`);
      }
    }

    return detectedMime;
  }

  /**
   * Adiciona um novo arquivo, validando, comprimindo (opcional) e desduplicando.
   */
  async function addAssetFile(file: File, options: AddAssetOptions = {}): Promise<string> {
    const {
      allowedMimeTypes =[],
      maxSizeMB = 5,
      compressImages = true
    } = options;

    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // 1. Segurança e Tipo Real
    const realMime = await validateFileSecurity(file, allowedMimeTypes);
    let finalFile = file;

    // 2. Tamanho e Compressão (Apenas para imagens)
    if (file.size > maxSizeBytes) {
      const isImage = realMime.startsWith('image/');
      const isCompressible = isImage && realMime !== 'image/gif' && realMime !== 'image/svg+xml';

      if (isCompressible && compressImages) {
        try {
          const compressedBlob = await imageCompression(file, {
            maxSizeMB: maxSizeMB,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: 'image/webp',
            initialQuality: 0.8
          });

          if (compressedBlob.size < maxSizeBytes) {
            finalFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: 'image/webp',
              lastModified: Date.now()
            });
          } else {
            throw new Error(`O arquivo continua muito grande após compressão (${(compressedBlob.size/1024/1024).toFixed(1)}MB).`);
          }
        } catch (err: any) {
          throw new Error(`Erro ao comprimir imagem: ${err.message}`);
        }
      } else {
        throw new Error(`Arquivo muito grande (${(file.size/1024/1024).toFixed(1)}MB). O limite é ${maxSizeMB}MB.`);
      }
    }

    // 3. Desduplicação (Procura via Hash)
    const fileHash = await computeFileHash(finalFile);
    const assets = config.getAssets();
    
    for (const existingId in assets) {
      const asset = assets[existingId];
      if (asset && asset.hash === fileHash) {
        if (blobRegistry[existingId] || asset.source === 'remote') {
          return existingId; // Já existe, reaproveita!
        }
      }
    }

    // 4. Registra
    const assetId = crypto.randomUUID();
    const blobUrl = URL.createObjectURL(finalFile);
    blobRegistry[assetId] = blobUrl;

    assets[assetId] = {
      id: assetId,
      type: finalFile.type,
      originalName: finalFile.name,
      size: finalFile.size,
      hash: fileHash,
      source: 'local'
    };

    return assetId;
  }

  function deleteAssetIfUnused(assetId: string, excludeElementId?: string) {
    if (config.isAssetUsed(assetId, excludeElementId)) {
      return; 
    }

    const assets = config.getAssets();
    if (assets[assetId]) {
      delete assets[assetId];
      
      if (blobRegistry[assetId]) {
        URL.revokeObjectURL(blobRegistry[assetId]);
        delete blobRegistry[assetId];
      }
    }
  }

  function getAssetSrc(assetId: string): string | undefined {
    if (blobRegistry[assetId]) return blobRegistry[assetId];
    
    const asset = config.getAssets()[assetId];
    if (asset?.source === 'remote' && asset.url) {
      return asset.url;
    }
    return undefined;
  }

  function registerBlob(assetId: string, blob: Blob) {
    blobRegistry[assetId] = URL.createObjectURL(blob);
  }

  async function getAssetBlob(assetId: string): Promise<Blob | null> {
    const url = blobRegistry[assetId];
    if (!url) return null;
    try {
      return await (await fetch(url)).blob();
    } catch {
      return null;
    }
  }

  function clearRegistry() {
    Object.values(blobRegistry).forEach(url => URL.revokeObjectURL(url));
    Object.keys(blobRegistry).forEach(key => delete blobRegistry[key]);
  }

  async function persistToDisk() {
    const assets = config.getAssets();
    const localAssets = Object.values(assets).filter(a => a.source === 'local');
    if (localAssets.length === 0) return;

    const blobsToSave: { id: string; blob: Blob }[] =[];
    for (const asset of localAssets) {
      const blob = await getAssetBlob(asset.id);
      if (blob) blobsToSave.push({ id: asset.id, blob });
    }

    if (blobsToSave.length === 0) return;

    const db = await getDB();
    const txClear = db.transaction(STORE_NAME, 'readwrite');
    txClear.objectStore(STORE_NAME).clear();
    await new Promise(resolve => { txClear.oncomplete = resolve; });

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const item of blobsToSave) {
      store.put(item.blob, item.id);
    }

    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function restoreFromDisk() {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAllKeys();

    const keys = await new Promise<string[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });

    for (const key of keys) {
      const getReq = store.get(key);
      const blob = await new Promise<Blob>((resolve) => {
        getReq.onsuccess = () => resolve(getReq.result);
      });
      if (blob) registerBlob(key, blob);
    }
  }

  async function clearDisk() {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function privatizeRemoteAssets() {
    const assets = config.getAssets();
    const promises = Object.entries(assets).map(async ([id, asset]) => {
      if (asset.source !== 'remote' || !asset.url) return;
      try {
        const res = await fetch(asset.url);
        if (!res.ok) throw new Error('Falha no download');
        const blob = await res.blob();
        registerBlob(id, blob);
        asset.source = 'local';
        delete asset.url;
        delete asset.externalId;
      } catch (err) {
        console.error(`Erro ao privatizar asset ${asset.originalName}`, err);
      }
    });
    await Promise.all(promises);
  }

  return {
    addAssetFile,
    deleteAssetIfUnused,
    getAssetSrc,
    registerBlob,
    getAssetBlob,
    clearRegistry,
    persistToDisk,
    restoreFromDisk,
    clearDisk,
    privatizeRemoteAssets
  };
}