# Projeto CLIC

CLIC (Computer Literacy Integrated into the Curriculum) — iniciativa do Transformative Learning
Technologies Lab (TLTL) da Universidade de Columbia. Plataforma para professores do Ensino
Fundamental de escolas públicas criarem sequências didáticas e artefatos computacionais
(chatbots, visualizações dinâmicas) alinhados à BNCC, sem precisar programar.
Base pedagógica: construcionismo e letramento computacional.

## Arquitetura
Headless CMS híbrido: WordPress (PHP/MySQL) no back-end + Vue 3, TypeScript, Vite e Pinia no front.
- Comunicação via API centralizada; autenticação com `X-WP-Nonce`; erros 401/403 tratados globalmente.

### Front-end: `clic-frontend-workspace` (monorepo, npm workspaces)
- `@clic/shared`: componentes globais, motor de i18n, utilitários de API e telemetria.
- `apps/`: SPAs `chatbot`, `chatbot-v2` (reescrita do `chatbot`, em desenvolvimento),
  `graph-builder` e `emoji-coder`. Todas multi-idioma, com múltiplos
  entrypoints no Vite (`editor`, `runtime`, `replay`, `form`).

### Back-end: plugins WordPress (repositórios separados)
- `clic-core`: tabelas customizadas (`projects`, `forms` etc.), REST API em `/wp-json/clic/v1/`
  e roteador dinâmico (lê o `manifest.json` do Vite e injeta o entrypoint de `/app/{slug}/{mode}`).
- `clic-auth`: sessão, cookies e login via REST.
- `clic-{app}`: empacota e serve cada app.
- `clic-class-manager`: gestão de turmas e alunos.
- `clic`: tema customizado que amarra a plataforma.

Os plugins não estão neste repositório. Os builds (`dist`) de cada app são gerados aqui e
empacotados no plugin correspondente; nunca edite um `dist` diretamente.

## Regras
1. **JSON limpo:** o JSON de `getProjectData()` é a fonte da verdade e deve ser 100% portável.
   Nunca salve nele dados de infraestrutura (URLs de compartilhamento, tokens, ID do banco).
   Isso fica no Pinia/refs ou nas tabelas do WP.
2. **Sem suposições:** leia os arquivos envolvidos (componentes, stores, rotas, endpoints)
   antes de propor qualquer mudança. Se algo estiver fora deste repositório (ex.: plugins WP),
   pergunte em vez de supor como está escrito.
3. **Consistência do monorepo:** soluções para um app devem servir aos outros ou ser
   extraídas para `@clic/shared`.
4. **i18n obrigatório:** nunca escreva texto visível ao usuário direto no código.
   Use `t('app.feature.chave')`. Ao final, liste as chaves novas com o valor em pt-br.
5. **Planos:** para features ou refatorações, o plano deve cobrir: pacotes afetados,
   impacto no JSON/Pinia (respeitando a regra 1), eventos de telemetria e impacto no replay
   (regra 6), mudanças em APIs ou props, e se é preciso nova rota REST ou mudança nas
   tabelas do `clic-core`. Aguarde aprovação antes de implementar.
6. **Session replay:** toda ferramenta deve permitir reconstruir a sessão do aluno só pelos
   logs (Frame Zero `project_loaded` + eventos em ordem; referência: `emoji-coder/src/replay`).
   Mudanças no JSON passam por actions de store com `history`, nunca por mutação direta.
   Estado fora do Pinia (ex.: Blockly) e ações sem mutação (executar, navegar) são logados
   via `telemetryService`, com payload JSON autossuficiente e determinístico. Não logue eventos
   contínuos (hover, arraste, cada tecla). Nomes e payloads de eventos são contrato com os
   logs gravados: se mudarem, o replay mantém compatibilidade com o formato antigo.
7. **Ícones:** na interface, use sempre `@lucide/vue` ou um SVG. Nunca coloque emojis
   direto no HTML/template, para garantir consistência entre navegadores.

## Git
- Commits no padrão Conventional Commits (`feat(app): ...`, `fix(shared): ...`), em inglês.
  Título sempre; corpo com detalhes só quando for importante dar mais contexto.
- Não inclua `Co-Authored-By` nem outras linhas de atribuição em commits e PRs.
