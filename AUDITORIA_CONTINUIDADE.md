# Auditoria e Continuidade - XP Diario

Data: 18/06/2026
Branch atual: `feat/relayout`
Branch comparada: `origin/feat/redesign-visual-gamificado`

## Objetivo desta auditoria

Registrar o que ja foi corrigido, o que veio da branch remota apenas no backend e o que ainda precisa ser finalizado para deixar o sistema funcional, sem dados mockados e com navegacao consistente.

## O que ja foi trazido ou corrigido nesta branch

### Backend

- Fluxo de recuperacao de senha implementado com pagina propria:
  - `backend/src/routes/senha.js`
  - `frontend/resetar-senha.html`
  - `frontend/resetar-senha.js`
- Rotas da sessao de estudo implementadas no backend:
  - `backend/src/routes/sessoes.js`
- Middleware e autenticacao ajustados para trafegar `nome` no token e em `req.usuario`:
  - `backend/src/middlewares/auth.js`
  - `backend/src/routes/login.js`
  - `backend/src/routes/cadastro.js`
- Integracao de materias por usuario autenticado:
  - `backend/src/routes/materias.js`
  - `backend/src/config/migrar.js` com coluna `di_usuario_id`
- Ajuste no servico de notificacoes para transporte SMTP com `family: 4`:
  - `backend/src/services/notificacoesService.js`
- Rota de exclusao de turma adicionada:
  - `backend/src/routes/turmas.js`
  - endpoint: `DELETE /api/turmas/:id`

### Frontend

- Login sem Google.
- Link "Esqueci minha senha" conectado ao fluxo real.
- Sprite principal trocado para asset transparente:
  - `frontend/assets/boneco-ref-transparent.png`
- Integracao autenticada de materias em varias telas:
  - `frontend/cronogramas.js`
  - `frontend/estudos.js`
  - `frontend/tarefas.js`
  - `frontend/metas.html`
  - `frontend/materias.html`
- Sessao de estudo passou a conversar com backend:
  - inicio via modal de disciplina
  - timer crescente
  - encerramento com persistencia em `sessao_estudo`
  - conversao para minutos arredondando para baixo
  - gravacao automatica em `atividade`
  - soma de XP e desbloqueio de conquistas
  - arquivos: `frontend/estudos.js` e `backend/src/routes/sessoes.js`
- Historico de tarefas ja limitado na tela principal para 3 itens, com modal para ver o restante:
  - `frontend/tarefas.html`
  - `frontend/tarefas.js`
- Sidebars antigas padronizadas:
  - `frontend/turmas.html`
  - `frontend/conquistas.html`
- Bloco visual divergente `sidebar-quest` removido das telas principais para manter o mesmo sidebar de `Metas` e `Perfil`:
  - `frontend/app.html`
  - `frontend/materias.html`
  - `frontend/cronogramas.html`
  - `frontend/tarefas.html`
  - `frontend/estudos.html`
  - `frontend/relatorio.html`
- `Cronogramas` e `Tarefas` voltaram a carregar o seletor de contexto `Minha Area` no sidebar:
  - `frontend/cronogramas.html`
  - `frontend/tarefas.html`
  - ambos agora incluem `ctx-switcher` e `context.js`
- Dashboard principal sem nascer com valores fake mais visiveis:
  - `frontend/app.html`
- Relatorios reestruturados para nao exibir cards laterais e blocos estaticos como estado inicial:
  - `frontend/relatorio.html`
  - `frontend/relatorio.js`
- Exclusao de disciplina passou a tratar resposta real de erro/sucesso:
  - `frontend/materias.html`

## Diferencas uteis encontradas na branch remota de redesign

Esses itens de backend eram relevantes na branch `feat/redesign-visual-gamificado`:

- login/cadastro retornando `nome` no JWT
- materias filtradas por usuario
- delete de turma
- ajuste SMTP com `family: 4`

Esses pontos ja foram incorporados aqui.

## Problemas ainda em aberto

### 1. Navegacao lateral inconsistente

Situacao:
- A ordem principal do menu ja foi padronizada.
- O problema do bloco lateral extra com personagem tambem foi removido das telas principais.

Impacto:
- O embaralhamento principal do menu foi resolvido.

Acao pendente:
- Apenas revisar visualmente se ainda resta alguma pagina secundaria fora do padrao.

### 2. Dados mockados ainda existem

Situacao:
- Ainda ha trechos estaticos ou parcialmente mockados em:
  - `frontend/app.html`
  - `frontend/relatorio.html`
  - partes de `frontend/relatorio.js`
- Alguns valores de apoio ainda estao "bonitos", mas nao 100% derivados do banco.

Acao pendente:
- Dashboard principal:
  - streak, xp, moedas, recompensa, cronograma do dia, tarefas e conquistas devem vir integralmente do backend.
- Relatorios:
  - revisar se ainda sobra qualquer texto percentual fixo ou grafico residual nao alimentado pelo backend.

### 3. CRUDs precisam ser auditados ponta a ponta

Estado atual:
- Materias: modal existe
- Cronogramas: modal existe
- Tarefas: modal existe
- Metas: modal existe

Pendencias:
- Validar create, update e delete contra o Neon em todas as telas.
- Eliminar qualquer resto de formulario inline antigo.
- Garantir feedback de erro/sucesso consistente.
- Materias ja teve delete melhorado no frontend, mas ainda falta validar os demais CRUDs com fluxo real autenticado.

### 4. Sessao de estudo ainda precisa ser refinada

Estado atual:
- Backend de sessoes existe e o frontend ja conversa com `/api/sessoes`.
- Ao encerrar:
  - persiste sessao
  - registra atividade
  - soma XP
  - tenta desbloquear conquistas
- A tela ja esta no formato pedido com botao inicial grande, modal de escolha de disciplina, `Start`, timer e `Stop`.

Pendencias:
- Validar em uso real com um usuario autenticado no banco se nao ha duplicacao de atividade ou efeito colateral de pontuacao.

### 5. Relatorios ainda nao estao redondos

Situacao:
- `frontend/relatorio.html` ainda mistura estrutura final com blocos estaticos.

Acao pendente:
- Trocar todos os cards superiores por dados reais.
- Remover percentuais e totais fixos.
- Validar historico de sessoes, barras por disciplina e heatmap.

### 6. Padronizacao de portugues

Ja corrigido parcialmente:
- varios textos de login
- alguns textos de sessoes, metas e relatorios

Ainda precisa revisar:
- `frontend/conquistas.html`
- `frontend/turmas.html`
- textos com "Sessoes", "Relatorio", "MatÃ©rias" em arquivos antigos

## Arquivos mais importantes para continuar

### Backend

- `backend/server.js`
- `backend/src/config/migrar.js`
- `backend/src/middlewares/auth.js`
- `backend/src/routes/login.js`
- `backend/src/routes/cadastro.js`
- `backend/src/routes/materias.js`
- `backend/src/routes/senha.js`
- `backend/src/routes/sessoes.js`
- `backend/src/routes/turmas.js`
- `backend/src/services/notificacoesService.js`

### Frontend

- `frontend/app.html`
- `frontend/app.js`
- `frontend/utils.js`
- `frontend/estudos.html`
- `frontend/estudos.js`
- `frontend/materias.html`
- `frontend/metas.html`
- `frontend/cronogramas.html`
- `frontend/cronogramas.js`
- `frontend/tarefas.html`
- `frontend/tarefas.js`
- `frontend/relatorio.html`
- `frontend/relatorio.js`
- `frontend/turmas.html`
- `frontend/conquistas.html`
- `frontend/styles.css`

## Proxima ordem recomendada de trabalho

1. Auditar CRUD real de `materias`, `metas`, `tarefas`, `cronogramas` e `turmas` com usuario autenticado.
2. Fechar os ultimos dados mockados de dashboard e relatorios.
3. Revisar textos/PT-BR restantes e encoding antigo em telas legadas.
4. So depois voltar ao ajuste fino visual do login e dos personagens.

## Observacoes

- O servidor local responde em `http://localhost:3000`.
- A conexao com Neon esta configurada via fallback em `backend/src/config/db.js`.
- A branch atual ja contem alteracoes nao commitadas; revisar com `git diff` antes de commitar.
