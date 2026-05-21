CREATE TABLE IF NOT EXISTS usuarios (
    us_id SERIAL PRIMARY KEY,
    us_nome VARCHAR(120),
    us_email VARCHAR(255) NOT NULL,
    us_senha_hash VARCHAR(255),
    us_tentativas_falhas INTEGER NOT NULL DEFAULT 0,
    us_bloqueado_ate TIMESTAMP NULL,
    us_criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS usuarios
    ADD COLUMN IF NOT EXISTS us_nome VARCHAR(120),
    ADD COLUMN IF NOT EXISTS us_senha_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS us_tentativas_falhas INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS us_bloqueado_ate TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS us_criado_em TIMESTAMP NOT NULL DEFAULT NOW();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'usuarios_us_email_unique'
    ) THEN
        ALTER TABLE usuarios
        ADD CONSTRAINT usuarios_us_email_unique UNIQUE (us_email);
    END IF;
END $$;
