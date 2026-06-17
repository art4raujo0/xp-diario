CREATE TABLE IF NOT EXISTS cronograma_estudo (
    cr_id SERIAL PRIMARY KEY,
    cr_usuario_id INTEGER NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
    cr_disciplina INTEGER NOT NULL REFERENCES disciplina(di_id) ON DELETE CASCADE,
    cr_data DATE NOT NULL,
    cr_horario_inicio TIME NOT NULL,
    cr_duracao_min INTEGER NOT NULL CHECK (cr_duracao_min > 0),
    cr_criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cr_atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cronograma_usuario_disciplina_data_horario
    ON cronograma_estudo (cr_usuario_id, cr_disciplina, cr_data, cr_horario_inicio);

CREATE INDEX IF NOT EXISTS idx_cronograma_usuario_data
    ON cronograma_estudo (cr_usuario_id, cr_data, cr_horario_inicio);
