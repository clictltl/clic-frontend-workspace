import JSZip from 'jszip';
import type { GraphProject } from '@/shared/types';

/**
 * EXPORTAR: Gera um arquivo .zip contendo project.json e pasta assets/
 */
export async function exportToZIP(project: GraphProject, fileName: string = 'projeto') {
  const zip = new JSZip();

  // 1. Preparar o JSON limpo (sem os objetos binários 'file' ou 'blobUrl')
  // Isso evita que o JSON fique gigante desnecessariamente
  const projectJsonString = JSON.stringify(project, (key, value) => {
    if (key === 'file' || key === 'blobUrl' || key === 'textContent') {
      return undefined; // Não salva no JSON, pois estará no arquivo físico
    }
    return value;
  }, 2);

  zip.file('project.json', projectJsonString);

  // 2. Adicionar Assets na pasta
  const assetsFolder = zip.folder('assets');
  if (assetsFolder) {
    const assets = Object.values(project.assets);
    
    for (const asset of assets) {
      if (asset.file) {
        // Se temos o arquivo em memória, salvamos direto
        assetsFolder.file(asset.originalName, asset.file);
      } else if (asset.textContent) {
        // Fallback: se temos apenas o texto em cache, criamos o arquivo
        assetsFolder.file(asset.originalName, asset.textContent);
      }
    }
  }

  // 3. Gerar o Blob do ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  
  // 4. Trigger Download
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * IMPORTAR: Lê um arquivo .zip ou .json (retrocompatibilidade)
 */
export async function importProjectFile(file: File): Promise<GraphProject> {
  // Retrocompatibilidade: Se for JSON, lê como antes
  if (file.name.endsWith('.json') || file.type === 'application/json') {
    return parseJSONFile(file);
  }

  // Lógica ZIP
  const zip = await JSZip.loadAsync(file);

  // 1. Ler a estrutura
  const jsonFile = zip.file('project.json');
  if (!jsonFile) {
    throw new Error('Arquivo inválido: project.json não encontrado dentro do ZIP.');
  }

  const jsonStr = await jsonFile.async('string');
  const project = JSON.parse(jsonStr) as GraphProject;

  // Garantir que assets exista
  if (!project.assets) project.assets = {};

  // 2. Hidratar Assets (Ler arquivos da pasta assets/ e colocar em memória)
  const assetsFolder = zip.folder('assets');
  
  if (assetsFolder) {
    for (const assetId in project.assets) {
      const asset = project.assets[assetId]!;
      const fileInZip = assetsFolder.file(asset.originalName);

      if (fileInZip) {
        // Recria o objeto File para uso futuro
        const blob = await fileInZip.async('blob');
        asset.file = new File([blob], asset.originalName, { type: asset.type });

        // Se for texto/markdown, lê para a memória (textContent) para acesso rápido
        if (asset.type.includes('text') || asset.originalName.endsWith('.md')) {
          asset.textContent = await fileInZip.async('string');
        }
        
        // Futuro: Se for imagem, gerar blobUrl aqui
        // if (asset.type.startsWith('image/')) {
        //   asset.blobUrl = URL.createObjectURL(asset.file);
        // }
      }
    }
  }

  return project;
}

// Helper antigo para JSON simples (mantido para retrocompatibilidade)
async function parseJSONFile(file: File): Promise<GraphProject> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json.categories || !json.nodes) throw new Error("Formato inválido");
        resolve(json);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error("Erro ao ler JSON."));
    reader.readAsText(file);
  });
}