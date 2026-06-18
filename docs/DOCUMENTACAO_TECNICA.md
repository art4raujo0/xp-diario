# XP Diario — Documentacao Tecnica

**Data:** 2026-06-18
**Versao:** 2.0 (branch feat/relayout)
**Autor:** Arthur Araujo

---

## 1. Visao Geral do Sistema

XP Diario e uma plataforma web gamificada de gestao de estudos. O usuario acumula experiencia (XP) proporcional ao tempo que estuda, desbloqueia conquistas, organiza tarefas e cronogramas, e acompanha seu desempenho em relatorios.

### Perfil de usuarios

| Tipo      | Descricao                                                           |
|-----------|---------------------------------------------------------------------|
| aluno     | Usuario padrao. Acessa todas as funcionalidades de estudo pessoal   |
| professor | Pode criar e gerenciar turmas de alunos                             |
| admin     | Acesso irrestrito a turmas e configuracoes do sistema               |

---

## 2. Arquitetura

```
xp-diario/
  backend/
    server.js               Ponto de entrada, Express v5, middlewares, rotas
    src/
      config/
        db.js               Pool de conexao com PostgreSQL (Neon serverless)
        migrar.js           Criacao e migracao de tabelas
      middlewares/
        auth.js             Validacao de JWT, populacao de req.usuario
      routes/
        login.js            POST /api/login
        cadastro.js         POST /api/cadastro
        senha.js            POST /api/senha/esqueci e /redefinir
        materias.js         CRUD /api/materias
        metas.js            CRUD /api/metas
        tarefas.js          CRUD /api/tarefas
        cronogramas.js      CRUD /api/cronogramas
        sessoes.js          CRUD /api/sessoes
        atividades.js       GET+POST /api/atividades
        progresso.js        GET /api/progresso
        streak.js           GET /api/streak
        conquistas.js       GET /api/conquistas
        perfil.js           GET /api/perfil
        notificacoes.js     GET+PUT /api/notificacoes
        turmas.js           CRUD /api/turmas
        relatorio.js        GET /api/relatorio
        admin.js            /api/admin (restrito)
      services/
        notificacoesService.js  Envio de lembretes por SMTP
  frontend/
    styles.css              Design system: variaveis, layout, componentes
    utils.js                Funcoes compartilhadas (auth, formatacao, modais)
    context.js              Gerenciamento de contexto (turma ativa)
    index.html              Login
    cadastro.html           Cadastro
    resetar-senha.html      Redefinicao de senha
    app.html + app.js       Dashboard
    materias.html           Disciplinas
    metas.html              Metas
    tarefas.html + js       Tarefas
    cronogramas.html + js   Cronograma
    estudos.html + js       Sessao de Estudo
    relatorio.html + js     Relatorios
    conquistas.html + js    Conquistas
    perfil.html + js        Perfil
    turmas.html + js        Turmas
    assets/                 Imagens e sprites pixel art
```

### Stack tecnologica

| Camada     | Tecnologia                               |
|------------|------------------------------------------|
| Backend    | Node.js + Express v5                     |
| Banco      | PostgreSQL 16 (Neon serverless, AWS sa-east-1) |
| Auth       | JWT (jsonwebtoken, 24h), bcrypt          |
| Frontend   | HTML5 + Bootstrap 5.3.3 + FontAwesome 6  |
| Email      | Nodemailer + SMTP com IPv4 forcado       |
| Deploy     | Servidor local porta 3000                |

---

## 3. Banco de Dados

### 3.1 Tabelas

**USUARIOS**
```
us_id               SERIAL PRIMARY KEY
us_nome             VARCHAR(120)
us_email            VARCHAR(255) UNIQUE NOT NULL
us_senha_hash       VARCHAR(255)
us_tentativas_falhas INTEGER DEFAULT 0
us_bloqueado_ate    TIMESTAMP NULL
us_criado_em        TIMESTAMP DEFAULT NOW()
us_pontos_total     INTEGER DEFAULT 0 CHECK (>= 0)
us_tipo             VARCHAR(20) DEFAULT 'aluno' CHECK IN ('admin','professor','aluno')
us_reset_token_hash VARCHAR(64) NULL
us_reset_expira_em  TIMESTAMP NULL
```

**DISCIPLINA**
```
di_id           SERIAL PRIMARY KEY
di_disciplina   VARCHAR(120) NOT NULL
di_dificuldade  VARCHAR(30)
di_descricao    TEXT
di_cor          VARCHAR(20)
di_usuario_id   INTEGER NULL REFERENCES usuarios(us_id) ON DELETE CASCADE
di_criado_em    TIMESTAMP DEFAULT NOW()
```

**META**
```
me_id           SERIAL PRIMARY KEY
me_tipo         VARCHAR(20) NOT NULL
me_tempo_min    INTEGER NOT NULL CHECK (> 0)
me_disciplina   INTEGER NULL REFERENCES disciplina(di_id) ON DELETE SET NULL
me_data_inicio  DATE NULL
me_usuario_id   INTEGER NULL REFERENCES usuarios(us_id) ON DELETE CASCADE
me_criado_em    TIMESTAMP DEFAULT NOW()
```

**ATIVIDADE**
```
at_id                   SERIAL PRIMARY KEY
at_disciplina           INTEGER NOT NULL REFERENCES disciplina(di_id) ON DELETE CASCADE
at_usuario_id           INTEGER NULL REFERENCES usuarios(us_id) ON DELETE CASCADE
at_tempo_min            INTEGER NOT NULL CHECK (> 0)
at_tarefas_concluidas   INTEGER DEFAULT 0 CHECK (>= 0)
at_data                 DATE DEFAULT CURRENT_DATE
at_descricao            VARCHAR(255)
at_criado_em            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
INDEX: idx_atividade_usuario_data (at_usuario_id, at_data)
```

**CONQUISTA**
```
co_id               SERIAL PRIMARY KEY
co_codigo           VARCHAR(60) UNIQUE NOT NULL
co_titulo           VARCHAR(120) NOT NULL
co_descricao        VARCHAR(255) NOT NULL
co_criterio_tipo    VARCHAR(40) NOT NULL
co_criterio_valor   INTEGER NOT NULL CHECK (> 0)
co_criado_em        TIMESTAMP DEFAULT NOW()
```

**USUARIO_CONQUISTA**
```
uc_id               SERIAL PRIMARY KEY
uc_usuario_id       INTEGER NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE
uc_conquista_id     INTEGER NOT NULL REFERENCES conquista(co_id) ON DELETE CASCADE
uc_desbloqueado_em  TIMESTAMP DEFAULT NOW()
UNIQUE (uc_usuario_id, uc_conquista_id)
```

**NOTIFICACOES_CONFIG**
```
nc_id           SERIAL PRIMARY KEY
nc_usuario_id   INTEGER UNIQUE NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE
nc_ativo        BOOLEAN DEFAULT FALSE
nc_horario      TIME DEFAULT '08:00'
nc_fuso_horario VARCHAR(80) DEFAULT 'America/Sao_Paulo'
nc_ultimo_envio DATE NULL
nc_atualizado_em TIMESTAMP DEFAULT NOW()
```

**TAREFA**
```
ta_id               SERIAL PRIMARY KEY
ta_titulo           VARCHAR(160) NOT NULL
ta_descricao        TEXT NULL
ta_prazo            DATE NULL
ta_disciplina_id    INTEGER NULL REFERENCES disciplina(di_id) ON DELETE SET NULL
ta_usuario_id       INTEGER NULL REFERENCES usuarios(us_id) ON DELETE CASCADE
ta_concluida        BOOLEAN DEFAULT FALSE
ta_status           VARCHAR(20) DEFAULT 'pendente' CHECK IN ('pendente','concluida')
ta_concluida_em     TIMESTAMP NULL
ta_criado_em        TIMESTAMP DEFAULT NOW()
ta_atualizado_em    TIMESTAMP DEFAULT NOW()
INDEX: idx_tarefa_usuario_status (ta_usuario_id, ta_status, ta_prazo)
```

**TAREFA_HISTORICO**
```
th_id               SERIAL PRIMARY KEY
th_tarefa_id        INTEGER NULL REFERENCES tarefa(ta_id) ON DELETE SET NULL
th_usuario_id       INTEGER NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE
th_acao             VARCHAR(30) NOT NULL  -- 'criada','atualizada','status_alterado','excluida'
th_titulo_snapshot  VARCHAR(160) NOT NULL
th_status_anterior  VARCHAR(20) NULL
th_status_novo      VARCHAR(20) NULL
th_descricao        VARCHAR(255) NULL
th_criado_em        TIMESTAMP DEFAULT NOW()
INDEX: idx_tarefa_historico_usuario_data (th_usuario_id, th_criado_em DESC)
```

**CRONOGRAMA_ESTUDO**
```
cr_id               SERIAL PRIMARY KEY
cr_usuario_id       INTEGER NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE
cr_disciplina       INTEGER NOT NULL REFERENCES disciplina(di_id) ON DELETE CASCADE
cr_data             DATE NOT NULL
cr_horario_inicio   TIME NOT NULL
cr_duracao_min      INTEGER NOT NULL CHECK (> 0)
cr_criado_em        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
cr_atualizado_em    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
UNIQUE: idx_cronograma_usuario_disciplina_data_horario (cr_usuario_id, cr_disciplina, cr_data, cr_horario_inicio)
INDEX: idx_cronograma_usuario_data (cr_usuario_id, cr_data, cr_horario_inicio)
```

**SESSAO_ESTUDO**
```
se_id               SERIAL PRIMARY KEY
se_usuario_id       INTEGER NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE
se_disciplina       INTEGER NULL REFERENCES disciplina(di_id) ON DELETE SET NULL
se_status           VARCHAR(20) DEFAULT 'iniciada' CHECK IN ('iniciada','pausada','encerrada')
se_inicio           TIMESTAMP DEFAULT NOW()
se_fim              TIMESTAMP NULL
se_segundos_focados INTEGER DEFAULT 0 CHECK (>= 0)
se_ultimo_inicio    TIMESTAMP DEFAULT NOW()
se_criado_em        TIMESTAMP DEFAULT NOW()
se_atualizado_em    TIMESTAMP DEFAULT NOW()
INDEX: idx_sessao_estudo_usuario_status (se_usuario_id, se_status, se_inicio DESC)
```

**TURMA**
```
tu_id           SERIAL PRIMARY KEY
tu_nome         VARCHAR(100) NOT NULL
tu_codigo       VARCHAR(8) UNIQUE NOT NULL  -- 6 chars, sem I/O/0/1
tu_professor_id INTEGER NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE
tu_ativa        BOOLEAN DEFAULT true
tu_criada_em    TIMESTAMPTZ DEFAULT NOW()
INDEX: idx_turma_professor (tu_professor_id)
```

**TURMA_ALUNO**
```
ta_id           SERIAL PRIMARY KEY
ta_turma_id     INTEGER NOT NULL REFERENCES turma(tu_id) ON DELETE CASCADE
ta_aluno_id     INTEGER NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE
ta_entrou_em    TIMESTAMPTZ DEFAULT NOW()
UNIQUE (ta_turma_id, ta_aluno_id)
```

### 3.2 Conquistas pre-cadastradas

| Codigo    | Titulo                 | Criterio           | Valor |
|-----------|------------------------|--------------------|-------|
| TEMPO_1H  | Primeira Hora          | tempo_total_min    | 60    |
| TEMPO_5H  | Foco Total             | tempo_total_min    | 300   |
| STREAK_3  | Constancia Inicial     | streak_dias        | 3     |
| STREAK_7  | Sequencia Forte        | streak_dias        | 7     |
| META_1    | Meta Cumprida          | metas_concluidas   | 1     |
| META_3    | Colecionador de Metas  | metas_concluidas   | 3     |

---

## 4. API — Referencia Completa

Base URL: `http://localhost:3000`
Autenticacao: `Authorization: Bearer <token>`

### 4.1 Autenticacao

| Metodo | Rota                    | Auth | Descricao                                     |
|--------|-------------------------|------|-----------------------------------------------|
| POST   | /api/login              | Nao  | Retorna JWT 24h + { id, nome, email, tipo }   |
| POST   | /api/cadastro           | Nao  | Cria conta aluno, retorna JWT                 |
| POST   | /api/senha/esqueci      | Nao  | Envia email com link de redefinicao           |
| POST   | /api/senha/redefinir    | Nao  | Redefine senha via token (expira em 1h)       |

**Protecao brute-force:** apos N tentativas falhas, `us_bloqueado_ate` e definido. Login retorna 403 enquanto bloqueado.

### 4.2 Disciplinas

| Metodo | Rota                | Auth | Descricao                        |
|--------|---------------------|------|----------------------------------|
| GET    | /api/materias       | Sim  | Listar disciplinas do usuario    |
| POST   | /api/materias       | Sim  | Criar disciplina                 |
| PUT    | /api/materias/:id   | Sim  | Editar disciplina                |
| DELETE | /api/materias/:id   | Sim  | Excluir disciplina               |

Campos: `di_disciplina` (obrigatorio), `di_dificuldade`, `di_descricao`, `di_cor`

### 4.3 Metas

| Metodo | Rota             | Auth | Descricao          |
|--------|------------------|------|--------------------|
| GET    | /api/metas       | Sim  | Listar metas       |
| POST   | /api/metas       | Sim  | Criar meta         |
| PUT    | /api/metas/:id   | Sim  | Editar meta        |
| DELETE | /api/metas/:id   | Sim  | Excluir meta       |

Campos: `me_tipo`, `me_tempo_min` (> 0, obrigatorio), `me_disciplina`, `me_data_inicio`

### 4.4 Tarefas

| Metodo | Rota                       | Auth | Descricao                           |
|--------|----------------------------|------|-------------------------------------|
| GET    | /api/tarefas               | Sim  | Listar com resumo e historico (50)  |
| POST   | /api/tarefas               | Sim  | Criar tarefa                        |
| PUT    | /api/tarefas/:id           | Sim  | Editar tarefa                       |
| PATCH  | /api/tarefas/:id/status    | Sim  | Alterar status (pendente/concluida) |
| DELETE | /api/tarefas/:id           | Sim  | Excluir tarefa (auditado)           |

GET retorna: `{ resumo: { total, pendentes, concluidas, vencidas }, tarefas: [...], historico: [...] }`

Todas as acoes sao registradas em `tarefa_historico`.

### 4.5 Cronograma

| Metodo | Rota                    | Auth | Descricao               |
|--------|-------------------------|------|-------------------------|
| GET    | /api/cronogramas        | Sim  | Listar agendamentos     |
| POST   | /api/cronogramas        | Sim  | Criar agendamento       |
| PUT    | /api/cronogramas/:id    | Sim  | Editar agendamento      |
| DELETE | /api/cronogramas/:id    | Sim  | Excluir agendamento     |

Validacoes: `cr_data >= hoje`, sem duplicatas por usuario+disciplina+data+horario.

### 4.6 Sessoes de Estudo

| Metodo | Rota                          | Auth | Descricao                            |
|--------|-------------------------------|------|--------------------------------------|
| GET    | /api/sessoes/ativa            | Sim  | Retornar sessao em andamento         |
| POST   | /api/sessoes/iniciar          | Sim  | Iniciar sessao (ou retornar ativa)   |
| PATCH  | /api/sessoes/:id/pausar       | Sim  | Pausar timer                         |
| PATCH  | /api/sessoes/:id/retomar      | Sim  | Retomar timer                        |
| PATCH  | /api/sessoes/:id/encerrar     | Sim  | Encerrar, salvar atividade e XP      |

**Encerrar** calcula `EXTRACT(EPOCH FROM (NOW() - se_ultimo_inicio))` + `se_segundos_focados`, converte em minutos, cria atividade, soma XP, avalia conquistas.

### 4.7 Atividades

| Metodo | Rota               | Auth | Descricao                             |
|--------|--------------------|------|---------------------------------------|
| GET    | /api/atividades    | Sim  | Historico de estudos do usuario       |
| POST   | /api/atividades    | Sim  | Registrar estudo manual               |

POST cria atividade, soma `at_tempo_min` pontos ao usuario e avalia conquistas.

### 4.8 Progresso e Streak

| Metodo | Rota             | Auth | Descricao                                         |
|--------|------------------|------|---------------------------------------------------|
| GET    | /api/streak      | Sim  | streak, total_registros, dias_registrados         |
| GET    | /api/progresso   | Sim  | dados consolidados para barra de progresso        |

### 4.9 Conquistas e Perfil

| Metodo | Rota             | Auth | Descricao                                         |
|--------|------------------|------|---------------------------------------------------|
| GET    | /api/conquistas  | Sim  | Lista conquistas com status (desbloqueada/bloqueada) |
| GET    | /api/perfil      | Sim  | { us_id, us_nome, us_email, us_pontos_total }     |

GET /api/conquistas avalia e desbloqueia conquistas elegiveis antes de retornar.

### 4.10 Notificacoes

| Metodo | Rota               | Auth | Descricao                             |
|--------|--------------------|------|---------------------------------------|
| GET    | /api/notificacoes  | Sim  | Carregar configuracao do usuario      |
| PUT    | /api/notificacoes  | Sim  | Salvar { ativo, horario, fuso_horario } |

### 4.11 Turmas

| Metodo | Rota                              | Auth | Role           | Descricao                       |
|--------|-----------------------------------|------|----------------|---------------------------------|
| GET    | /api/turmas                       | Sim  | todos          | Listar turmas (filtra por role) |
| POST   | /api/turmas                       | Sim  | professor/admin| Criar turma                     |
| GET    | /api/turmas/:id                   | Sim  | todos          | Detalhe + lista de alunos       |
| PUT    | /api/turmas/:id                   | Sim  | professor/admin| Editar nome ou status ativo     |
| DELETE | /api/turmas/:id                   | Sim  | professor/admin| Excluir turma                   |
| POST   | /api/turmas/entrar                | Sim  | aluno          | Entrar via codigo de 6 chars    |
| DELETE | /api/turmas/:id/alunos/:alunoId   | Sim  | professor/admin| Remover aluno da turma          |

### 4.12 Relatorio

| Metodo | Rota                                    | Auth | Descricao                         |
|--------|-----------------------------------------|------|-----------------------------------|
| GET    | /api/relatorio?inicio=&fim=             | Sim  | Resumo + por disciplina no periodo |

Resposta: `{ resumo: { total_minutos, total_sessoes, total_tarefas }, por_disciplina: [...], periodo: { inicio, fim } }`

---

## 5. Telas do Frontend

### Navegacao padrao (sidebar)

Todas as telas compartilham a mesma barra lateral com os links em ordem:
1. Dashboard (`/app`)
2. Disciplinas (`/materias`)
3. Cronograma (`/cronogramas`)
4. Tarefas (`/tarefas`)
5. Metas (`/metas`)
6. Sessoes (`/estudos`)
7. Relatorios (`/relatorio`)
8. Perfil (`/perfil`)

### Dashboard (`/app`)

Carrega em paralelo: atividades, tarefas, metas, conquistas, cronogramas, materias.

Exibe: streak, XP do usuario, barra de progresso, cronograma do dia (ate 5), tarefas pendentes (ate 5), conquistas desbloqueadas (ate 4), grafico semanal de atividades, desempenho por disciplina.

### Sessao de Estudo (`/estudos`)

- Layout em coluna flex: badge de status > area do timer > cena pixel art
- Timer: atualiza a cada 1 segundo via `setInterval`
- Inicio: modal de selecao de disciplina → `POST /api/sessoes/iniciar`
- Stop: `PATCH /api/sessoes/:id/encerrar` → exibe minutos e XP ganhos
- Sessao ativa e detectada automaticamente ao carregar a pagina

### Relatorio (`/relatorio`)

Filtros de periodo: Semana (semana corrente), Mes (mes corrente), Trimestre (3 meses), Personalizado.

Exportacao: PDF via jsPDF com tabela autoTable; Word via HTML/Word blob.

### Turmas (`/turmas`)

Detecta role do usuario autenticado e exibe visao de professor ou aluno.

Professor: cria turma, ve codigo de 6 caracteres, lista alunos com XP, pode excluir.
Aluno: digita codigo de turma, ve turmas matriculadas.

---

## 6. Seguranca

- JWT valido por 24 horas, expirado redireciona para /login
- Brute-force: contador de tentativas falhas, bloqueio temporario via `us_bloqueado_ate`
- Tokens de reset de senha: hash SHA-256 no banco, expiracao de 1 hora
- Dados de cada usuario isolados por `WHERE usuario_id = req.usuario.id`
- Roles verificados nas rotas de turma (professor/admin) via middleware
- SSL obrigatorio na conexao com banco (Neon serverless)

---

## 7. Regras de Negocio

### XP e Nivelamento

- 1 minuto estudado = 1 ponto de XP
- XP e acumulado em `us_pontos_total`
- Nivel calculado no frontend: `nivel = floor(xp / 100) + 1`

### Conquistas

Avaliadas automaticamente apos:
- Registrar atividade manual (`POST /api/atividades`)
- Encerrar sessao de estudo (`PATCH /api/sessoes/:id/encerrar`)
- Editar meta (`PUT /api/metas/:id`)

Criterios suportados: `tempo_total_min`, `streak_dias`, `metas_concluidas`

### Sessao de Estudo

- Apenas 1 sessao ativa (status `iniciada` ou `pausada`) por usuario
- Timer continua do ponto onde parou ao retomar
- Ao encerrar com menos de 1 minuto, nenhuma atividade e registrada
- `se_segundos_focados` armazena o acumulado de pausas anteriores
- `se_ultimo_inicio` marca quando o timer foi iniciado ou retomado

### Streak

- Calculado com base em `at_data` distintos em `atividade`
- Dias consecutivos ate hoje contados de traz para frente
- Quebra se ha gap de 1 dia ou mais sem atividade

---

## 8. Como Executar

```bash
# Instalar dependencias do backend
cd backend
npm install

# Configurar variaveis de ambiente (.env)
# DATABASE_URL, JWT_SECRET, EMAIL_USER, EMAIL_PASS, EMAIL_HOST

# Migrar banco de dados
node src/config/migrar.js

# Iniciar servidor
npm start
# Servidor disponivel em http://localhost:3000
```

---

## 9. Arquivos de Documentacao

| Arquivo                            | Descricao                                      |
|------------------------------------|------------------------------------------------|
| DOCUMENTACAO_TECNICA.md            | Este documento. Referencia tecnica completa    |
| ARTEFATOS_VISUAIS_ATUALIZADOS.md   | DER resumido, regras de negocio, roles         |
| SPRINT_TELAS_USUARIO_FINAL.md      | Lista de telas e todos os endpoints da API     |
| DIAGRAMAS_TELAS_USUARIO_FINAL.md   | Diagramas com codigo Mermaid embutido          |
| REGISTRAR_ESTUDO.md                | Referencia de API com exemplos de payload JSON |
| mermaid/DER.mmd                    | ER Diagram completo com 13 tabelas             |
| mermaid/Diagrama de Classe.mmd     | Diagrama de Classes com 13 entidades           |
| mermaid/Diagrama de caso de Uso.mmd| Casos de uso por role (Aluno, Professor, Admin)|
| mermaid/Fluxograma N1.mmd          | Fluxo de autenticacao e navegacao principal    |
| mermaid/Fluxograma N2.mmd          | Fluxo tecnico da sessao de estudo              |
| AUDITORIA_CONTINUIDADE.md          | Historico de decisoes e pendencias do projeto  |
