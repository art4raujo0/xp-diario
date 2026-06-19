const pool = require('./db');

async function executarMigracoes() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS usuarios (
       us_id SERIAL PRIMARY KEY,
       us_nome VARCHAR(120),
       us_email VARCHAR(255) NOT NULL,
       us_senha_hash VARCHAR(255),
       us_tentativas_falhas INTEGER NOT NULL DEFAULT 0,
       us_bloqueado_ate TIMESTAMP NULL,
       us_criado_em TIMESTAMP NOT NULL DEFAULT NOW()
     )`,

    `ALTER TABLE IF EXISTS usuarios
       ADD COLUMN IF NOT EXISTS us_nome VARCHAR(120),
       ADD COLUMN IF NOT EXISTS us_senha_hash VARCHAR(255),
       ADD COLUMN IF NOT EXISTS us_tentativas_falhas INTEGER NOT NULL DEFAULT 0,
       ADD COLUMN IF NOT EXISTS us_bloqueado_ate TIMESTAMP NULL,
       ADD COLUMN IF NOT EXISTS us_criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
       ADD COLUMN IF NOT EXISTS us_pontos_total INTEGER NOT NULL DEFAULT 0 CHECK (us_pontos_total >= 0),
       ADD COLUMN IF NOT EXISTS us_tipo VARCHAR(20) NOT NULL DEFAULT 'aluno',
       ADD COLUMN IF NOT EXISTS us_reset_token_hash VARCHAR(64) NULL,
       ADD COLUMN IF NOT EXISTS us_reset_expira_em TIMESTAMP NULL`,

    `DO $$
     BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_us_email_unique') THEN
         ALTER TABLE usuarios ADD CONSTRAINT usuarios_us_email_unique UNIQUE (us_email);
       END IF;
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_us_tipo') THEN
         ALTER TABLE usuarios ADD CONSTRAINT chk_us_tipo CHECK (us_tipo IN ('admin', 'professor', 'aluno'));
       END IF;
     END;
     $$`,

    `CREATE TABLE IF NOT EXISTS disciplina (
       di_id SERIAL PRIMARY KEY,
       di_disciplina VARCHAR(120) NOT NULL,
       di_dificuldade VARCHAR(30),
       di_descricao TEXT,
       di_cor VARCHAR(20),
       di_usuario_id INTEGER NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
       di_criado_em TIMESTAMP NOT NULL DEFAULT NOW()
     )`,
    `ALTER TABLE IF EXISTS disciplina
       ADD COLUMN IF NOT EXISTS di_usuario_id INTEGER NULL REFERENCES usuarios(us_id) ON DELETE CASCADE`,

    `CREATE TABLE IF NOT EXISTS meta (
       me_id SERIAL PRIMARY KEY,
       me_tipo VARCHAR(20) NOT NULL,
       me_tempo_min INTEGER NOT NULL CHECK (me_tempo_min > 0),
       me_disciplina INTEGER NULL REFERENCES disciplina(di_id) ON DELETE SET NULL,
       me_data_inicio DATE NULL,
       me_usuario_id INTEGER NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
       me_criado_em TIMESTAMP NOT NULL DEFAULT NOW()
     )`,

    `CREATE TABLE IF NOT EXISTS atividade (
       at_id SERIAL PRIMARY KEY,
       at_disciplina INTEGER NOT NULL REFERENCES disciplina(di_id) ON DELETE CASCADE,
       at_tempo_min INTEGER NOT NULL CHECK (at_tempo_min > 0),
       at_tarefas_concluidas INTEGER NOT NULL DEFAULT 0 CHECK (at_tarefas_concluidas >= 0),
       at_data DATE NOT NULL DEFAULT CURRENT_DATE,
       at_descricao VARCHAR(255),
       at_usuario_id INTEGER NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
       at_criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`,

    `ALTER TABLE IF EXISTS atividade
       ADD COLUMN IF NOT EXISTS at_usuario_id INTEGER REFERENCES usuarios(us_id) ON DELETE CASCADE`,
    `ALTER TABLE IF EXISTS meta
       ADD COLUMN IF NOT EXISTS me_usuario_id INTEGER REFERENCES usuarios(us_id) ON DELETE CASCADE`,
    `CREATE INDEX IF NOT EXISTS idx_atividade_usuario_data ON atividade (at_usuario_id, at_data)`,
    `CREATE INDEX IF NOT EXISTS idx_meta_usuario ON meta (me_usuario_id)`,

    `CREATE TABLE IF NOT EXISTS conquista (
       co_id SERIAL PRIMARY KEY,
       co_codigo VARCHAR(60) NOT NULL UNIQUE,
       co_titulo VARCHAR(120) NOT NULL,
       co_descricao VARCHAR(255) NOT NULL,
       co_criterio_tipo VARCHAR(40) NOT NULL,
       co_criterio_valor INTEGER NOT NULL CHECK (co_criterio_valor > 0),
       co_criado_em TIMESTAMP NOT NULL DEFAULT NOW()
     )`,

    `CREATE TABLE IF NOT EXISTS usuario_conquista (
       uc_id SERIAL PRIMARY KEY,
       uc_usuario_id INTEGER NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
       uc_conquista_id INTEGER NOT NULL REFERENCES conquista(co_id) ON DELETE CASCADE,
       uc_desbloqueado_em TIMESTAMP NOT NULL DEFAULT NOW(),
       UNIQUE (uc_usuario_id, uc_conquista_id)
     )`,

    `INSERT INTO conquista (co_codigo, co_titulo, co_descricao, co_criterio_tipo, co_criterio_valor)
     VALUES
       ('TEMPO_1H', 'Primeira Hora', 'Acumule pelo menos 60 minutos de estudo.', 'tempo_minutos', 60),
       ('TEMPO_5H', 'Foco Total', 'Acumule pelo menos 300 minutos de estudo.', 'tempo_minutos', 300),
       ('STREAK_3', 'Constancia Inicial', 'Estude por 3 dias seguidos.', 'streak_dias', 3),
       ('STREAK_7', 'Sequencia Forte', 'Estude por 7 dias seguidos.', 'streak_dias', 7),
       ('META_1', 'Meta Cumprida', 'Conclua 1 meta no periodo atual.', 'metas_concluidas', 1),
       ('META_3', 'Colecionador de Metas', 'Conclua 3 metas no periodo atual.', 'metas_concluidas', 3)
     ON CONFLICT (co_codigo) DO NOTHING`,

    `CREATE TABLE IF NOT EXISTS tarefa (
       ta_id SERIAL PRIMARY KEY,
       ta_titulo VARCHAR(160) NOT NULL,
       ta_descricao TEXT NULL,
       ta_prazo DATE NULL,
       ta_disciplina INTEGER NULL REFERENCES disciplina(di_id) ON DELETE SET NULL,
       ta_concluida BOOLEAN NOT NULL DEFAULT FALSE
     )`,

    `ALTER TABLE IF EXISTS tarefa
       ADD COLUMN IF NOT EXISTS ta_usuario_id INTEGER NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
       ADD COLUMN IF NOT EXISTS ta_disciplina INTEGER NULL REFERENCES disciplina(di_id) ON DELETE SET NULL,
       ADD COLUMN IF NOT EXISTS ta_disciplina_id INTEGER NULL REFERENCES disciplina(di_id) ON DELETE SET NULL,
       ADD COLUMN IF NOT EXISTS ta_concluida BOOLEAN NOT NULL DEFAULT FALSE,
       ADD COLUMN IF NOT EXISTS ta_status VARCHAR(20) NOT NULL DEFAULT 'pendente',
       ADD COLUMN IF NOT EXISTS ta_concluida_em TIMESTAMP NULL,
       ADD COLUMN IF NOT EXISTS ta_criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
       ADD COLUMN IF NOT EXISTS ta_atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()`,

    `UPDATE tarefa SET ta_disciplina_id = ta_disciplina WHERE ta_disciplina_id IS NULL AND ta_disciplina IS NOT NULL`,
    `UPDATE tarefa SET ta_disciplina = ta_disciplina_id WHERE ta_disciplina IS NULL AND ta_disciplina_id IS NOT NULL`,
    `UPDATE tarefa SET ta_status = CASE WHEN COALESCE(ta_concluida, FALSE) THEN 'concluida' ELSE 'pendente' END
       WHERE ta_status IS NULL OR ta_status NOT IN ('pendente', 'concluida')`,

    `DO $$
     BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tarefa_status_valido') THEN
         ALTER TABLE tarefa ADD CONSTRAINT tarefa_status_valido CHECK (ta_status IN ('pendente', 'concluida'));
       END IF;
     END;
     $$`,

    `CREATE TABLE IF NOT EXISTS tarefa_historico (
       th_id SERIAL PRIMARY KEY,
       th_tarefa_id INTEGER NULL REFERENCES tarefa(ta_id) ON DELETE SET NULL,
       th_usuario_id INTEGER NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
       th_acao VARCHAR(30) NOT NULL,
       th_titulo_snapshot VARCHAR(160) NOT NULL,
       th_status_anterior VARCHAR(20) NULL,
       th_status_novo VARCHAR(20) NULL,
       th_descricao VARCHAR(255) NULL,
       th_criado_em TIMESTAMP NOT NULL DEFAULT NOW()
     )`,
    `CREATE INDEX IF NOT EXISTS idx_tarefa_usuario_status ON tarefa (ta_usuario_id, ta_status, ta_prazo)`,
    `CREATE INDEX IF NOT EXISTS idx_tarefa_disciplina ON tarefa (ta_disciplina_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tarefa_historico_usuario_data ON tarefa_historico (th_usuario_id, th_criado_em DESC)`,

    `CREATE TABLE IF NOT EXISTS cronograma_estudo (
       cr_id SERIAL PRIMARY KEY,
       cr_usuario_id INTEGER NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
       cr_disciplina INTEGER NOT NULL REFERENCES disciplina(di_id) ON DELETE CASCADE,
       cr_data DATE NOT NULL,
       cr_horario_inicio TIME NOT NULL,
       cr_duracao_min INTEGER NOT NULL CHECK (cr_duracao_min > 0),
       cr_criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       cr_atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_cronograma_usuario_disciplina_data_horario
       ON cronograma_estudo (cr_usuario_id, cr_disciplina, cr_data, cr_horario_inicio)`,
    `CREATE INDEX IF NOT EXISTS idx_cronograma_usuario_data ON cronograma_estudo (cr_usuario_id, cr_data, cr_horario_inicio)`,

    `CREATE TABLE IF NOT EXISTS sessao_estudo (
       se_id SERIAL PRIMARY KEY,
       se_usuario_id INTEGER NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
       se_disciplina INTEGER NULL REFERENCES disciplina(di_id) ON DELETE SET NULL,
       se_status VARCHAR(20) NOT NULL DEFAULT 'iniciada',
       se_inicio TIMESTAMP NOT NULL DEFAULT NOW(),
       se_fim TIMESTAMP NULL,
       se_segundos_focados INTEGER NOT NULL DEFAULT 0 CHECK (se_segundos_focados >= 0),
       se_ultimo_inicio TIMESTAMP NOT NULL DEFAULT NOW(),
       se_criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
       se_atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
     )`,
    `DO $$
     BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessao_estudo_status_valido') THEN
         ALTER TABLE sessao_estudo ADD CONSTRAINT sessao_estudo_status_valido CHECK (se_status IN ('iniciada', 'pausada', 'encerrada'));
       END IF;
     END;
     $$`,
    `ALTER TABLE IF EXISTS sessao_estudo
       ADD COLUMN IF NOT EXISTS se_descricao TEXT NULL,
       ADD COLUMN IF NOT EXISTS se_tarefas INTEGER NOT NULL DEFAULT 0,
       ADD COLUMN IF NOT EXISTS se_tipo_estudo VARCHAR(30) NULL`,
    `CREATE INDEX IF NOT EXISTS idx_sessao_estudo_usuario_status ON sessao_estudo (se_usuario_id, se_status, se_inicio DESC)`,

    `CREATE TABLE IF NOT EXISTS notificacoes_config (
       nc_id SERIAL PRIMARY KEY,
       nc_usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(us_id) ON DELETE CASCADE,
       nc_ativo BOOLEAN NOT NULL DEFAULT FALSE,
       nc_horario TIME NOT NULL DEFAULT '08:00',
       nc_fuso_horario VARCHAR(80) NOT NULL DEFAULT 'America/Sao_Paulo',
       nc_ultimo_envio DATE NULL,
       nc_atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
     )`,
    `ALTER TABLE IF EXISTS notificacoes_config
       ADD COLUMN IF NOT EXISTS nc_ultimo_envio DATE NULL`,

    `CREATE TABLE IF NOT EXISTS turma (
       tu_id SERIAL PRIMARY KEY,
       tu_nome VARCHAR(100) NOT NULL,
       tu_codigo VARCHAR(8) UNIQUE NOT NULL,
       tu_professor_id INTEGER NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
       tu_ativa BOOLEAN NOT NULL DEFAULT true,
       tu_criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS turma_aluno (
       ta_id SERIAL PRIMARY KEY,
       ta_turma_id INTEGER NOT NULL REFERENCES turma(tu_id) ON DELETE CASCADE,
       ta_aluno_id INTEGER NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
       ta_entrou_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       UNIQUE (ta_turma_id, ta_aluno_id)
     )`,
    `CREATE INDEX IF NOT EXISTS idx_turma_professor ON turma(tu_professor_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ta_turma ON turma_aluno(ta_turma_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ta_aluno ON turma_aluno(ta_aluno_id)`,
  ];

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (err) {
      if (!['42701', '42P07', '42710', '23505'].includes(err.code)) {
        console.warn('[migrar] Aviso:', err.message);
      }
    }
  }

  console.log('[migrar] Migracoes essenciais aplicadas.');
}

module.exports = { executarMigracoes };
