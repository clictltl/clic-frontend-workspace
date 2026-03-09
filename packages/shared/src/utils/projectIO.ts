import JSZip from 'jszip';
import type { ClicAsset } from '../types/asset';

interface ExportOptions {
  filename?: string;
  extension?: string;
}

/**
 * EXPORTAR: Gera um arquivo ZIP contendo project.json e a pasta assets/ offline
 */
export async function exportClicFile(
  projectData: any, // O JSON do projeto
  assetStore: any,  // A instância do useSharedAssetStore
  options: ExportOptions = {}
) {
  const { filename = 'projeto', extension = '.clic' } = options;
  
  // Clona o projeto para não mutar o estado vivo da aplicação
  const projectToSave = JSON.parse(JSON.stringify(projectData));
  
  const zip = new JSZip();
  const assetsFolder = zip.folder('assets');

  // Processar Assets (Local e Remoto) para deixar o arquivo 100% Offline
  if (projectToSave.assets && assetsFolder) {
    const assetPromises = Object.entries(projectToSave.assets).map(async ([id, asset]: [string, any]) => {
      try {
        let blob: Blob | null = null;

        // Se é local, pega do IndexedDB/Memória
        if (asset.source === 'local') {
          blob = await assetStore.getAssetBlob(id);
        }
        // Se é remoto, baixa agora para embutir no arquivo
        else if (asset.source === 'remote' && asset.url) {
          const res = await fetch(asset.url);
          if (res.ok) {
            blob = await res.blob();
            asset.source = 'local';
            delete asset.url;
            delete asset.externalId;
          }
        }

        // Salva o binário no ZIP
        if (blob) {
          // Usa extensão segura (ex: png, jpeg) ou fallback para bin
          const ext = asset.type?.split('/')[1] || 'bin';
          assetsFolder.file(`${id}.${ext}`, blob);
        }
      } catch (err) {
        console.error(`Erro ao processar asset ${id} para exportação:`, err);
      }
    });

    await Promise.all(assetPromises);
  }

  // Salva o JSON limpo
  zip.file('project.json', JSON.stringify(projectToSave, null, 2));

  // Gerar e Baixar
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * IMPORTAR: Lê um arquivo ZIP/JSON, hidrata os assets e devolve o projeto
 */
export async function importClicFile(
  file: File,
  assetStore: any,
): Promise<any> {
  
  // Retrocompatibilidade: Se for apenas um JSON antigo
  if (file.type === 'application/json' || file.name.endsWith('.json')) {
    const text = await file.text();
    return JSON.parse(text);
  }

  const zip = await JSZip.loadAsync(file);
  
  const jsonFile = zip.file('project.json');
  if (!jsonFile) throw new Error('Arquivo project.json não encontrado no pacote.');
  
  const jsonStr = await jsonFile.async('string');
  const project = JSON.parse(jsonStr);

  if (!project.assets) project.assets = {};

  // Limpa os assets da memória atual antes de injetar os novos
  assetStore.clearRegistry();

  // Hidratar os arquivos reais do ZIP para a memória do navegador
  const assetsFolder = zip.folder('assets');
  if (assetsFolder && project.assets) {
    for (const [id, asset] of Object.entries(project.assets) as [string, ClicAsset][]) {
      if (asset.source === 'local') {
        const ext = asset.type?.split('/')[1] || 'bin';
        
        // Tenta achar com o nome padronizado (id.ext) ou nome original (projetos velhos)
        const fileInZip = assetsFolder.file(`${id}.${ext}`) || assetsFolder.file(asset.originalName);
        
        if (fileInZip) {
          const blob = await fileInZip.async('blob');
          assetStore.registerBlob(id, blob);
        }
      }
    }
  }

  // Devolve o JSON pronto para o App usar no seu próprio Store
  return project;
}