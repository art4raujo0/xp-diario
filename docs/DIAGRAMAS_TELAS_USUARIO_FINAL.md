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
    F --> G[Tela base com menu lateral]
    G --> H[Tela de Materias]
    G --> I[Tela de Metas]
```

## Diagrama 2 - Fluxo da tela de materias

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

## Diagrama 3 - Fluxo da tela de metas

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
    I --> J[Salvar na API]
    G --> J
    H --> K[Confirmar exclusao]
    K --> L[Remover da API]
    J --> B
    L --> B
```

## Diagrama 4 - Sequencia da autenticacao e navegacao

```mermaid
sequenceDiagram
    participant U as Usuario
    participant TL as Tela de Login
    participant API as API /api/login
    participant APP as Tela /app
    participant TMAT as Tela Materias
    participant TMET as Tela Metas

    U->>TL: Informa e-mail e senha
    TL->>API: POST /api/login
    API-->>TL: Retorna sucesso ou erro
    alt Login valido
        TL->>TL: Salva token no navegador
        TL->>APP: Redireciona para /app
        APP->>TMAT: Navega por menu lateral
        APP->>TMET: Navega por menu lateral
    else Login invalido
        TL-->>U: Exibe mensagem de erro
    end
```

## Diagrama 5 - Visao Scrum da entrega

```mermaid
flowchart LR
    A[Backlog da Sprint] --> B[Tela de Login]
    A --> C[Tela /app com menu lateral]
    A --> D[Tela de Materias]
    A --> E[Tela de Metas]
    B --> F[Autenticacao inicial]
    C --> G[Navegacao do usuario]
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
4. Mostrar o menu lateral e navegar para Materias
5. Demonstrar regras de negocio de Materias
6. Navegar para Metas e mostrar CRUD
7. Fechar com a visao Scrum da entrega
