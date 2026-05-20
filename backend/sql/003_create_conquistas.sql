CREATE TABLE IF NOT EXISTS conquista (
    co_id SERIAL PRIMARY KEY,
    co_codigo VARCHAR(60) NOT NULL UNIQUE,
    co_titulo VARCHAR(120) NOT NULL,
    co_descricao VARCHAR(255) NOT NULL,
    co_criterio_tipo VARCHAR(40) NOT NULL,
    co_criterio_valor INTEGER NOT NULL CHECK (co_criterio_valor > 0),
    co_criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuario_conquista (
    uc_id SERIAL PRIMARY KEY,
    uc_usuario_id INTEGER NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
    uc_conquista_id INTEGER NOT NULL REFERENCES conquista(co_id) ON DELETE CASCADE,
    uc_desbloqueado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (uc_usuario_id, uc_conquista_id)
);

ALTER TABLE IF EXISTS atividade
    ADD COLUMN IF NOT EXISTS at_usuario_id INTEGER REFERENCES usuarios(us_id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS meta
    ADD COLUMN IF NOT EXISTS me_usuario_id INTEGER REFERENCES usuarios(us_id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_atividade_usuario_data
    ON atividade (at_usuario_id, at_data);

CREATE INDEX IF NOT EXISTS idx_meta_usuario
    ON meta (me_usuario_id);

INSERT INTO conquista (co_codigo, co_titulo, co_descricao, co_criterio_tipo, co_criterio_valor)
VALUES
    ('TEMPO_1H', 'Primeira Hora', 'Acumule pelo menos 60 minutos de estudo.', 'tempo_minutos', 60),
    ('TEMPO_5H', 'Foco Total', 'Acumule pelo menos 300 minutos de estudo.', 'tempo_minutos', 300),
    ('STREAK_3', 'Constância Inicial', 'Estude por 3 dias seguidos.', 'streak_dias', 3),
    ('STREAK_7', 'Sequência Forte', 'Estude por 7 dias seguidos.', 'streak_dias', 7),
    ('META_1', 'Meta Cumprida', 'Conclua 1 meta no período atual.', 'metas_concluidas', 1),
    ('META_3', 'Colecionador de Metas', 'Conclua 3 metas no período atual.', 'metas_concluidas', 3)
ON CONFLICT (co_codigo) DO NOTHING;
