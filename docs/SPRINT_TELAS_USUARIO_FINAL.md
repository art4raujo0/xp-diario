# Sprint - Telas para Usuario Final

Data de referencia: 2026-06-18

## Visao geral do sistema

XP Diario e uma plataforma gamificada de gestao de estudos com:

- Autenticacao JWT com controle de tentativas e bloqueio por brute-force
- Recuperacao de senha via email com token expiravel
- CRUD completo de disciplinas, metas, tarefas, cronograma
- Sessoes de estudo com timer ao vivo e persistencia automatica
- XP acumulado proporcional ao tempo estudado (1 min = 1 XP)
- Conquistas desbloqueadas automaticamente por criterios
- Relatorios de desempenho por periodo com exportacao PDF e Word
- Sistema de turmas com roles (aluno, professor, admin)
- Notificacoes de lembrete por email configuravel por usuario

---

## Telas do sistema

| Tela          | Rota          | Descricao                                               |
|---------------|---------------|---------------------------------------------------------|
| Login         | /             | Autenticacao, link para cadastro e recuperacao          |
| Cadastro      | /cadastro     | Criacao de conta com nome, email e senha                |
| Resetar Senha | /resetar-senha| Redefinicao via token enviado por email                 |
| Dashboard     | /app          | Visao geral: streak, XP, cronograma do dia, tarefas     |
| Disciplinas   | /materias     | CRUD de materias com cor e dificuldade                  |
| Metas         | /metas        | CRUD de metas de tempo por disciplina                   |
| Tarefas       | /tarefas      | CRUD de tarefas com prazo, status e historico           |
| Cronograma    | /cronogramas  | Agendamento de sessoes por disciplina, data e horario   |
| Sessoes       | /estudos      | Timer ao vivo, iniciar/encerrar com salvar automatico   |
| Relatorios    | /relatorio    | Desempenho por periodo com tabela e exportacao          |
| Conquistas    | /conquistas   | Grade de conquistas desbloqueadas e bloqueadas          |
| Perfil        | /perfil       | Pontuacao total, nivel, rank e estatisticas             |
| Turmas        | /turmas       | Criar/gerenciar turmas (professor) ou entrar (aluno)    |

---

## Endpoints da API (estado atual completo)

### Autenticacao

| Metodo | Endpoint              | Descricao                                   |
|--------|-----------------------|---------------------------------------------|
| POST   | /api/login            | Autenticar usuario, retorna JWT             |
| POST   | /api/cadastro         | Criar conta, retorna JWT                    |
| POST   | /api/senha/esqueci    | Enviar email de recuperacao                 |
| POST   | /api/senha/redefinir  | Redefinir senha via token                   |

### Disciplinas

| Metodo | Endpoint              | Descricao                                   |
|--------|-----------------------|---------------------------------------------|
| GET    | /api/materias         | Listar disciplinas do usuario autenticado   |
| POST   | /api/materias         | Criar disciplina                            |
| PUT    | /api/materias/:id     | Editar disciplina                           |
| DELETE | /api/materias/:id     | Excluir disciplina                          |

### Metas

| Metodo | Endpoint              | Descricao                                   |
|--------|-----------------------|---------------------------------------------|
| GET    | /api/metas            | Listar metas do usuario                     |
| POST   | /api/metas            | Criar meta                                  |
| PUT    | /api/metas/:id        | Editar meta                                 |
| DELETE | /api/metas/:id        | Excluir meta                                |

### Tarefas

| Metodo | Endpoint                  | Descricao                               |
|--------|---------------------------|-----------------------------------------|
| GET    | /api/tarefas              | Listar tarefas com resumo e historico   |
| POST   | /api/tarefas              | Criar tarefa                            |
| PUT    | /api/tarefas/:id          | Editar tarefa                           |
| PATCH  | /api/tarefas/:id/status   | Alterar status (pendente/concluida)     |
| DELETE | /api/tarefas/:id          | Excluir tarefa                          |

### Cronograma

| Metodo | Endpoint                  | Descricao                               |
|--------|---------------------------|-----------------------------------------|
| GET    | /api/cronogramas          | Listar agendamentos do usuario          |
| POST   | /api/cronogramas          | Criar agendamento                       |
| PUT    | /api/cronogramas/:id      | Editar agendamento                      |
| DELETE | /api/cronogramas/:id      | Excluir agendamento                     |

### Sessoes de Estudo

| Metodo | Endpoint                      | Descricao                             |
|--------|-------------------------------|---------------------------------------|
| GET    | /api/sessoes/ativa            | Retornar sessao ativa do usuario      |
| POST   | /api/sessoes/iniciar          | Iniciar nova sessao                   |
| PATCH  | /api/sessoes/:id/pausar       | Pausar sessao em andamento            |
| PATCH  | /api/sessoes/:id/retomar      | Retomar sessao pausada                |
| PATCH  | /api/sessoes/:id/encerrar     | Encerrar e salvar atividade           |

### Atividades (historico de estudo)

| Metodo | Endpoint              | Descricao                                   |
|--------|-----------------------|---------------------------------------------|
| GET    | /api/atividades       | Listar historico de estudos do usuario      |
| POST   | /api/atividades       | Registrar atividade manual                  |

### Progresso e Streak

| Metodo | Endpoint              | Descricao                                   |
|--------|-----------------------|---------------------------------------------|
| GET    | /api/streak           | Calcular streak atual e total de registros  |
| GET    | /api/progresso        | Dados de progresso para dashboard           |

### Conquistas e Perfil

| Metodo | Endpoint              | Descricao                                   |
|--------|-----------------------|---------------------------------------------|
| GET    | /api/conquistas       | Listar conquistas com status por usuario    |
| GET    | /api/perfil           | Dados do perfil e pontuacao total           |

### Notificacoes

| Metodo | Endpoint              | Descricao                                   |
|--------|-----------------------|---------------------------------------------|
| GET    | /api/notificacoes     | Carregar configuracao de lembrete           |
| PUT    | /api/notificacoes     | Salvar configuracao de lembrete             |

### Turmas

| Metodo | Endpoint                          | Descricao                               |
|--------|-----------------------------------|-----------------------------------------|
| GET    | /api/turmas                       | Listar turmas (visao por role)          |
| POST   | /api/turmas                       | Criar turma (professor/admin)           |
| GET    | /api/turmas/:id                   | Detalhe da turma com lista de alunos    |
| PUT    | /api/turmas/:id                   | Editar turma (professor/admin)          |
| DELETE | /api/turmas/:id                   | Excluir turma (professor/admin)         |
| POST   | /api/turmas/entrar                | Entrar em turma via codigo (aluno)      |
| DELETE | /api/turmas/:id/alunos/:alunoId   | Remover aluno da turma                  |

### Relatorios

| Metodo | Endpoint                              | Descricao                           |
|--------|---------------------------------------|-------------------------------------|
| GET    | /api/relatorio?inicio=&fim=           | Relatorio de desempenho por periodo |

---

## Regras de negocio vigentes

- Dados de estudo, metas, streak, progresso, perfil e notificacoes isolados por usuario autenticado
- Disciplinas sao privadas do usuario que as criou (di_usuario_id)
- Conquistas desbloqueadas automaticamente ao registrar atividade ou encerrar sessao
- XP proporcional ao tempo registrado (1 ponto por minuto)
- XP acumulativo e disponivel no perfil
- Apenas 1 sessao ativa por usuario simultaneamente
- Turmas com roles: aluno so entra via codigo, professor cria e gerencia
- Reset de senha com token SHA-256 de uso unico com expiracao de 1 hora
