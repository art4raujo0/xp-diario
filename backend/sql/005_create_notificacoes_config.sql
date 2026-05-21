CREATE TABLE IF NOT EXISTS notificacoes_config (
    nc_id SERIAL PRIMARY KEY,
    nc_usuario_id INTEGER NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
    nc_ativo BOOLEAN NOT NULL DEFAULT FALSE,
    nc_horario TIME NOT NULL DEFAULT '08:00',
    nc_fuso_horario VARCHAR(60) NOT NULL DEFAULT 'America/Sao_Paulo',
    nc_ultimo_envio DATE NULL,
    nc_atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT notificacoes_config_usuario_unique UNIQUE (nc_usuario_id)
);
