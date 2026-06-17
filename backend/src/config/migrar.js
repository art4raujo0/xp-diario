const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function executarMigracoes() {
  const sqlPath = path.join(__dirname, '..', '..', 'sql', '006_turmas_roles.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Divide em statements individuais para melhor tratamento de erros
  const statements = [
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS us_tipo VARCHAR(20) NOT NULL DEFAULT 'aluno'`,

    `DO $$
     BEGIN
       IF NOT EXISTS (
         SELECT 1 FROM information_schema.table_constraints
         WHERE constraint_name = 'chk_us_tipo' AND table_name = 'usuarios'
       ) THEN
         ALTER TABLE usuarios ADD CONSTRAINT chk_us_tipo CHECK (us_tipo IN ('admin', 'professor', 'aluno'));
       END IF;
     END;
     $$`,

    `CREATE TABLE IF NOT EXISTS turma (
       tu_id           SERIAL       PRIMARY KEY,
       tu_nome         VARCHAR(100) NOT NULL,
       tu_codigo       VARCHAR(8)   UNIQUE NOT NULL,
       tu_professor_id INTEGER      NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
       tu_ativa        BOOLEAN      NOT NULL DEFAULT true,
       tu_criada_em    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
     )`,

    `CREATE TABLE IF NOT EXISTS turma_aluno (
       ta_id        SERIAL      PRIMARY KEY,
       ta_turma_id  INTEGER     NOT NULL REFERENCES turma(tu_id)    ON DELETE CASCADE,
       ta_aluno_id  INTEGER     NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
       ta_entrou_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       UNIQUE (ta_turma_id, ta_aluno_id)
     )`,

    `CREATE INDEX IF NOT EXISTS idx_turma_professor ON turma(tu_professor_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ta_turma        ON turma_aluno(ta_turma_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ta_aluno        ON turma_aluno(ta_aluno_id)`,

    // Migração 007 — matérias por usuário
    `ALTER TABLE disciplina ADD COLUMN IF NOT EXISTS di_usuario_id INTEGER REFERENCES usuarios(us_id)`,

    // Migração 008 — reset de senha
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS us_reset_token VARCHAR(64)`,
    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS us_reset_token_expiry TIMESTAMPTZ`,
  ];

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (err) {
      // Ignora erros de "já existe" (42701=coluna, 42P07=tabela, 42710=constraint)
      if (!['42701', '42P07', '42710'].includes(err.code)) {
        console.warn('[migrar] Aviso:', err.message);
      }
    }
  }

  console.log('[migrar] Migração 006 (turmas/roles) aplicada.');
}

module.exports = { executarMigracoes };
