-- ============================================================
-- 006 — Tipos de usuário e estrutura de turmas
-- ============================================================

-- 1. Adiciona coluna de papel ao usuarios (não afeta dados existentes)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS us_tipo VARCHAR(20) NOT NULL DEFAULT 'aluno';

-- 2. Garante constraint de valores válidos (idempotente via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'chk_us_tipo' AND table_name = 'usuarios'
  ) THEN
    ALTER TABLE usuarios
      ADD CONSTRAINT chk_us_tipo CHECK (us_tipo IN ('admin', 'professor', 'aluno'));
  END IF;
END;
$$;

-- 3. Turmas criadas por professores
CREATE TABLE IF NOT EXISTS turma (
  tu_id           SERIAL       PRIMARY KEY,
  tu_nome         VARCHAR(100) NOT NULL,
  tu_codigo       VARCHAR(8)   UNIQUE NOT NULL,
  tu_professor_id INTEGER      NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
  tu_ativa        BOOLEAN      NOT NULL DEFAULT true,
  tu_criada_em    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 4. Vínculo many-to-many turma ↔ aluno
CREATE TABLE IF NOT EXISTS turma_aluno (
  ta_id        SERIAL      PRIMARY KEY,
  ta_turma_id  INTEGER     NOT NULL REFERENCES turma(tu_id)    ON DELETE CASCADE,
  ta_aluno_id  INTEGER     NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
  ta_entrou_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ta_turma_id, ta_aluno_id)
);

-- 5. Índices de performance
CREATE INDEX IF NOT EXISTS idx_turma_professor ON turma(tu_professor_id);
CREATE INDEX IF NOT EXISTS idx_ta_turma        ON turma_aluno(ta_turma_id);
CREATE INDEX IF NOT EXISTS idx_ta_aluno        ON turma_aluno(ta_aluno_id);
