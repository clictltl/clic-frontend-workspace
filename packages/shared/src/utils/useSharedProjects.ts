import { ref } from 'vue';
import type { ClicAsset } from '@clic/shared';
import { useAuth } from '../auth/auth';

export interface UseProjectsConfig {
  appSlug: string; // Ex: 'chatbot' ou 'graph-builder'
  getProjectData: () => any;
  setProjectData: (data: any) => void;
  markAsSaved: () => void;
  assetStore: any; // A instância do useSharedAssetStore
  getActiveFormReferences?: () => string[]; // Retorna array de IDs (reference_id)
}

async function clicFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  
  // Se der erro de sessão E estiver no ambiente do Editor (WP)
  if ((res.status === 401 || res.status === 403) && window.CLIC_AUTH) {
    const auth = useAuth();
    auth.state.showLoginModal = true; // Abre o modal na tela automaticamente
    throw new Error('Sessão expirada. Faça login novamente para continuar.');
  }
  
  return res;
}

export function createSharedProjects(config: UseProjectsConfig) {
  /**
   * ---------------------------------------------------
   * CONFIGURAÇÃO E SINGLETON
   * ---------------------------------------------------
   */

  // Estado
  const currentProjectId = ref<number | null>(null);
  const currentProjectName = ref<string>('');
  const loading = ref(false);
  const error = ref<string | null>(null);
  const projectsList = ref<any[]>([]);

  // Rotas da API
  // 1. Rota do Plugin (para salvar/carregar projetos)
  const pluginRestRoot = window.CLIC_CORE?.rest_root ?? `/wp-json/clic/v1/${config.appSlug}/`;
  // 2. Rota do Core WP (para upload de mídia nativo)
  const wpRestRoot = window.CLIC_CORE?.wp_rest_root ?? '/wp-json/';
  const nonce = window.CLIC_AUTH?.nonce ?? '';

  /**
   * ---------------------------------------------------
   * SEGURANÇA: UPLOAD COM DESDUPLICAÇÃO GLOBAL
   * ---------------------------------------------------
   * Verifica se a imagem já existe no servidor (pelo Hash).
   * Se existir, usa a URL dela. Se não, faz upload.
   * NÃO deleta imagens antigas para evitar quebrar outros projetos.
   */
  async function uploadPendingAssets() {
    const allAssets = config.assetStore.getAssets();
    const localAssets = Object.values(allAssets).filter((a: any): a is ClicAsset => a.source === 'local');

    if (localAssets.length === 0) return;

    // Processa uploads em paralelo para maior velocidade
    const uploadPromises = localAssets.map(async (asset) => {
      try {
        // Recupera o Blob da memória
        const blob = await config.assetStore.getAssetBlob(asset.id);
        if (!blob) throw new Error(`Arquivo não encontrado na memória: ${asset.originalName}`);

        // DESDUPLICAÇÃO GLOBAL
        let existingMedia = null;
        if (asset.hash) {
          // Usa a rota customizada rápida
          const searchRes = await clicFetch(`${wpRestRoot}clic/v1/media/find-by-hash?hash=${asset.hash}`, {
              method: 'GET',
              headers: { 'X-WP-Nonce': nonce }
          });
          
          if (searchRes.ok) {
              const data = await searchRes.json();
              if (data.found) {
                  existingMedia = { id: data.id, source_url: data.source_url };
              }
          }
        }

        let wpMedia;

        if (existingMedia) {
          // REUTILIZAÇÃO: O arquivo já existe no servidor
          wpMedia = existingMedia;
        } else {
          // UPLOAD NOVO
          // Prepara o Payload no padrão do WordPress
          const formData = new FormData();
          formData.append('file', blob, asset.originalName);
          formData.append('description', 'Chatbot Asset'); 
          // Opcional: Adicionar legenda ou texto alternativo
          // formData.append('alt_text', 'Imagem do Chatbot CLIC');
          
          // Envia para API Nativa (/wp/v2/media)
          const res = await clicFetch(`${wpRestRoot}wp/v2/media`, {
            method: 'POST',
            headers: { 'X-WP-Nonce': nonce },
            body: formData
          });

          if (!res.ok) throw new Error(res.statusText);
          wpMedia = await res.json();

          // ATUALIZA O METADADO
          if (asset.hash) {
            await clicFetch(`${wpRestRoot}wp/v2/media/${wpMedia.id}`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'X-WP-Nonce': nonce 
                },
                body: JSON.stringify({
                  meta: {
                    _clic_image_hash: asset.hash
                  }
                })
            });
          }
        }

        // Atualiza o Asset para Remote (Persistência)
        // Agora o JSON do projeto apontará para a URL pública do WP
        if (allAssets[asset.id]) {
          allAssets[asset.id].source = 'remote';
          allAssets[asset.id].url = wpMedia.source_url;
          allAssets[asset.id].externalId = wpMedia.id;
        }

      } catch (err: any) {
        console.error(`Falha no upload de ${asset.originalName}:`, err);
        throw new Error(`Erro ao salvar imagem ${asset.originalName}: ${err.message}`);
      }
    });

    // Aguarda todos os uploads terminarem. Se um falhar, o Promise.all rejeita e cancela o salvamento.
    await Promise.all(uploadPromises);
  }

  /**
   * ---------------------------------------------------
   * LISTAR PROJETOS
   * ---------------------------------------------------
   */
  async function listProjects() {
    loading.value = true;
    error.value = null;

    try {
      const res = await clicFetch(pluginRestRoot + 'list', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-WP-Nonce': nonce
        }
      });

      const data = await res.json();

      if (!data.success) {
        error.value = data.error || 'UNKNOWN_ERROR';
        return [];
      }

      projectsList.value = data.projects || [];
      return data.projects;

    } catch (err: any) {
      error.value = err.message;
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * ---------------------------------------------------
   * SALVAR (update OU create)
   * ---------------------------------------------------
   */
  async function saveProject(name?: string) {
    loading.value = true;
    error.value = null;

    try {
      // 1. Garante que todos os assets locais subam para o servidor
      if (Object.keys(config.assetStore.getAssets()).length > 0) {
        await uploadPendingAssets();
      }

      // 2. Prepara o JSON (agora contendo apenas URLs remotas)
      const body = {
        id: currentProjectId.value,
        name: name ?? currentProjectName.value,
        data: config.getProjectData(),
        active_form_references: config.getActiveFormReferences ? config.getActiveFormReferences() : []
      };

      // 3. Salva o projeto
      const res = await clicFetch(pluginRestRoot + 'save', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!data.success) {
        error.value = data.error || 'UNKNOWN_ERROR';
        return null;
      }

      currentProjectId.value = data.id;
      currentProjectName.value = data.name;

      config.markAsSaved();
      return data;

    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * ---------------------------------------------------
   * SALVAR COMO (novo)
   * ---------------------------------------------------
   */
  async function saveProjectAs(newName: string) {
    const previousId = currentProjectId.value;

    currentProjectId.value = null;

    const result = await saveProject(newName);

    if (!result) {
      currentProjectId.value = previousId;
    }

    return result;
  }

  /**
   * ---------------------------------------------------
   * CARREGAR
   * ---------------------------------------------------
   */
  async function loadProject(id: number) {
    loading.value = true;
    error.value = null;

    try {
      const res = await clicFetch(pluginRestRoot + 'load/' + id, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-WP-Nonce': nonce
        }
      });

      const data = await res.json();

      if (!data.success) {
        error.value = data.error || 'UNKNOWN_ERROR';
        return null;
      }

      // Limpa o registro de memória antigo (Blobs) antes de carregar
      config.assetStore.clearRegistry();

      config.setProjectData(data.project.data);

      currentProjectId.value = data.project.id;
      currentProjectName.value = data.project.name;

      return data.project;

    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * ---------------------------------------------------
   * EXCLUIR
   * ---------------------------------------------------
   */
  async function deleteProject(id: number) {
    loading.value = true;
    error.value = null;

    try {
      const res = await clicFetch(pluginRestRoot + 'delete/' + id, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-WP-Nonce': nonce
        }
      });

      const data = await res.json();

      if (!data.success) {
        error.value = data.error || 'UNKNOWN_ERROR';
        return false;
      }

      if (currentProjectId.value === id) {
        currentProjectId.value = null;
        currentProjectName.value = '';
      }

      return true;

    } catch (err: any) {
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * ---------------------------------------------------
   * COMPARTILHAR
   * ---------------------------------------------------
   */
  async function shareProject() {
    error.value = null;

    // não faz sentido compartilhar sem projeto salvo
    if (!currentProjectId.value) {
      error.value = "PROJECT_NOT_SAVED";
      return null;
    }

    const body = {
      project_id: currentProjectId.value
    };

    try {
      const res = await clicFetch(pluginRestRoot + 'share', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!data.success) {
        error.value = data.error || "UNKNOWN_ERROR";
        return null;
      }

      return {
        token: data.token,
        share_url: data.share_url ?? `${window.CLIC_CORE?.app_url ?? "/"}?share=${data.token}`,
        existing: data.existing,
        reactivated: data.reactivated,
        is_active: true
      };

    } catch (err: any) {
      error.value = err.message;
      return null;
    }
  }

  async function loadSharedProject(token: string) {
    loading.value = true;
    error.value = null;

    try {
      const restRoot = window.CLIC_CORE?.rest_root ?? '/wp-json/clic/v1/chatbot/';
      
      // 1. Busca na API
      const res = await clicFetch(restRoot + 'share/' + token);
      const data = await res.json();

      if (!data.success) {
        error.value = data.error || 'Erro ao carregar compartilhamento';
        return false;
      }

      // 2. Limpa memória anterior
      config.assetStore.clearRegistry();

      // 3. Aplica os dados no Editor
      config.setProjectData(data.project.data);

      // 4. "Privatiza" os assets (Baixa e converte para Blob Local)
      // Isso garante que se o usuário salvar, as imagens serão dele.
      await config.assetStore.privatizeRemoteAssets();

      // 5. Configura como um projeto "Novo" (sem ID vinculado ao banco)
      currentProjectId.value = null;
      currentProjectName.value = '';

      return true;

    } catch (err: any) {
      console.error("Erro no loadSharedProject:", err);
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * ---------------------------------------------------
   * DESCOMPARTILHAR
   * ---------------------------------------------------
   */
  async function unshareProject() {
    error.value = null;

    if (!currentProjectId.value) return null;

    try {
      const res = await clicFetch(pluginRestRoot + 'unshare', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce
        },
        body: JSON.stringify({ project_id: currentProjectId.value })
      });

      const data = await res.json();

      if (!data.success) {
        error.value = data.error || "UNKNOWN_ERROR";
        return false;
      }

      return true;

    } catch (err: any) {
      error.value = err.message;
      return false;
    }
  }

  /**
   * ---------------------------------------------------
   * CHECAR STATUS SHARE (Sem criar)
   * ---------------------------------------------------
   */
  async function getShareStatus() {
    error.value = null;
    if (!currentProjectId.value) return null;

    try {
      const res = await clicFetch(`${pluginRestRoot}share-status?project_id=${currentProjectId.value}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'X-WP-Nonce': nonce }
      });
      
      const data = await res.json();
      if (!data.success) return { is_active: false, exists: false };

      return data; 

    } catch (err: any) {
      console.error(err);
      return { is_active: false, exists: false };
    }
  }

  /**
   * ---------------------------------------------------
   * PUBLICAR
   * ---------------------------------------------------
   */
  async function publishProject(options?: { only_reactivate?: boolean }) {
    error.value = null;

    if (!currentProjectId.value) {
      error.value = 'PROJECT_NOT_SAVED';
      return null;
    }

    const body = {
      project_id: currentProjectId.value,
      only_reactivate: options?.only_reactivate ?? false
    };

    try {
      const res = await clicFetch(pluginRestRoot + 'publish', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!data.success) {
        error.value = data.error || 'UNKNOWN_ERROR';
        return null;
      }

      return {
        token: data.token,
        publish_url: data.publish_url,
        published_at: data.published_at,
        existing: data.existing,
        is_active: true
      };

    } catch (err: any) {
      error.value = err.message;
      return null;
    }
  }

  /**
   * ---------------------------------------------------
   * DESPUBLICAR
   * ---------------------------------------------------
   */
  async function unpublishProject() {
    error.value = null;
    
    if (!currentProjectId.value) return null;

    try {
      const res = await clicFetch(pluginRestRoot + 'unpublish', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce
        },
        body: JSON.stringify({ project_id: currentProjectId.value })
      });

      const data = await res.json();

      if (!data.success) {
        error.value = data.error || 'UNKNOWN_ERROR';
        return false;
      }
      
      return true;

    } catch (err: any) {
      error.value = err.message;
      return false;
    }
  }

  /**
   * ---------------------------------------------------
   * CHECAR STATUS (Sem publicar)
   * ---------------------------------------------------
   */
  async function getPublishStatus() {
    error.value = null;
    if (!currentProjectId.value) return null;

    try {
      const res = await clicFetch(`${pluginRestRoot}publish-status?project_id=${currentProjectId.value}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'X-WP-Nonce': nonce }
      });
      
      const data = await res.json();
      
      if (!data.success) {
        // Se der erro, assume inativo para não bloquear a UI
        return { is_active: false, exists: false };
      }

      return data; // { is_active, exists, publish_url, ... }

    } catch (err: any) {
      console.error(err);
      return { is_active: false, exists: false };
    }
  }

  /**
   * ---------------------------------------------------
   * FORMULÁRIOS (Setup, Respostas e Sync)
   * ---------------------------------------------------
   */

  async function setupForm(referenceId: string, formConfig: any, isActive: boolean = true) {
    error.value = null;
    if (!currentProjectId.value) {
      error.value = 'PROJECT_NOT_SAVED';
      return null;
    }

    try {
      const res = await clicFetch(`${pluginRestRoot}forms/setup`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce },
        body: JSON.stringify({
          project_id: currentProjectId.value,
          reference_id: referenceId,
          config: formConfig,
          is_active: isActive ? 1 : 0
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'UNKNOWN_ERROR');
      return data; // Retorna { success, token, form_url, is_active }
    } catch (err: any) {
      error.value = err.message;
      return null;
    }
  }

  async function loadForm(token: string) {
    loading.value = true;
    error.value = null;
    try {
      const res = await clicFetch(`${pluginRestRoot}forms/${token}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erro ao carregar formulário');
      return data; // Retorna { form: { reference_id, config }, project: { data } }
    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function submitFormAnswer(token: string, answerData: any) {
    loading.value = true;
    error.value = null;
    try {
      const res = await clicFetch(`${pluginRestRoot}forms/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: answerData })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erro ao enviar resposta');
      return true;
    } catch (err: any) {
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function getFormAnswers() {
    error.value = null;
    if (!currentProjectId.value) return [];
    try {
      const res = await clicFetch(`${pluginRestRoot}forms/project/${currentProjectId.value}/answers`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'X-WP-Nonce': nonce }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erro ao buscar respostas');
      return data.answers || []; // [{ id, data, created_at, reference_id }, ...]
    } catch (err: any) {
      console.error(err);
      return [];
    }
  }

  async function syncFormAnswers(answerIds: number[]) {
    error.value = null;
    if (!currentProjectId.value || answerIds.length === 0) return false;
    try {
      const res = await clicFetch(`${pluginRestRoot}forms/project/${currentProjectId.value}/sync`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce },
        body: JSON.stringify({ answer_ids: answerIds })
      });
      const data = await res.json();
      return data.success;
    } catch (err: any) {
      console.error(err);
      return false;
    }
  }

  async function getFormStatus(referenceId: string) {
    error.value = null;
    if (!currentProjectId.value) {
      return { exists: false };
    }
    
    try {
      const res = await clicFetch(`${pluginRestRoot}forms/project/${currentProjectId.value}/reference/${referenceId}/status`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'X-WP-Nonce': nonce }
      });
      const data = await res.json();
      
      if (!data.success) {
        return { exists: false };
      }
      return data; // Retorna { exists: true, token, is_active, form_url }
    } catch (err: any) {
      console.error(err);
      return { exists: false };
    }
  }

  async function deleteForm(referenceId: string) {
    if (!currentProjectId.value) return false;
    try {
      const res = await clicFetch(`${pluginRestRoot}forms/project/${currentProjectId.value}/reference/${referenceId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-WP-Nonce': nonce }
      });
      const data = await res.json();
      return data.success;
    } catch (err: any) {
      console.error(err);
      return false;
    }
  }

  async function clearFormAnswers(referenceId: string) {
    if (!currentProjectId.value) return false;
    try {
      const res = await clicFetch(`${pluginRestRoot}forms/project/${currentProjectId.value}/reference/${referenceId}/answers`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-WP-Nonce': nonce }
      });
      const data = await res.json();
      return data.success;
    } catch (err: any) {
      console.error(err);
      return false;
    }
  }

  /**
   * ---------------------------------------------------
   * EXPORTAR SINGLETON
   * ---------------------------------------------------
   */
  return {
    currentProjectId,
    currentProjectName,
    loading,
    error,
    projectsList,
    listProjects,
    saveProject,
    saveProjectAs,
    loadProject,
    deleteProject,
    shareProject,
    loadSharedProject,
    unshareProject,
    getShareStatus,
    publishProject,
    unpublishProject,
    getPublishStatus,
    setupForm,
    loadForm,
    submitFormAnswer,
    getFormAnswers,
    syncFormAnswers,
    getFormStatus,
    deleteForm,
    clearFormAnswers,
    markAsSaved: config.markAsSaved,
  };
}
