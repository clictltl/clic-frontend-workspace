export default {
  global: {
    cancel: 'Cancelar',
    close: 'Fechar',
    save: 'Salvar',
    saving: 'Salvando...',
    delete: 'Excluir',
    deleting: 'Excluindo...',
    open: 'Abrir',
    opening: 'Abrindo...',
    done: 'Concluído',
    copy: 'Copiar',
    copied: 'Copiado!',
    project: 'Projeto',
    unexpected_error: 'Erro inesperado.',
    error_saving: 'Erro ao salvar.',
    undo: 'Desfez',
    redo: 'Refez'
  },
  
  header: {
    made_by: 'feito pelo',
    language: 'Idioma',
    guide: 'Guia',
    info_contact: 'Informações e Contato',
    about_clic: 'Sobre o CLIC',
    about_desc: 'Esta ferramenta faz parte do <strong>CLIC</strong>, uma iniciativa do Transformative Learning Technologies Lab (TLTL) da Universidade de Columbia.',
    full_access: 'Acesso Completo',
    full_access_desc: 'Você está utilizando a ferramenta no modo livre. Caso seja um educador e queira salvar seus projetos na nuvem, criar turmas e acessar nossas Sequências Didáticas, solicite a sua conta através do nosso e-mail de contato.',
    bugs_suggestions: 'Bugs e Sugestões',
    bugs_desc: 'Sua contribuição é muito importante para a evolução contínua deste projeto. Se você encontrou algum erro na ferramenta ou quer nos enviar feedbacks e sugestões de melhoria, não hesite em nos contatar.',
    contact: 'Contato:',
    site: 'Site:',
    app_install: 'Instalar App',
    back_home: 'Voltar ao início'
  },

  runtime: {
    created_with: 'Criado com',
    open_in_editor: 'Abrir no Editor',
  },

  auth: {
    login: 'Entrar',
    logout: 'Sair',
    welcome_back: 'Bem-vindo de volta',
    login_prompt: 'Faça login para salvar seus projetos na nuvem.',
    user_or_email: 'Usuário ou E-mail',
    type_user: 'Digite seu usuário',
    password: 'Senha',
    type_password: 'Digite sua senha',
    logging_in: 'Entrando...',
    fill_fields: 'Preencha usuário e senha.',
    invalid_credentials: 'Usuário ou senha incorretos.',
    too_many_attempts: 'Muitas tentativas. Aguarde alguns minutos.',
    blocked_terms: 'Acesso bloqueado. Acesse clic.tltlab.org pelo navegador para aceitar os Termos de Uso.',
    blocked_teacher: 'Acesso Bloqueado: Procure seu professor para regularizar sua conta.',
    login_error: 'Erro ao fazer login.'
  },

  file_menu: {
    title: 'Arquivo',
    new_project: 'Novo projeto',
    unsaved_changes: 'Alterações não salvas',
    cloud: 'Nuvem',
    save: 'Salvar',
    save_as: 'Salvar como...',
    open: 'Abrir...',
    delete: 'Excluir...',
    share: 'Compartilhar...',
    publish: 'Publicar',
    local: 'Local',
    import_project: 'Importar Projeto',
    export_project: 'Exportar Projeto',
    success_save_generic: 'Salvo com sucesso!',
    success_save_project: 'Projeto salvo com sucesso!',
    error_save_project: 'Erro ao salvar projeto.',
    success_load: 'Projeto carregado com sucesso!',
    error_load: 'Erro ao carregar o projeto.',
    success_export: '{itemName} exportado com sucesso!',
    error_export: 'Erro ao exportar {itemName}.'
  },

  modals: {
    delete: {
      title: 'Excluir {itemName}',
      confirm_named: 'Tem certeza de que deseja excluir o {itemName} <strong>"{projectName}"</strong>?',
      confirm_generic: 'Tem certeza de que deseja excluir este {itemName}?',
      warning: 'Esta ação é irreversível e os dados não poderão ser recuperados.',
      btn_confirm: 'Sim, Excluir',
      no_selection: 'Nenhum projeto selecionado.',
      success: 'Projeto excluído com sucesso.',
      error: 'Erro ao excluir o projeto.'
    },
    invalid_link: {
      title: 'Link Inválido ou Expirado',
      description: 'Não foi possível carregar o {itemName} compartilhado. <br> O link pode estar incorreto, ter sido revogado pelo proprietário ou o {itemName} foi excluído.',
      btn_create: 'Entendi, criar novo {itemName}'
    },
    need_save: {
      title: 'Salve o {itemName} primeiro',
      description: 'Para compartilhar ou publicar, seu {itemName} precisa estar salvo na nuvem.',
      btn_save: 'Salvar agora'
    },
    open: {
      title: 'Abrir {itemName}',
      description: 'Selecione um projeto da lista para continuar editando.',
      loading: 'Carregando projetos...',
      empty: 'Você ainda não tem projetos salvos.',
      edited_at: 'Editado em: {date}'
    },
    publish: {
      title_publish: 'Publicar {itemName}',
      title_published: '{itemName} Publicado',
      title_paused: 'Publicação Pausada',
      status_online: '{itemName} Online',
      status_offline: '{itemName} Offline',
      version: 'Versão de {date}',
      last_version: 'Última versão: {date}',
      public_link: 'Link Público',
      hint_update: 'Se fez alterações, clique em "Atualizar" para salvar e sincronizar.',
      hint_restore: 'Deseja restaurar a versão antiga ou salvar e publicar suas novas alterações?',
      never_published: 'Este {itemName} nunca foi publicado. Publique para gerar um link único de acesso.',
      btn_publish: 'Publicar',
      desc_restore: 'Liga o bot como estava antes, sem salvar alterações atuais',
      btn_disable: 'Desativar {itemName}',
      btn_unpublish: 'Despublicar',
      btn_restore: 'Restaurar Anterior',
      btn_update: 'Atualizar',
      btn_publish_new: 'Publicar Nova Versão',
      checking: 'Verificando status...',
      saving_publishing: 'Salvando e publicando...',
      success_new: 'Nova versão publicada!',
      success_published: 'Publicado!',
      restoring: 'Restaurando versão...',
      success_restored: 'Versão anterior restaurada e online!',
      warning_unpublish: 'O link parará de funcionar. Continuar?',
      unpublishing: 'Desativando...',
      success_unpublished: 'Despublicado.'
    },
    save_as: {
      title_new: 'Salvar {itemName}',
      title_copy: 'Salvar como...',
      label_name: 'Nome do {itemName}',
      desc_new: 'Dê um nome para o seu novo {itemName} para salvá-lo.',
      desc_copy: 'Crie uma cópia deste {itemName} com um novo nome.',
      placeholder_new: 'Ex: Meu {itemName}',
      placeholder_copy: 'Ex: {itemName} v2',
      btn_copy: 'Criar Cópia',
      error_empty: 'O nome não pode estar vazio.'
    },
    share: {
      title: 'Compartilhar {itemName}',
      status_active: 'Compartilhamento Ativo',
      status_inactive: 'Compartilhamento Desativado',
      desc_active: 'O link está ativo. Qualquer pessoa com a URL abaixo pode acessar o {itemName}.',
      desc_inactive: 'O link está desativado. Reative para permitir o acesso novamente.',
      empty: 'Nenhum link gerado anteriormente. Gere um link para permitir que outros visualizem este {itemName}.',
      public_link: 'Link Público',
      btn_disable: 'Desativar Link',
      btn_reactivate: 'Reativar Link',
      btn_generate: 'Gerar Link',
      checking: 'Verificando...',
      success_generated: 'Link gerado!',
      success_reactivated: 'Link reativado com sucesso!',
      processing: 'Processando...',
      warning_disable: 'O link ficará inacessível. Você poderá reativá-lo depois.',
      disabling: 'Desativando...',
      success_disabled: 'Link desativado.'
    },
    unsaved: {
      title_export: 'Deseja exportar as alterações?',
      title_save: 'Deseja salvar as alterações?',
      desc_export: 'Se você criar um novo projeto sem exportar, todas as alterações recentes serão perdidas permanentemente.',
      desc_discard: 'Se você descartar, todas as alterações recentes serão perdidas permanentemente.',
      btn_discard: 'Descartar',
      btn_export: 'Exportar'
    }
  },

  messages: {
    export_asset_error: 'Erro ao processar asset {id} para exportação:',
    missing_project_json: 'Arquivo project.json não encontrado no pacote.',
    invalid_file_format: 'Formato de arquivo inválido ou não reconhecido por motivos de segurança.',
    not_allowed_type: 'Tipo de arquivo não permitido. Detectado: {mime}',
    compression_failed_size: 'O arquivo continua muito grande após compressão ({size}MB).',
    compression_error: 'Erro ao comprimir imagem: {error}',
    file_too_large: 'Arquivo muito grande ({size}MB). O limite é {limit}MB.',
    download_failed: 'Falha no download',
    session_expired: 'Sessão expirada. Faça login novamente para continuar.',
    file_not_in_memory: 'Arquivo não encontrado na memória: {name}',
    upload_failed: 'Upload falhou: {error}',
    save_image_error: 'Erro ao salvar imagem {name}: {error}',
    preview_load_error: 'Erro ao carregar preview. Verifique as permissões.',
    student_project: 'Projeto do Aluno',
    share_load_error: 'Erro ao carregar compartilhamento',
    form_load_error: 'Erro ao carregar formulário',
    submit_response_error: 'Erro ao enviar resposta',
    fetch_responses_error: 'Erro ao buscar respostas',
    preview_denied: 'Acesso negado ou falha ao carregar projeto.',
  },
  
  chatbot: {
    editor: {
      new_block: 'Novo Bloco',
      delete_block: 'Excluir bloco',
      input_handle: 'Ponto de entrada',
      output_handle: 'Ponto de saída',
      no_content: 'Sem conteúdo',
      no_image: 'Nenhuma imagem definida',
      connect_label: "Conectar '{label}'",
      connect_condition: 'Conectar condição',
      connecting: 'Conectando...',
      connect_hint: 'Clique ou toque no ponto de entrada (vermelho) do bloco de destino',
      delete_connection: 'Apagar Conexão',
      delete_connection_hint: 'Pressione <kbd>Delete</kbd> ou <kbd>Backspace</kbd> para remover esta conexão',
      tabs: {
        block: 'Bloco',
        variables: 'Variáveis',
        preview: 'Preview'
      },
      context_menu: {
        paste: 'Colar Bloco',
        duplicate: 'Duplicar',
        copy: 'Copiar',
        delete: 'Deletar',
        no_actions: 'Sem ações disponíveis'
      }
    },
    blocks: {
      start: 'Início',
      message: 'Mensagem',
      openQuestion: 'Pergunta Aberta',
      choiceQuestion: 'Múltipla Escolha',
      condition: 'Condicional',
      setVariable: 'Definir Variável',
      math: 'Operação Matemática',
      image: 'Imagem',
      end: 'Fim da Conversa',
      default_content: {
        message: 'Olá! Bem-vindo ao chatbot.',
        openQuestion: 'Qual é o seu nome?',
        choiceQuestion: 'Escolha uma opção:',
        condition: 'Verificando condição...',
        setVariable: 'Definindo variável...',
        math: 'Operação matemática',
        image: 'Imagem',
        end: 'Obrigado por usar o chatbot!'
      }
    },
    properties: {
      empty_state: 'Selecione um bloco para editar suas propriedades',
      block_type: 'Tipo de Bloco',
      label_message: 'Mensagem',
      label_question: 'Pergunta',
      label_final_message: 'Mensagem Final',
      variable_name: 'Nome da Variável',
      variable_select: 'Selecione uma variável',
      value: 'Valor',
      value_placeholder: 'Digite o valor...',
      variable: 'Variável',
      operation: 'Operação',
      math_placeholder: "Digite um número ou {'{{'}variavel{'}}'}",
      math_ops: {
        sum: 'Somar',
        sub: 'Subtrair',
        mult: 'Multiplicar',
        div: 'Dividir'
      },
      save_answer_var: 'Salvar resposta em variável',
      save_answer_none: 'Não salvar',
      choices_label: 'Opções de Resposta',
      choice_placeholder: 'Texto da opção',
      delete_choice: 'Remover Opção',
      add_choice: 'Adicionar Opção',
      new_choice: 'Nova Opção',
      conditions_label: 'Condições',
      delete_condition: 'Remover Condição',
      add_condition: 'Adicionar Condição',
      image_source: 'Fonte da Imagem',
      image_url_tab: 'Link (URL)',
      image_upload_tab: 'Upload',
      image_url_placeholder: 'https://exemplo.com/foto.jpg',
      image_upload_btn: 'Carregar Imagem',
      image_upload_empty: 'Nenhum arquivo',
      image_upload_success: 'Arquivo carregado',
      image_preview: 'Pré-visualização:',
      delete_image: 'Remover Imagem',
      hints: {
        variables: 'Use &#123;&#123;variavel&#125;&#125; para inserir valores de variáveis<br/><strong>Aviso:</strong> Evite formatar apenas "metade" da variável.',
        variables_other: 'Use &#123;&#123;variavel&#125;&#125; para usar valores de outras variáveis',
        math_target_var: 'Variável que receberá o resultado da operação',
        math_value: 'Use um número fixo ou &#123;&#123;variavel&#125;&#125; para usar valor de outra variável',
        image_url: 'Cole o link direto de uma imagem na internet.',
        image_upload: 'A imagem será salva junto com o projeto.'
      }
    },
    variables: {
      title_new: 'Nova Variável',
      title_list: 'Variáveis Criadas',
      name_placeholder: 'nome_da_variavel',
      type_text: 'Texto',
      type_number: 'Número',
      empty_state: 'Nenhuma variável criada ainda',
      remove_title: 'Remover variável',
      value_placeholder: 'Valor atual',
      error_empty: 'Digite um nome para a variável',
      error_exists: 'Já existe uma variável com este nome',
      error_invalid: 'Nome inválido. Use apenas letras, números e underscore. Não pode começar com número.',
      confirm_delete: 'Deseja remover a variável "{name}"?'
    },
    runtime: {
      errors: {
        BLOCK_NOT_FOUND: 'Erro de fluxo: bloco não encontrado.',
        IMAGE_NOT_DEFINED: 'Erro: imagem não definida.',
        INVALID_FLOW: 'Erro de fluxo.',
        INVALID_NEXT_BLOCK: 'Erro de fluxo: bloco de destino não encontrado.',
        NO_CHOICE_TARGET: 'Erro: escolha sem destino definido.',
        NO_CHOICES: 'Erro: pergunta sem opções de escolha.',
        NO_CONDITION_MATCH: 'Nenhuma condição satisfeita.',
        NO_START_BLOCK: 'Bloco de início não encontrado.',
        START_NO_NEXT: 'Início sem conexão de saída.',
        UNSUPPORTED_BLOCK_TYPE: 'Tipo de bloco não suportado.'
      },
      preview: {
        title: 'Teste seu Chatbot',
        desc: 'Clique em "Iniciar" para conversar com seu chatbot e testar o fluxo criado.',
        btn_start: 'Iniciar Teste'
      },
      player: {
        title: 'Iniciar conversa',
        desc: 'Clique em iniciar para começar',
        btn_start: 'Iniciar'
      },
      chat: {
        placeholder: 'Digite sua resposta...',
        send: 'Enviar',
        restart: 'Recomeçar'
      },
      toolbar: {
        start: 'Iniciar',
        restart: 'Reiniciar',
        stop: 'Parar',
        expand: 'Expandir tela cheia',
        collapse: 'Sair da tela cheia'
      },
      status: {
        loading: 'Carregando chatbot...',
        unavailable: 'Chatbot indisponível.',
        chat_title: 'Chat'
      }
    },
    history: {
      createBlock: 'Criação de Bloco',
      updateBlock: 'Atualização de Bloco',
      deleteBlock: 'Exclusão de Bloco',
      duplicateBlock: 'Duplicação de Bloco',
      pasteBlock: 'Colagem de Bloco',
      updateBlockPosition: 'Movimentação de Bloco',
      addVariable: 'Criação de Variável',
      updateVariableValue: 'Atualização de Variável',
      removeVariable: 'Exclusão de Variável',
      createConnection: 'Criação de Conexão',
      deleteConnection: 'Exclusão de Conexão',
      updateConnection: 'Ajuste de Caminho (Linha)'
    }
  },

  graphBuilder: {
    editor: {
      edit: 'Editar',
      preview: 'Visualizar'
    },
    board: {
      title_placeholder: 'Título do seu Projeto...',
      new_category: 'Nova Categoria'
    },
    category: {
      form_powered: 'Alimentada por formulário',
      check_answers: 'Verificar novas respostas',
      edit_category: 'Editar Categoria',
      new_answers: 'novas respostas',
      importing: 'Importando...',
      import: 'Importar',
      add_item: '+ Adicionar Item'
    },
    categoryModal: {
      title_edit: 'Editar Categoria',
      title_new: 'Nova Categoria',
      label_name: 'Nome',
      placeholder_name: 'Ex: Introdução, Exemplos...',
      label_color: 'Cor',
      color_used: 'Já utilizada',
      color_custom: 'Personalizado:',
      color_click_pick: 'Clique para escolher uma cor',
      color_open_picker: 'Abrir seletor de cores',
      form_use: 'Utilizar formulário nesta categoria',
      form_exists_tooltip: 'Esta categoria já possui um formulário vinculado',
      form_lock_notice: 'Vínculo com formulário ativo. Para remover, exclua a categoria.',
      form_default_question: 'Qual o seu nome?',
      form_question_label: 'Pergunta do Formulário',
      form_question_placeholder: 'Ex: Qual seu nome?',
      form_connect_categories: 'Conectar com Categorias:',
      link_warning_save: 'Atenção: Para gerar o link público, salve a categoria e o projeto na nuvem.',
      link_checking: 'Verificando status do link...',
      link_hint: 'A configuração viaja com o arquivo. Ative o link para começar a receber dados desta turma.',
      link_processing: 'Processando...',
      link_activate: 'Ativar Link Público',
      link_active_label: 'Link Ativo e recebendo respostas',
      link_copy: 'Copiar link',
      link_open_form: 'Abrir Form',
      link_deactivate: 'Desativar Link',
      link_copied: 'Link copiado!',
      create_failed: 'Falha ao criar categoria.',
      server_error: 'Erro ao conectar com o servidor.',
      delete_confirm: 'Excluir a categoria "{name}" e TODOS os seus itens?',
      btn_create: 'Criar'
    },
    contentEditor: {
      editing: 'Editando:',
      hide_preview: 'Esconder Preview',
      show_preview: 'Mostrar Preview',
      cancel_close: 'Cancelar e Fechar',
      placeholder: '# Comece a escrever aqui...',
      format_bold: 'Negrito',
      format_italic: 'Itálico',
      format_heading: 'Título',
      format_list: 'Lista',
      format_ordered: 'Numérica',
      format_link: 'Link',
      format_image: 'Imagem',
      format_quote: 'Citação'
    },
    properties: {
      empty_state: 'Selecione um item para editar',
      title: 'Editar Item',
      delete_tooltip: 'Excluir item',
      delete_confirm: 'Tem certeza que deseja excluir este item?',
      label_title: 'Título',
      placeholder_title: 'Nome do item',
      label_content: 'Conteúdo',
      help_content: 'O conteúdo é editado em tela cheia para melhor foco.',
      btn_edit_content: 'Editar Conteúdo',
      label_connections: 'Conexões',
      hint_connections: 'Nenhum outro item disponível para conectar (crie itens em outras categorias).'
    },
    node: {
      default_title: 'Novo Item',
      no_name: 'Sem nome'
    },
    runtime: {
      navigation: {
        index_label: 'Índice',
        global_map: 'Ver Mapa Global',
        empty_category: '(Vazio)'
      },
      references: {
        title: 'Conexões',
        empty: 'Nenhuma conexão encontrada.',
        unknown_category: 'Desconhecido'
      },
      form: {
        fallback_option: 'Opção',
        error_submit: 'Erro ao enviar resposta.',
        success_title: 'Resposta Enviada!',
        success_message: 'Obrigado, {name}. Sua resposta foi registrada no sistema.',
        btn_submit_another: 'Enviar outra resposta',
        survey_title: 'Pesquisa',
        survey_desc: 'Preencha os campos abaixo para participar do mapeamento.',
        default_name_label: 'Qual o seu nome?',
        placeholder_name: 'Digite sua resposta...',
        choose_option: 'Escolha uma opção de: {category}',
        btn_submitting: 'Enviando...',
        btn_submit: 'Enviar Resposta'
      },
      reader: {
        empty_project: 'O projeto está vazio.',
        global_map_title: 'Mapa Global de Conexões',
        global_map_desc: 'Explore o mapa e clique em um item para descobrir mais.',
        connections_label: 'Conexões:',
        level_label: 'Nível',
        level_all: 'Todos',
        btn_collapse: 'Reduzir',
        btn_expand: 'Expandir',
        no_content: 'Sem conteúdo escrito.'
      }
    },
    messages: {
      invalid_token: 'Grafo não encontrado ou link inválido.',
      form_not_found: 'Este formulário não existe ou foi desativado pelo professor.',
      invalid_data: 'O arquivo de dados está corrompido.',
      network_error: 'Erro de conexão. Verifique sua internet.',
      unknown_error: 'Ocorreu um erro desconhecido.',
      loading: 'Carregando...',
      oops: 'Ops!'
    },
    history: {
      updateTitle: 'Alteração do título do grafo',
      saveNodeContent: 'Edição do conteúdo',
      addNode: 'Criação de item',
      deleteNode: 'Exclusão de item',
      updateNode: 'Atualização de item',
      reorderNodesInCategory: 'Reordenação de item',
      addCategory: 'Criação de categoria',
      deleteCategory: 'Exclusão de categoria',
      updateCategory: 'Atualização de categoria',
      reorderCategories: 'Reordenação de categoria',
      addEdge: 'Conexão',
      removeEdge: 'Remoção de conexão',
      updateCategoryFormConfig: 'Configuração de Formulário'
    }
  },

  emojiCoder: {
    setup: {
      prepare_env: 'Escolha uma atividade para começar',
      
      basic_title: 'Nível Básico',
      basic_desc: 'Aprenda a mover o caramelo usando direções absolutas.',
      intermediate_title: 'Nível Intermediário',
      intermediate_desc: 'Aprenda a se colocar no lugar do caramelo usando movimentos relativos.',
      advanced_title: 'Nível Avançado',
      advanced_desc: 'Acesso total aos blocos, funções avançadas e grades customizadas.',
      
      tutorial_title: 'Tutorial Interativo',
      tutorial_basic_desc: 'Aprenda a mover o caramelo e pintar o chão passo a passo.',
      tutorial_inter_desc: 'Aprenda a navegar pela perspectiva do caramelo (Avançar/Girar).',
      
      sandbox_basic_title: 'Caixa de Areia (Básico)',
      sandbox_basic_desc: 'Crie desenhos livres usando os blocos de movimento.',
      sandbox_inter_title: 'Caixa de Areia (Relativo)',
      sandbox_inter_desc: 'Programe movimentos de Avançar, Recuar e Giros.',
      sandbox_adv_title: 'Caixa de Areia (Mestre)',
      sandbox_adv_desc: 'Mescle movimento absoluto e relativo no mesmo projeto. Crie desafios enormes!',
      
      grid_fixed: 'Tamanho: 8x8 (Fixo)',
      grid_size: 'Tamanho do Tabuleiro:',
      grid_small: '6x6 (Pequeno)',
      grid_medium: '8x8 (Médio)',
      grid_large: '12x12 (Grande)',
      grid_max: '16x16 (Desafio Máximo)',
      start_btn: 'Começar'
    },
    messages: {
      unsaved_confirm: 'Você tem alterações não salvas. Deseja realmente voltar ao início e perder seu progresso?',
      loading_project: 'Carregando Projeto...',
      oops: 'Ops!',
      invalid_token: 'Projeto não encontrado ou link inválido.',
      invalid_data: 'O arquivo do projeto está corrompido.',
      network_error: 'Erro de conexão. Verifique sua internet.',
      unknown_error: 'Ocorreu um erro desconhecido.'
    },
    workspace: {
      loaded_title: 'Ambiente de Código Carregado!',
      active_lib: 'Biblioteca Ativa:',
      grid_size: 'Tamanho do Grid:',
      placeholder: '(O Blockly e o Canvas serão renderizados aqui)',
      drag_resize: 'Arrastar para redimensionar',
      actor_alt: 'Tartaruga'
    },
    blocks: {
      start: 'Quando iniciar',
      paint: 'Pintar',
      move_up: 'Para cima',
      move_down: 'Para baixo',
      move_left: 'Para esquerda',
      move_right: 'Para direita',
      define: 'Definir',
      call: 'Chamar',
      defaultFuncName: 'minha função',
      move_forward: 'Avançar',
      move_backward: 'Recuar',
      turn_left: 'Girar à Esquerda',
      turn_right: 'Girar à Direita',
      repeat: 'Repita'
    },
    toolbox: {
      start: 'Início',
      movement: 'Movimento',
      movement_absolute: 'Movimento Absoluto',
      movement_relative: 'Movimento Relativo',
      actions: 'Ações',
      loops: 'Repetição',
      functions: 'Funções'
    },
    player: {
      challenge: 'Desafio {number}',
      go_to_challenge: 'Ir para este desafio',
      need_hint: 'Precisa de uma dica?',
      hint: 'Dica:',
      success: 'Sucesso!',
      finish_tutorial: 'Finalizar Tutorial',
      next_challenge: 'Próximo Desafio →',
      tutorial_completed: 'Tutorial Concluído!',
      tutorial_completed_desc: 'Você completou todos os desafios com excelência. Você já é um(a) mestre da Tartaruga e está pronto(a) para criar seus próprios projetos livres!',
      save_tip: 'Lembre-se de usar o menu <strong>Arquivo > Salvar</strong> para guardar suas soluções antes de sair!',
      back_home: 'Voltar ao Início',
      step: 'Passo',
      waiting_code: 'Aguardando código...',
      speed: 'Velocidade',
      reset_world: 'Reiniciar Mundo',
      run_code: 'Executar Código',
      resume: 'Continuar Execução',
      pause: 'Pausar',
      step_by_step: 'Passo a Passo',
      export_image: 'Exportar como Imagem',
      editor_mode: 'Modo Editor',
      full_screen: 'Tela Cheia',
      default_drawing_name: 'desenho'
    },
    tutorials: {
      grade4: {
        c1: {
          title: 'Vá para a direita!',
          desc: 'A tartaruga precisa chegar até o bloco verde. Use o bloco → Direita para mover!',
          tip: 'Cada → Direita avança 1 célula. Quantas vezes você precisa usar para chegar ao verde?',
          success: 'Parabéns! Você moveu a tartaruga até o objetivo!'
        },
        c2: {
          title: 'Pinte uma linha!',
          desc: 'Pinte os 4 blocos da linha. Use Pintar e → Direita.',
          tip: 'Comece pintando onde está, depois vá para direita e pinte de novo!',
          success: 'Muito bem! Você pintou a linha inteira!'
        },
        c3: {
          title: 'Use o Repita!',
          desc: 'Pinte uma linha de 6 blocos, mas desta vez use o bloco Repita para facilitar!',
          tip: 'Coloque Pintar + Direita dentro do Repita. Repita 6 vezes!',
          success: 'Perfeito! O bloco Repita deixou seu código muito mais simples!'
        },
        c4: {
          title: 'Pinte tudo!',
          desc: 'Pinte todos os 12 blocos do grid 4×3 de azul. Use todos os movimentos!',
          tip: 'Pinte linha por linha ou coluna por coluna. Use Repita para facilitar!',
          success: 'Excelente! Você pintou todos os blocos do grid!'
        },
        c5: {
          title: 'Pinte a moldura!',
          desc: 'Pinte apenas as bordas do grid 8×8. Não pinte os blocos do meio!',
          tip: 'Pinte a linha de cima toda, depois as laterais, e por fim a linha de baixo. Use Repita!',
          success: 'Fantástico! Você pintou a moldura perfeita sem pintar nenhum bloco a mais! 🎉'
        }
      },
      grade5: {
        c1: {
          title: 'Chegue ao objetivo!',
          desc: 'A tartaruga precisa chegar até o bloco verde no final da linha. Use o bloco Avançar para avançar!',
          tip: 'Cada Avançar avança 1 passo. Quantos passos até o bloco verde?',
          success: 'Você chegou ao objetivo! Aprendeu a mover a tartaruga com precisão.'
        },
        c2: {
          title: 'Pinte a linha!',
          desc: 'Pinte todos os 8 blocos da linha. Use Pintar e Avançar.',
          tip: 'Pinte a célula atual, avance, pinte a próxima... repita para todos os 8 blocos!',
          success: 'Incrível! Você pintou a linha inteira — mas foi bem trabalhoso, né? Há uma forma melhor...'
        },
        c3: {
          title: 'Use o Repita!',
          desc: 'Pinte a linha novamente — mas desta vez use o bloco Repita.',
          tip: 'Coloque Pintar + Avançar dentro do Repita. Quantas vezes você precisa repetir?',
          success: 'Perfeito! O bloco Repita deixou o código muito menor e mais elegante!'
        },
        c4: {
          title: 'Utilize uma função!',
          desc: 'Utilize a função que pinta uma linha inteira. Chame-a novamente para pintar a segunda linha!',
          tip: 'Navegue até a próxima linha e chame a função de novo.',
          success: 'Excelente! Funções permitem reutilizar código — defina uma vez, use quantas quiser!'
        },
        c5: {
          title: 'Desenhe um quadrado!',
          desc: 'Pinte o perímetro do quadrado marcado na malha.',
          tip: 'Tente: Repita 4 vezes — Repita 2×(Pintar + Avançar), depois Girar à Direita.',
          success: 'Fantástico! Você desenhou um quadrado usando código. Você é um(a) programador(a)!'
        },
        c6: {
          title: 'Moldura!',
          desc: 'Pinte apenas as bordas da tela - o perímetro completo.',
          tip: 'Use Repita para cada lado. Depois de pintar um lado, gire para o próximo!',
          success: 'Excelente! Você criou uma moldura perfeita ao redor da tela!'
        },
        c7: {
          title: 'Mude os olhos!',
          desc: 'Mude os 2 blocos pretos para outra cor!',
          tip: 'Navegue até cada olho preto e pinte. Use os comandos para chegar lá!',
          success: 'Perfeito! Você mudou os olhos de preto para outra cor!'
        },
        c8: {
          title: 'Pinte a letra E!',
          desc: 'A letra E está em cinza. Pinte toda a letra com a cor que quiser!',
          tip: 'Navegue por cada linha da letra. Cuidado: pinte APENAS a letra!',
          success: 'Incrível! Você coloriu a letra E completamente!'
        }
      }
    },
    history: {
      updateConfig: 'Alteração na Grade',
    }
  }
};
