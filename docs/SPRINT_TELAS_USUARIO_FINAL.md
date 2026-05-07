# Sprint - Telas para Usuario Final

## Visao geral

Esta documentacao apresenta o incremento atual da Sprint do projeto XP Diario.
O fluxo principal para o usuario final continua centrado em autenticacao, navegacao e organizacao do estudo, mas o painel `/app` deixou de ser uma tela vazia e agora resume o andamento dos estudos com indicadores de `streak` e `progresso`.

Escopo funcional atualizado da entrega:

1. Tela de Login
2. Painel principal `/app` com menu lateral
3. Indicador de Sequencia de Estudos (streak)
4. Resumo de Progresso das metas ativas
5. Tela de Metas
6. Tela de Materias

A navegacao segue o fluxo:

1. O usuario acessa o sistema pela tela de login
2. Ao informar credenciais validas, o sistema grava um token no navegador
3. O sistema redireciona para `/app`
4. No painel, o usuario acompanha o resumo do estudo e navega pelo menu lateral
5. O usuario gerencia `Metas` e `Materias`

## Contexto Scrum

### Objetivo da Sprint

Entregar um fluxo utilizavel para o usuario final com autenticacao, painel central de acompanhamento e gerenciamento de estudo por materias e metas.

### Incremento entregue

- Entrada do sistema pela tela de login
- Validacao de credenciais pela API (`/api/login`)
- Bloqueio temporario da conta apos repetidas falhas de login
- Geracao de token JWT e armazenamento no navegador
- Redirecionamento para `/app` apos login com sucesso
- Menu lateral com navegacao para `Dashboard`, `Metas` e `Materias`
- Dashboard com leitura de `streak` em `/api/streak`
- Dashboard com leitura de `progresso` em `/api/progresso`
- CRUD de metas integrado com disciplinas
- CRUD de materias com validacoes de negocio
- Suporte de backend para atividades (`/api/atividades`), que alimentam o calculo de progresso e de streak

### Valor para o usuario

Com essa entrega, o usuario final consegue entrar no sistema, organizar materias, definir metas e acompanhar rapidamente se esta estudando em sequencia e quanto avancou nas metas ativas.

## Tela 1 - Login

### Objetivo

Permitir que o usuario entre no sistema com e-mail e senha.

### O que o usuario encontra na tela

- Campo de e-mail
- Campo de senha
- Botao `Entrar`
- Mensagem visual de sucesso ou erro

### Comportamento esperado

1. O usuario abre `http://localhost:3000/`
2. O sistema mostra a tela de login
3. O usuario informa e-mail e senha
4. A interface envia os dados para a rota `/api/login`
5. Se o login for valido, o sistema salva o token e redireciona para `/app`
6. Se o login falhar, o usuario recebe mensagem de erro na propria tela
7. Em caso de multiplas falhas consecutivas, a conta pode ser bloqueada temporariamente

## Tela 2 - Painel (/app)

### Objetivo

Fornecer um painel inicial com navegacao lateral e indicadores rapidos do estudo.

### O que o usuario encontra na tela

- Titulo `Meu Painel`
- Menu lateral com:
  - Dashboard
  - Metas
  - Materias
- Card `Sequencia de Estudos`
- Card `Progresso das Metas Ativas`

### Comportamento esperado

1. O usuario chega ao painel apos login
2. O frontend verifica a existencia do token salvo
3. Sem token valido, o usuario volta para `/login`
4. Com token, o painel consulta `/api/streak`
5. O painel tambem consulta `/api/progresso`
6. Os indicadores sao exibidos com estado normal, vazio ou offline conforme a resposta da API
7. O usuario pode navegar para `Metas` ou `Materias` pelo menu lateral

### Indicadores do painel

- `Sequencia de Estudos`: mostra a quantidade atual de dias consecutivos com registro de estudo
- `Progresso das Metas Ativas`: mostra percentual geral, tempo estudado, metas atingidas e tarefas concluidas
- Quando nao houver metas cadastradas, o painel exibe mensagem orientando o cadastro
- Quando existirem metas futuras, o painel informa que ainda aguardam inicio

## Tela 3 - Metas

### Objetivo

Permitir que o usuario gerencie metas de estudo de maneira simples.

### O que o usuario encontra na tela

- Botao para criar meta
- Formulario com tipo, tempo, disciplina e data de inicio
- Lista de metas cadastradas
- Acoes para editar e excluir

### Operacoes disponiveis

- Criar meta
- Listar metas
- Editar meta
- Excluir meta

### Observacoes funcionais

- A meta depende de uma disciplina cadastrada
- A data de inicio influencia se a meta ja esta ativa para calculo de progresso
- O progresso consolidado das metas e mostrado no dashboard

## Tela 4 - Materias

### Objetivo

Permitir que o usuario cadastre e organize materias para apoiar o planejamento de estudos.

### Campos

- Nome da materia
- Dificuldade
- Descricao
- Cor

### Regras de negocio

- Nao permitir materias duplicadas no cadastro
- Nome da materia nao pode ser vazio
- O nome e normalizado com `trim` antes da gravacao

### Comportamento esperado

1. A tela carrega a lista de materias ja cadastradas
2. O usuario pode criar uma nova materia
3. O usuario pode editar materia existente
4. O usuario pode excluir materia
5. Ao tentar salvar com nome vazio, o sistema exibe erro
6. Ao tentar salvar materia duplicada, o sistema exibe erro

## Dependencias tecnicas do acompanhamento

O resumo de `streak` e `progresso` depende dos registros de atividade no backend:

- Script de apoio: `backend/sql/001_create_atividade.sql`
- API de apoio: `/api/atividades`
- API de calculo do painel: `/api/streak` e `/api/progresso`

Nao existe, no estado atual, uma tela final dedicada para cadastro de atividades; esse dado e consumido pelo backend para alimentar os indicadores do painel.

## Fluxo funcional da entrega

1. Usuario acessa o sistema
2. Realiza login
3. Entra no painel `/app`
4. Visualiza a sequencia de estudos e o progresso consolidado
5. Navega para `Materias` para cadastrar e organizar disciplinas
6. Navega para `Metas` para planejar o estudo
7. Retorna ao painel para acompanhar os indicadores

## Criterios de aceite da Sprint

- A tela inicial do sistema deve ser a de login
- O login deve enviar credenciais para a API
- O usuario deve ser redirecionado para `/app` apos login com sucesso
- O painel deve exibir menu lateral com acesso a Dashboard, Metas e Materias
- O painel deve consultar e exibir dados de streak e progresso
- A tela de materias deve permitir cadastrar com nome valido
- A tela de materias deve exibir erro quando o nome estiver vazio
- A tela de materias nao deve permitir duplicidade de nome no cadastro
- A tela de metas deve manter operacoes de listar, criar, editar e excluir
- O progresso deve considerar apenas metas ativas e atividades do periodo correspondente

## Roteiro rapido para apresentacao

1. Mostrar a tela inicial em `http://localhost:3000/`
2. Demonstrar login com sucesso
3. Mostrar redirecionamento para `/app`
4. Apresentar os cards de streak e progresso no dashboard
5. Navegar para `Materias` e cadastrar uma materia
6. Demonstrar validacao de nome vazio e bloqueio de duplicidade
7. Navegar para `Metas` e demonstrar listagem, criacao, edicao e exclusao
8. Retornar ao dashboard e relacionar o painel com os dados de metas e atividades

## Resultado da Sprint

O time entregou um fluxo utilizavel para o usuario final com autenticacao, painel de acompanhamento, cadastro de materias e gerenciamento de metas, preservando a proposta original da Sprint e ampliando a capacidade de acompanhamento do estudo no proprio sistema.
