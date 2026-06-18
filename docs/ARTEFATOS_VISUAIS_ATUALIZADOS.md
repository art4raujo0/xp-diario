# Artefatos Visuais Atualizados

Data de referencia: 2026-06-18
Branch: `feat/relayout`

Este arquivo consolida o estado real do banco de dados e dos diagramas apos a implementacao completa do sistema XP Diario.

---

## DER vigente

Arquivo fonte: `docs/mermaid/DER.mmd`

O sistema possui 13 tabelas:

| Tabela             | Prefixo | Descricao                                       |
|--------------------|---------|------------------------------------------------|
| usuarios           | us_     | Contas de usuario (aluno, professor, admin)    |
| disciplina         | di_     | Materias de estudo por usuario                 |
| meta               | me_     | Metas de tempo por disciplina                  |
| atividade          | at_     | Registros de estudo (manuals e via sessao)     |
| conquista          | co_     | Definicao de conquistas e criterios            |
| usuario_conquista  | uc_     | Conquistas desbloqueadas por usuario           |
| notificacoes_config| nc_     | Configuracao de lembretes por email            |
| tarefa             | ta_     | Tarefas com status e prazo                     |
| tarefa_historico   | th_     | Auditoria de acoes sobre tarefas               |
| cronograma_estudo  | cr_     | Agendamentos de estudo com horario             |
| sessao_estudo      | se_     | Sessoes de foco com timer ao vivo              |
| turma              | tu_     | Turmas criadas por professores                 |
| turma_aluno        | ta_     | Vinculo aluno-turma (matriculas)               |

---

## Conquistas cadastradas (seed)

| Codigo    | Titulo                    | Criterio tipo    | Valor |
|-----------|---------------------------|------------------|-------|
| TEMPO_1H  | Primeira Hora             | tempo_total_min  | 60    |
| TEMPO_5H  | Foco Total                | tempo_total_min  | 300   |
| STREAK_3  | Constancia Inicial        | streak_dias      | 3     |
| STREAK_7  | Sequencia Forte           | streak_dias      | 7     |
| META_1    | Meta Cumprida             | metas_concluidas | 1     |
| META_3    | Colecionador de Metas     | metas_concluidas | 3     |

---

## Roles de usuario

| Tipo      | Permissoes                                                        |
|-----------|-------------------------------------------------------------------|
| aluno     | Acesso completo as funcionalidades proprias                       |
| professor | + criar/gerenciar turmas, ver alunos com pontuacao               |
| admin     | + acesso irrestrito a todas as turmas e usuarios                 |

---

## Regras de negocio principais

- XP: 1 ponto por minuto estudado (via atividade manual ou sessao encerrada)
- Streak: calculado por dias consecutivos com pelo menos 1 atividade
- Conquistas: avaliadas automaticamente ao registrar atividade ou encerrar sessao
- Sessao: apenas 1 sessao ativa por usuario (status iniciada ou pausada)
- Disciplinas: isoladas por usuario autenticado
- Turma: codigo de 6 caracteres aleatorio, apenas turmas ativas aceitam novos alunos
- Reset de senha: token expira em 1 hora, uso unico
