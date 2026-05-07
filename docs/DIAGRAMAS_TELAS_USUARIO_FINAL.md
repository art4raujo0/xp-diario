# Diagramas - Telas para Usuario Final

## Diagrama 1 - Fluxo principal do usuario

```mermaid
flowchart TD
    A[Usuario acessa o sistema] --> B[Tela de Login]
    B --> C{Credenciais validas?}
    C -- Nao --> D[Exibir mensagem de erro]
    D --> B
    C -- Sim --> E[Salvar token no navegador]
    E --> F[Redirecionar para /app]
    F --> G[Dashboard com menu lateral]
    G --> H[Exibir streak atual]
    G --> I[Exibir progresso das metas ativas]
    G --> J[Tela de Materias]
    G --> K[Tela de Metas]
```

## Diagrama 2 - Fluxo do dashboard (/app)

```mermaid
flowchart TD
    A[Abrir /app] --> B{Token existe no navegador?}
    B -- Nao --> C[Redirecionar para /login]
    B -- Sim --> D[Consultar /api/streak]
    D --> E[Consultar /api/progresso]
    E --> F{Ha metas cadastradas?}
    F -- Nao --> G[Exibir mensagem de estado vazio]
    F -- Sim --> H[Exibir percentual geral e resumo]
    D --> I{Ha sequencia ativa hoje?}
    I -- Nao --> J[Exibir streak zerado ou offline]
    I -- Sim --> K[Exibir quantidade de dias consecutivos]
```

## Diagrama 3 - Fluxo da tela de materias

```mermaid
flowchart TD
    A[Tela de Materias] --> B[Listar materias]
    B --> C{Existe materia cadastrada?}
    C -- Nao --> D[Exibir estado vazio]
    C -- Sim --> E[Exibir tabela de materias]
    A --> F[Criar nova materia]
    E --> G[Editar materia]
    E --> H[Excluir materia]
    F --> I{Nome valido?}
    G --> I
    I -- Nao --> J[Exibir erro de nome obrigatorio]
    I -- Sim --> K{Materia duplicada?}
    K -- Sim --> L[Exibir erro de duplicidade]
    K -- Nao --> M[Salvar na API]
    H --> N[Confirmar exclusao]
    N --> O[Remover na API]
    M --> B
    O --> B
```

## Diagrama 4 - Fluxo da tela de metas

```mermaid
flowchart TD
    A[Tela de Metas] --> B[Listar metas]
    A --> C[Carregar disciplinas]
    B --> D{Existe meta cadastrada?}
    D -- Nao --> E[Exibir estado vazio]
    D -- Sim --> F[Exibir tabela de metas]
    F --> G[Editar meta]
    F --> H[Excluir meta]
    A --> I[Criar nova meta]
    I --> J{Dados validos?}
    G --> J
    J -- Nao --> K[Exibir erro de validacao]
    J -- Sim --> L[Salvar na API]
    H --> M[Confirmar exclusao]
    M --> N[Remover da API]
    L --> B
    N --> B
```

## Diagrama 5 - Sequencia da autenticacao e carregamento do painel

```mermaid
sequenceDiagram
    participant U as Usuario
    participant TL as Tela de Login
    participant API as API /api/login
    participant APP as Tela /app
    participant ST as API /api/streak
    participant PR as API /api/progresso

    U->>TL: Informa e-mail e senha
    TL->>API: POST /api/login
    API-->>TL: Retorna sucesso ou erro
    alt Login valido
        TL->>TL: Salva token no navegador
        TL->>APP: Redireciona para /app
        APP->>ST: GET /api/streak
        ST-->>APP: Sequencia atual
        APP->>PR: GET /api/progresso
        PR-->>APP: Resumo das metas
        APP-->>U: Exibe dashboard consolidado
    else Login invalido
        TL-->>U: Exibe mensagem de erro
    end
```

## Diagrama 6 - Visao Scrum da entrega

```mermaid
flowchart LR
    A[Backlog da Sprint] --> B[Tela de Login]
    A --> C[Dashboard /app com menu lateral]
    A --> D[Tela de Materias]
    A --> E[Tela de Metas]
    B --> F[Autenticacao inicial]
    C --> G[Indicadores de streak e progresso]
    D --> H[CRUD de materias + regras]
    E --> I[CRUD de metas]
    F --> J[Incremento apresentado]
    G --> J
    H --> J
    I --> J
```

## Como usar na apresentacao

1. Mostrar primeiro o fluxo principal
2. Abrir a tela de login
3. Demonstrar redirecionamento para `/app`
4. Mostrar o dashboard com streak e progresso
5. Navegar para `Materias` e demonstrar as regras de negocio
6. Navegar para `Metas` e mostrar CRUD
7. Fechar com a visao Scrum da entrega
