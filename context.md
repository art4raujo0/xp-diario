# Context

## Estado atual
- Branch atual confirmada: `feat/tarefas`
- Condicao do usuario atendida: estamos na branch correta, entao o trabalho pode continuar a partir daqui.

## O que existe hoje relacionado a tarefas
- Nao ha CRUD ou entidade separada de tarefas no backend.
- O conceito atual de tarefas aparece como `at_tarefas_concluidas` no registro de atividade.
- O endpoint `GET /api/progresso` agrega esse campo em `resumo.totalTarefasConcluidas`.
- O dashboard exibe esse agregado em `frontend/app.js`.
- A tela `frontend/estudos.html` e o script `frontend/estudos.js` permitem informar tarefas concluidas ao salvar um estudo.

## Arquivos centrais para continuidade
- Backend:
  - `backend/server.js`
  - `backend/src/routes/atividades.js`
  - `backend/src/routes/progresso.js`
  - `backend/src/routes/metas.js`
  - `backend/src/routes/materias.js`
  - `backend/src/routes/login.js`
  - `backend/src/config/db.js`
- Frontend:
  - `frontend/app.html`
  - `frontend/app.js`
  - `frontend/estudos.html`
  - `frontend/estudos.js`
  - `frontend/materias.html`
  - `frontend/metas.html`

## Riscos e pontos de atencao
- Se a feature da branch `feat/tarefas` exigir tarefas como entidade real, isso ainda nao esta implementado no estado atual do repositorio.
- Como `materias` nao sao isoladas por usuario, qualquer evolucao que relacione tarefas a materias precisa considerar esse limite atual de modelagem.
- O projeto esta com alteracoes locais nao relacionadas a estes arquivos:
  - `backend/.gitignore` modificado
  - `backend/.env` nao rastreado

## Referencias do repositorio
- Visao geral: `README.md`
- Regras e fluxo funcional: `docs/SPRINT_TELAS_USUARIO_FINAL.md`
- Registro de estudo: `docs/REGISTRAR_ESTUDO.md`
- Diagramas atualizados: `docs/DIAGRAMAS_TELAS_USUARIO_FINAL.md`
