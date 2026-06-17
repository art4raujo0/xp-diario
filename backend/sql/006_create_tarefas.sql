CREATE TABLE IF NOT EXISTS tarefa (
    ta_id SERIAL PRIMARY KEY,
    ta_titulo VARCHAR(160) NOT NULL,
    ta_descricao TEXT NULL,
    ta_prazo DATE NULL
);

ALTER TABLE IF EXISTS tarefa
    ADD COLUMN IF NOT EXISTS ta_usuario_id INTEGER NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS ta_disciplina_id INTEGER NULL REFERENCES disciplina(di_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS ta_status VARCHAR(20) NOT NULL DEFAULT 'pendente',
    ADD COLUMN IF NOT EXISTS ta_concluida_em TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS ta_criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS ta_atualizado_em TIMESTAMP NOT NULL DEFAULT NOW();

ALTER TABLE IF EXISTS tarefa
    ALTER COLUMN ta_disciplina DROP NOT NULL;

UPDATE tarefa
SET ta_disciplina_id = ta_disciplina
WHERE ta_disciplina_id IS NULL
  AND ta_disciplina IS NOT NULL;

UPDATE tarefa
SET ta_disciplina = ta_disciplina_id
WHERE ta_disciplina IS NULL
  AND ta_disciplina_id IS NOT NULL;

UPDATE tarefa
SET ta_status = CASE
    WHEN COALESCE(ta_concluida, FALSE) THEN 'concluida'
    ELSE 'pendente'
END
WHERE ta_status IS NULL
   OR ta_status NOT IN ('pendente', 'concluida');

UPDATE tarefa
SET ta_concluida_em = COALESCE(ta_concluida_em, ta_atualizado_em, ta_criado_em, NOW())
WHERE ta_status = 'concluida'
  AND ta_concluida_em IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tarefa_status_valido'
    ) THEN
        ALTER TABLE tarefa
        ADD CONSTRAINT tarefa_status_valido
        CHECK (ta_status IN ('pendente', 'concluida'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tarefa_usuario_status
    ON tarefa (ta_usuario_id, ta_status, ta_prazo);

CREATE INDEX IF NOT EXISTS idx_tarefa_disciplina
    ON tarefa (ta_disciplina_id);

CREATE TABLE IF NOT EXISTS tarefa_historico (
    th_id SERIAL PRIMARY KEY,
    th_tarefa_id INTEGER NULL REFERENCES tarefa(ta_id) ON DELETE SET NULL,
    th_usuario_id INTEGER NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
    th_acao VARCHAR(30) NOT NULL,
    th_titulo_snapshot VARCHAR(160) NOT NULL,
    th_status_anterior VARCHAR(20) NULL,
    th_status_novo VARCHAR(20) NULL,
    th_descricao VARCHAR(255) NULL,
    th_criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tarefa_historico_acao_valida'
    ) THEN
        ALTER TABLE tarefa_historico
        ADD CONSTRAINT tarefa_historico_acao_valida
        CHECK (th_acao IN ('criada', 'atualizada', 'status_alterado', 'excluida'));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tarefa_historico_status_anterior_valido'
    ) THEN
        ALTER TABLE tarefa_historico
        ADD CONSTRAINT tarefa_historico_status_anterior_valido
        CHECK (th_status_anterior IS NULL OR th_status_anterior IN ('pendente', 'concluida'));
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tarefa_historico_status_novo_valido'
    ) THEN
        ALTER TABLE tarefa_historico
        ADD CONSTRAINT tarefa_historico_status_novo_valido
        CHECK (th_status_novo IS NULL OR th_status_novo IN ('pendente', 'concluida'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tarefa_historico_usuario_data
    ON tarefa_historico (th_usuario_id, th_criado_em DESC);
