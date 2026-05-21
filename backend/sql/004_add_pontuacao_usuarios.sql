ALTER TABLE IF EXISTS usuarios
    ADD COLUMN IF NOT EXISTS us_pontos_total INTEGER NOT NULL DEFAULT 0 CHECK (us_pontos_total >= 0);

UPDATE usuarios u
SET us_pontos_total = COALESCE(sub.total_minutos, 0)
FROM (
    SELECT at_usuario_id AS usuario_id, SUM(at_tempo_min)::INTEGER AS total_minutos
    FROM atividade
    WHERE at_usuario_id IS NOT NULL
    GROUP BY at_usuario_id
) sub
WHERE u.us_id = sub.usuario_id;
