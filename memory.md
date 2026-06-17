# Memory

## Projeto
- Nome: `XP Diario`
- Objetivo: aplicacao web para organizar estudos, registrar atividades e acompanhar evolucao com metas, streak, pontuacao e conquistas.
- Estrutura principal:
  - `backend/`: API Express com PostgreSQL
  - `frontend/`: telas HTML/CSS/JS servidas pelo backend
  - `docs/`: documentacao funcional e diagramas

## Stack e execucao
- Backend em Node.js com `express`, `pg`, `jsonwebtoken`, `bcrypt`, `cors`, `dayjs`, `node-cron`, `nodemailer` e `resend`.
- O servidor principal esta em `backend/server.js`.
- O frontend nao usa framework SPA; sao paginas HTML com JavaScript vanilla consumindo a API.
- Porta padrao: `3000`.
- O backend serve arquivos estaticos da pasta `frontend/`.

## Rotas e telas existentes
- Paginas servidas:
  - `/` e `/login` -> `frontend/index.html`
  - `/app` -> dashboard
  - `/metas`
  - `/materias`
  - `/cadastro`
  - `/estudos`
  - `/conquistas`
  - `/perfil`
- Endpoints principais:
  - `POST /api/login`
  - `POST /api/cadastro`
  - `GET|POST|PUT|DELETE /api/materias`
  - `GET|POST|PUT|DELETE /api/metas`
  - `GET|POST /api/atividades`
  - `GET /api/streak`
  - `GET /api/progresso`
  - `GET /api/conquistas`
  - `GET /api/perfil`
  - `GET|PUT /api/notificacoes`

## Regras de negocio vigentes
- Metas, atividades, streak, progresso, conquistas, perfil e notificacoes sao isolados por usuario autenticado via JWT.
- Materias ainda estao em escopo global no estado atual, sem autenticacao.
- Pontuacao e acumulada a partir do tempo estudado: `1 ponto por minuto`.
- Conquistas sao desbloqueadas automaticamente conforme criterios elegiveis.
- O registro de estudo aceita contagem de tarefas concluidas por atividade.
- Ainda nao existe entidade propria de tarefas; "tarefas" hoje e um campo numerico agregado em `atividade` e usado no resumo de progresso.

## Persistencia
- Conexao com PostgreSQL via `backend/src/config/db.js`.
- Ha fallback de `DATABASE_URL` no codigo, alem do uso de `.env`.
- Scripts SQL versionados em `backend/sql/`.
- A tabela `atividade` inclui:
  - `at_tempo_min`
  - `at_tarefas_concluidas`
  - `at_data`
  - `at_descricao`

## Observacoes tecnicas
- Existem textos com problemas de encoding em alguns arquivos frontend e backend ja existentes.
- `backend/package.json` ainda nao possui suite real de testes; o script `test` retorna erro proposital.
- O scheduler de notificacoes e iniciado no boot com `iniciarScheduler()`.
