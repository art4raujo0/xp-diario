# Artefatos Visuais Atualizados

Este arquivo consolida a leitura e a atualizacao conceitual dos artefatos raster da pasta `docs`:

- `DER.png`
- `Diagrama de caso de Uso.png`
- `Diagrama de Classe.png`
- `Fluxograma N1.jpeg`
- `Fluxograma N2.jpeg`

Os arquivos em imagem permanecem como exportacoes estaticas da documentacao, enquanto este Markdown passa a ser a referencia textual atualizada do sistema.

## 1. DER atualizado

```mermaid
erDiagram
    USUARIOS {
        INT us_id PK
        VARCHAR us_email
        VARCHAR us_senha
        VARCHAR us_senha_hash
        INT us_tentativas_falhas
        TIMESTAMP us_bloqueado_ate
    }

    DISCIPLINA {
        INT di_id PK
        VARCHAR di_disciplina
        VARCHAR di_dificuldade
        TEXT di_descricao
        VARCHAR di_cor
    }

    META {
        INT me_id PK
        VARCHAR me_tipo
        INT me_tempo_min
        DATE me_data_inicio
        INT me_disciplina FK
    }

    ATIVIDADE {
        INT at_id PK
        INT at_disciplina FK
        INT at_tempo_min
        INT at_tarefas_concluidas
        DATE at_data
        VARCHAR at_descricao
        TIMESTAMP at_criado_em
    }

    DISCIPLINA ||--o{ META : organiza
    DISCIPLINA ||--o{ ATIVIDADE : recebe
```

### Leitura

- `disciplina` continua sendo a base organizacional do estudo
- `meta` permanece vinculada a uma disciplina
- `atividade` passa a ser o insumo operacional do dashboard, alimentando `streak` e `progresso`
- `usuarios` participa da autenticacao e da politica de bloqueio de login

## 2. Diagrama de caso de uso atualizado

```mermaid
flowchart LR
    U[Usuario] --> L[Realizar login]
    U --> VD[Visualizar dashboard]
    U --> VS[Acompanhar sequencia de estudos]
    U --> VP[Acompanhar progresso das metas]
    U --> CM[Cadastrar materia]
    U --> EM[Editar materia]
    U --> XM[Excluir materia]
    U --> LM[Visualizar materias]
    U --> CR[Criar meta]
    U --> ER[Editar meta]
    U --> XR[Excluir meta]
    U --> LR[Visualizar metas]
```

### Leitura

O caso de uso original foi preservado e ampliado com a visualizacao do dashboard, da sequencia de estudos e do progresso das metas, que agora fazem parte do fluxo real da aplicacao.

## 3. Diagrama de classes atualizado

```mermaid
classDiagram
    class Usuario {
        +int us_id
        +string us_email
        +string us_senha_hash
        +int us_tentativas_falhas
        +timestamp us_bloqueado_ate
        +login(email, senha)
    }

    class Disciplina {
        +int di_id
        +string di_disciplina
        +string di_dificuldade
        +text di_descricao
        +string di_cor
        +criarDisciplina()
        +editarDisciplina()
        +removerDisciplina()
    }

    class Meta {
        +int me_id
        +string me_tipo
        +int me_tempo_min
        +date me_data_inicio
        +int me_disciplina
        +criarMeta()
        +editarMeta()
        +removerMeta()
    }

    class Atividade {
        +int at_id
        +int at_disciplina
        +int at_tempo_min
        +int at_tarefas_concluidas
        +date at_data
        +string at_descricao
        +registrarAtividade()
    }

    class StreakService {
        +calcularStreak(datas)
        +calcularStreakAtual(datas)
    }

    class ProgressoResumo {
        +percentualGeral
        +metasAtivas
        +metasAtingidas
        +totalTempoEstudadoMin
        +totalTarefasConcluidas
    }

    Disciplina "1" --> "*" Meta : possui
    Disciplina "1" --> "*" Atividade : recebe
    Atividade --> StreakService : alimenta
    Meta --> ProgressoResumo : compoe
    Atividade --> ProgressoResumo : alimenta
```

### Leitura

- A relacao principal `Disciplina -> Meta` foi mantida
- `Atividade` foi adicionada porque hoje ela e necessaria para o comportamento do painel
- `StreakService` representa a regra de negocio de sequencia de estudos
- `ProgressoResumo` representa a consolidacao exibida no dashboard

## 4. Fluxogramas atualizados

Os fluxogramas originalmente exportados em `Fluxograma N1.jpeg` e `Fluxograma N2.jpeg` continuam coerentes com a proposta da Sprint, mas o sistema atual exige complementar a leitura com:

- entrada no dashboard `/app`
- exibicao de `streak`
- exibicao de `progresso`
- dependencia de atividades para alimentar os indicadores

Os fluxos atualizados em formato Mermaid estao documentados em:

- `DIAGRAMAS_TELAS_USUARIO_FINAL.md`

## 5. Estado atual consolidado

Resumo do sistema documentado hoje:

1. O usuario faz login e recebe token JWT
2. O sistema redireciona para `/app`
3. O dashboard mostra sequencia de estudos e progresso das metas
4. O usuario continua gerenciando materias e metas
5. O backend usa atividades para calcular os indicadores exibidos ao usuario
