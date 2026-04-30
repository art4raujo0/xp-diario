# Sprint - Telas para Usuario Final

## Visao geral

Esta documentacao apresenta o incremento entregue na Sprint atual do projeto XP Diario.
O foco desta entrega foi disponibilizar duas telas principais para o usuario final:

1. Tela de Login
2. Tela de Metas

A navegacao foi pensada de forma simples:

1. O usuario acessa o sistema pela tela de login
2. Ao informar credenciais validas, o sistema redireciona para a tela de metas
3. Na tela de metas, o usuario pode visualizar, criar, editar e excluir metas de estudo

## Contexto Scrum

### Objetivo da Sprint

Entregar um fluxo inicial de uso do sistema para o usuario final, com autenticacao basica e gerenciamento de metas de estudo.

### Incremento entregue

- Entrada do sistema pela tela de login
- Validacao de credenciais pela API
- Redirecionamento para a tela de metas apos login com sucesso
- Cadastro, listagem, edicao e exclusao de metas
- Integracao da tela de metas com disciplinas cadastradas

### Valor para o usuario

Com essa entrega, o usuario final consegue iniciar a jornada no sistema e organizar metas de estudo em um unico fluxo.

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
5. Se o login for valido, o sistema redireciona para `/metas`
6. Se o login falhar, o usuario recebe uma mensagem de erro na propria tela

### Regras percebidas pelo usuario

- Campos obrigatorios
- Validacao de credenciais
- Retorno visual para tentativa invalida
- Entrada no sistema somente apos autenticacao bem-sucedida

## Tela 2 - Metas

### Objetivo

Permitir que o usuario gerencie metas de estudo de maneira simples.

### O que o usuario encontra na tela

- Botao para criar meta
- Formulario com tipo, tempo, disciplina e data
- Lista de metas cadastradas
- Acoes para editar e excluir

### Comportamento esperado

1. A tela carrega as disciplinas disponiveis
2. A tela carrega as metas ja cadastradas
3. Se nao houver metas, o sistema mostra uma mensagem de estado vazio
4. O usuario pode criar uma nova meta
5. O usuario pode editar uma meta existente
6. O usuario pode excluir uma meta com confirmacao

### Operacoes disponiveis

- Criar meta
- Listar metas
- Editar meta
- Excluir meta

## Fluxo funcional da entrega

1. Usuario acessa o sistema
2. Realiza login
3. Entra na tela de metas
4. Consulta metas existentes
5. Cadastra ou altera metas conforme necessidade

## Criterios de aceite da Sprint

- A tela inicial do sistema deve ser a de login
- O login deve enviar credenciais para a API
- O usuario deve ser redirecionado para a tela de metas apos login com sucesso
- A tela de metas deve permitir listar registros
- A tela de metas deve permitir criar novos registros
- A tela de metas deve permitir editar registros existentes
- A tela de metas deve permitir excluir registros

## Roteiro rapido para apresentacao

1. Mostrar a tela inicial em `http://localhost:3000/`
2. Explicar que o sistema inicia pelo login
3. Demonstrar uma tentativa de login
4. Mostrar o redirecionamento para a tela de metas
5. Cadastrar uma meta
6. Editar a meta criada
7. Excluir a meta
8. Encerrar reforcando o incremento entregue na Sprint

## Resultado da Sprint

O time entregou um primeiro fluxo utilizavel para o usuario final, ligando autenticacao e gerenciamento de metas dentro de uma navegacao simples e objetiva.
