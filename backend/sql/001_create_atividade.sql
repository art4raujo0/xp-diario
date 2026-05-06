CREATE TABLE IF NOT EXISTS atividade (
    at_id SERIAL PRIMARY KEY,
    at_disciplina INTEGER NOT NULL REFERENCES disciplina(di_id) ON DELETE CASCADE,
    at_tempo_min INTEGER NOT NULL CHECK (at_tempo_min > 0),
    at_tarefas_concluidas INTEGER NOT NULL DEFAULT 0 CHECK (at_tarefas_concluidas >= 0),
    at_data DATE NOT NULL DEFAULT CURRENT_DATE,
    at_descricao VARCHAR(255),
    at_criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_atividade_disciplina_data
    ON atividade (at_disciplina, at_data);
