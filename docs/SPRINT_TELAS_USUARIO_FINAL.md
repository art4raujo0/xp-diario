# Sprint - Telas para Usuario Final

## Visao geral

Esta documentacao apresenta o incremento entregue na Sprint atual do projeto XP Diario.
O foco desta entrega foi disponibilizar o fluxo inicial completo de navegacao do usuario final:

1. Tela de Login
2. Tela base do sistema (Painel com menu lateral)
3. Tela de Metas
4. Tela de Materias

A navegacao segue o fluxo:

1. O usuario acessa o sistema pela tela de login
2. Ao informar credenciais validas, o sistema redireciona para `/app`
3. No painel, o usuario usa o menu lateral para navegar entre Metas e Materias

## Contexto Scrum

### Objetivo da Sprint

Entregar um fluxo inicial de uso do sistema para o usuario final, com autenticacao basica e gerenciamento de estudo por metas e materias.

### Incremento entregue

- Entrada do sistema pela tela de login
- Validacao de credenciais pela API (`/api/login`)
- Redirecionamento para `/app` apos login com sucesso
- Menu lateral com navegacao para `Metas` e `Materias`
- CRUD de metas integrado com disciplinas
- CRUD de materias com os campos da historia de usuario
- Regra de negocio de materia aplicada:
  - Nome obrigatorio
  - Bloqueio de materia duplicada

### Valor para o usuario

Com essa entrega, o usuario final consegue iniciar a jornada no sistema, organizar materias de estudo e definir metas em um unico fluxo.

## Tela 1 - Login

### Objetivo

Permitir que o usuario entre no sistema com e-mail e senha.

### O que o usuario encontra na tela

- Campo de e-mail
- Campo de senha
- Botao "Entrar"
- Mensagem visual de sucesso ou erro

### Comportamento esperado

1. O usuario abre `http://localhost:3000/`
2. O sistema mostra a tela de login
3. O usuario informa e-mail e senha
4. A interface envia os dados para a rota `/api/login`
5. Se o login for valido, o sistema redireciona para `/app`
6. Se o login falhar, o usuario recebe uma mensagem de erro na propria tela

## Tela 2 - Painel (/app)

### Objetivo

Fornecer uma tela base em branco com menu lateral para navegacao do usuario.

### O que o usuario encontra na tela

- Area principal em branco
- Menu lateral com:
  - Metas
  - Materias

### Comportamento esperado

1. O usuario chega ao painel apos login
2. Escolhe uma funcionalidade no menu lateral
3. E redirecionado para a tela correspondente

## Tela 3 - Metas

### Objetivo

Permitir que o usuario gerencie metas de estudo de maneira simples.

### O que o usuario encontra na tela

- Botao para criar meta
- Formulario com tipo, tempo, disciplina e data
- Lista de metas cadastradas
- Acoes para editar e excluir

### Operacoes disponiveis

- Criar meta
- Listar metas
- Editar meta
- Excluir meta

## Tela 4 - Materias

### Objetivo

Permitir que o usuario cadastre e organize materias para apoiar o planejamento de estudos.

### Campos

- Nome da materia
- Dificuldade
- Descricao
- Cor

### Regras de negocio

- Nao permitir materias duplicadas
- Nome da materia nao pode ser vazio

### Comportamento esperado

1. A tela carrega a lista de materias ja cadastradas
2. O usuario pode criar uma nova materia
3. O usuario pode editar materia existente
4. O usuario pode excluir materia
5. Ao tentar salvar com nome vazio, o sistema exibe erro
6. Ao tentar salvar materia duplicada, o sistema exibe erro

## Fluxo funcional da entrega

1. Usuario acessa o sistema
2. Realiza login
3. Entra no painel `/app`
4. Navega para `Materias` para cadastrar e organizar disciplinas
5. Navega para `Metas` para planejar o estudo

## Criterios de aceite da Sprint

- A tela inicial do sistema deve ser a de login
- O login deve enviar credenciais para a API
- O usuario deve ser redirecionado para `/app` apos login com sucesso
- O painel deve exibir menu lateral com acesso a Metas e Materias
- A tela de materias deve permitir cadastrar com nome valido
- A tela de materias deve exibir erro quando o nome estiver vazio
- A tela de materias nao deve permitir duplicidade de nome
- A tela de metas deve manter operacoes de listar, criar, editar e excluir

## Roteiro rapido para apresentacao

1. Mostrar a tela inicial em `http://localhost:3000/`
2. Demonstrar login com sucesso
3. Mostrar redirecionamento para `/app`
4. Navegar para `Materias` e cadastrar uma materia
5. Demonstrar validacao de nome vazio
6. Demonstrar bloqueio de materia duplicada
7. Navegar para `Metas` e demonstrar listagem/edicao/exclusao

## Resultado da Sprint

O time entregou um fluxo utilizavel para o usuario final com autenticacao, painel de navegacao, cadastro de materias e gerenciamento de metas de estudo.
