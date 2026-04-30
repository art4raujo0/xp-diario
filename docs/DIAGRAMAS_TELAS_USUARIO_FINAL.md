# Diagramas - Telas para Usuario Final

## Diagrama 1 - Fluxo principal do usuario

```mermaid
flowchart TD
    A[Usuario acessa o sistema] --> B[Tela de Login]
    B --> C{Credenciais validas?}
    C -- Nao --> D[Exibir mensagem de erro]
    D --> B
    C -- Sim --> E[Salvar token no navegador]
    E --> F[Redirecionar para a Tela de Metas]
    F --> G[Listar metas e disciplinas]
```

## Diagrama 2 - Fluxo da tela de metas

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

## Diagrama 3 - Sequencia da autenticacao

```mermaid
sequenceDiagram
    participant U as Usuario
    participant TL as Tela de Login
    participant API as API /api/login
    participant TM as Tela de Metas

    U->>TL: Informa e-mail e senha
    TL->>API: POST /api/login
    API-->>TL: Retorna sucesso ou erro
    alt Login valido
        TL->>TL: Salva token no navegador
        TL->>TM: Redireciona para /metas
    else Login invalido
        TL-->>U: Exibe mensagem de erro
    end
```

## Diagrama 4 - Visao Scrum da entrega

```mermaid
flowchart LR
    A[Backlog da Sprint] --> B[Tela de Login]
    A --> C[Tela de Metas]
    B --> D[Autenticacao inicial]
    C --> E[CRUD de metas]
    D --> F[Incremento apresentado]
    E --> F
```

## Como usar na apresentacao

1. Mostrar primeiro o diagrama de fluxo principal
2. Em seguida abrir a tela de login
3. Depois mostrar a tela de metas
4. Fechar com o diagrama Scrum para explicar o incremento da Sprint
