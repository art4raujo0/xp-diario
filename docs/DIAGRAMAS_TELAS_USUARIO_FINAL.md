# Diagramas - Estado Atual do Sistema

Data de referencia: 2026-06-18

Os arquivos fonte Mermaid estao em `docs/mermaid/`.

---

## Diagrama 1 - Fluxo principal de autenticacao e navegacao

Arquivo: `docs/mermaid/Fluxograma N1.mmd`

```mermaid
flowchart TD
    START([Usuario acessa o sistema]) --> LOGIN[Tela de Login]
    LOGIN --> CRED{Credenciais validas?}
    CRED -- Nao --> ERRO[Exibir erro / incrementar tentativas]
    ERRO --> BLOQ{Conta bloqueada?}
    BLOQ -- Sim --> MSG_BLOQ[Exibir mensagem de bloqueio]
    BLOQ -- Nao --> LOGIN
    CRED -- Sim --> JWT[Gerar token JWT 24h]
    JWT --> APP[Dashboard principal]

    APP --> DISC[/Disciplinas/]
    APP --> META[/Metas/]
    APP --> TAR[/Tarefas/]
    APP --> CRON[/Cronograma/]
    APP --> SESS[/Sessao de Estudo/]
    APP --> REL[/Relatorios/]
    APP --> PERF[/Perfil/]
    APP --> TURM[/Turmas/]
    APP --> CONQ[/Conquistas/]

    SESS --> MODAL[Modal: escolher disciplina]
    MODAL --> INICIAR[POST /api/sessoes/iniciar]
    INICIAR --> TIMER[Timer em andamento]
    TIMER --> STOP[Stop]
    STOP --> ENCERRAR[PATCH /api/sessoes/:id/encerrar]
    ENCERRAR --> XP[Somar XP = minutos estudados]
    XP --> UNLOCK[Avaliar conquistas elegiveis]
    UNLOCK --> APP
```

---

## Diagrama 2 - Fluxo da sessao de estudo (detalhe tecnico)

Arquivo: `docs/mermaid/Fluxograma N2.mmd`

Detalha a comunicacao entre frontend (`estudos.html` + `estudos.js`), backend (routes/sessoes.js) e banco de dados durante uma sessao completa de estudo.

Pontos principais:
- O frontend verifica sessao ativa ao carregar a pagina
- Se ha sessao ativa, o timer e retomado de onde parou (`se_segundos_focados + elapsed`)
- Ao encerrar: calcula minutos, cria atividade, soma XP, avalia conquistas

---

## Diagrama 3 - Diagrama de Entidade-Relacionamento

Arquivo: `docs/mermaid/DER.mmd`

O banco possui 13 tabelas. Principais relacoes:

- `USUARIOS` e o centro — todas as outras tabelas referenciam `us_id`
- `DISCIPLINA` e de propriedade do usuario que a criou (`di_usuario_id`)
- `SESSAO_ESTUDO` encerrada gera automaticamente um registro em `ATIVIDADE`
- `ATIVIDADE` dispara avaliacao de conquistas em `USUARIO_CONQUISTA`
- `TAREFA` tem auditoria completa em `TAREFA_HISTORICO`
- `TURMA` vincula professor (criador) a alunos via `TURMA_ALUNO`

---

## Diagrama 4 - Diagrama de Classes

Arquivo: `docs/mermaid/Diagrama de Classe.mmd`

Representa as 13 entidades de dominio mais 2 servicos:

- `ConquistasService`: avalia e desbloqueia conquistas por criterio (tempo total, streak, metas)
- `NotificacoesService`: envia lembretes por email conforme configuracao do usuario

---

## Diagrama 5 - Diagrama de Casos de Uso

Arquivo: `docs/mermaid/Diagrama de caso de Uso.mmd`

Tres atores: **Aluno**, **Professor**, **Administrador**.

| Ator       | Funcionalidades exclusivas                                  |
|------------|-------------------------------------------------------------|
| Aluno      | Cadastro, entrar em turma via codigo                        |
| Professor  | Criar turma, gerenciar alunos, ver codigos de acesso        |
| Admin      | Acesso irrestrito a todas as turmas                         |
| Todos      | Login, disciplinas, relatorios, conquistas, perfil, XP      |

---

## Diagrama 6 - Sequencia do registro de estudo (via sessao)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant APP as Frontend
    participant API as Backend
    participant DB as Banco

    U->>APP: Clica em Iniciar Sessao
    APP->>API: POST /api/sessoes/iniciar { disciplina }
    API->>DB: INSERT sessao_estudo status=iniciada
    API-->>APP: { sessao: { id, status, inicio, ... } }
    APP->>APP: setInterval 1s - atualiza timer display

    U->>APP: Clica em Stop
    APP->>API: PATCH /api/sessoes/:id/encerrar
    API->>DB: SELECT EXTRACT(EPOCH...) para calcular segundos
    API->>DB: UPDATE sessao_estudo status=encerrada
    API->>DB: INSERT atividade (se minutos > 0)
    API->>DB: UPDATE usuarios SET us_pontos_total += minutos
    API->>DB: Avaliar e INSERT usuario_conquista se elegivel
    API-->>APP: { minutos, totalPontos, conquistasDesbloqueadas }
    APP->>APP: Atualiza UI e exibe mensagem de sucesso
```

---

## Diagrama 7 - Consulta de perfil e streak

```mermaid
flowchart LR
    A[GET /api/perfil] --> B[Validar JWT]
    B --> C[Buscar usuario no banco]
    C --> D[Retornar us_pontos_total, us_nome, us_email]

    E[GET /api/streak] --> F[Validar JWT]
    F --> G[Buscar datas de atividade por usuario]
    G --> H[Calcular streak atual consecutivo]
    H --> I[Retornar streak + total_registros + dias_registrados]
```
