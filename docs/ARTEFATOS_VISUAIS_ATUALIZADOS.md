# Artefatos Visuais Atualizados

Este arquivo consolida o estado real do codigo backend apos as historias de:

- conquistas automaticas por usuario
- pontuacao acumulativa por estudo
- notificacoes de lembrete por email

## DER vigente (texto fonte)

```mermaid
erDiagram
    USUARIOS {
        INT us_id PK
        VARCHAR us_nome
        VARCHAR us_email
        VARCHAR us_senha_hash
        INT us_tentativas_falhas
        TIMESTAMP us_bloqueado_ate
        INT us_pontos_total
    }

    DISCIPLINA {
        INT di_id PK
        VARCHAR di_disciplina
    }

    META {
        INT me_id PK
        VARCHAR me_tipo
        INT me_tempo_min
        DATE me_data_inicio
        INT me_disciplina FK
        INT me_usuario_id FK
    }

    ATIVIDADE {
        INT at_id PK
        INT at_disciplina FK
        INT at_usuario_id FK
        INT at_tempo_min
        INT at_tarefas_concluidas
        DATE at_data
    }

    CONQUISTA {
        INT co_id PK
        VARCHAR co_codigo
        VARCHAR co_titulo
        VARCHAR co_criterio_tipo
        INT co_criterio_valor
    }

    USUARIO_CONQUISTA {
        INT uc_id PK
        INT uc_usuario_id FK
        INT uc_conquista_id FK
        TIMESTAMP uc_desbloqueado_em
    }

    NOTIFICACOES_CONFIG {
        INT nc_id PK
        INT nc_usuario_id FK
        BOOLEAN nc_ativo
        TIME nc_horario
        VARCHAR nc_fuso_horario
        DATE nc_ultimo_envio
        TIMESTAMP nc_atualizado_em
    }

    USUARIOS ||--o{ META : possui
    USUARIOS ||--o{ ATIVIDADE : registra
    USUARIOS ||--o{ USUARIO_CONQUISTA : desbloqueia
    USUARIOS ||--o| NOTIFICACOES_CONFIG : configura
    CONQUISTA ||--o{ USUARIO_CONQUISTA : referencia
    DISCIPLINA ||--o{ META : organiza
    DISCIPLINA ||--o{ ATIVIDADE : recebe
```

## Observacao

As imagens raster (`.png` e `.jpeg`) da pasta `docs` podem permanecer defasadas visualmente. A referencia vigente para arquitetura e regras passa a ser os arquivos Markdown e Mermaid atualizados.
