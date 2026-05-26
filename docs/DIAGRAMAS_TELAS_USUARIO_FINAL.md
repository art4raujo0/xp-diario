# Diagramas - Estado Atual

## Diagrama 1 - Fluxo principal autenticado

```mermaid
flowchart TD
    A[Usuario acessa o sistema] --> B[Login/Cadastro]
    B --> C{Credenciais validas?}
    C -- Nao --> D[Exibir erro]
    D --> B
    C -- Sim --> E[Gerar token JWT]
    E --> F[Entrar no app]
    F --> G[Registrar atividades]
    F --> H[Gerenciar metas e materias]
    G --> I[Atualizar pontos]
    G --> J[Recalcular conquistas]
    F --> K[Consultar perfil]
    F --> L[Configurar notificacoes de lembrete]
```

## Diagrama 2 - Sequencia do registro de estudo

```mermaid
sequenceDiagram
    participant U as Usuario
    participant APP as Frontend
    participant API as POST /api/atividades
    participant DB as Banco

    U->>APP: Registra estudo
    APP->>API: Envia atividade + Bearer token
    API->>DB: Salva atividade do usuario
    API->>DB: Soma pontos no usuario
    API->>DB: Avalia/desbloqueia conquistas elegiveis
    API-->>APP: Atividade + pontos + conquistas desbloqueadas
```

## Diagrama 3 - Consulta de perfil

```mermaid
flowchart LR
    A[GET /api/perfil] --> B[Validar JWT]
    B --> C[Buscar usuario]
    C --> D[Retornar us_pontos_total]
```

## Diagrama 4 - Consulta de streak (estado atual da resposta)

```mermaid
flowchart LR
    A[GET /api/streak] --> B[Validar JWT]
    B --> C[Buscar datas em atividade por usuario]
    C --> D[Calcular streak atual]
    D --> E[Retornar streak + total_registros + dias_registrados]
```
