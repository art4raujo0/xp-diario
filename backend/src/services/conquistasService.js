const pool = require("../config/db");
const { calcularStreakAtual } = require("./streakService");

function parseDataISO(valor) {
  if (!valor) return null;
  return new Date(valor).toISOString().slice(0, 10);
}

async function obterMetricasUsuario(usuarioId) {
  const [tempoResult, diasResult, metasResult] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(at_tempo_min), 0) AS total_tempo
       FROM atividade
       WHERE at_usuario_id = $1`,
      [usuarioId]
    ),
    pool.query(
      `SELECT at_data
       FROM atividade
       WHERE at_usuario_id = $1
       ORDER BY at_data ASC`,
      [usuarioId]
    ),
    pool.query(
      `SELECT
         COUNT(*) FILTER (
           WHERE p.tempo_estudado >= m.me_tempo_min AND m.me_tempo_min > 0
         ) AS metas_concluidas
       FROM meta m
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(a.at_tempo_min), 0) AS tempo_estudado
         FROM atividade a
         WHERE a.at_usuario_id = m.me_usuario_id
           AND a.at_disciplina = m.me_disciplina
           AND a.at_data >= COALESCE(m.me_data_inicio, CURRENT_DATE)
           AND (
             CASE
               WHEN LOWER(m.me_tipo) IN ('semanal') THEN a.at_data <= (DATE_TRUNC('week', CURRENT_DATE)::date + 6)
               WHEN LOWER(m.me_tipo) IN ('mensal') THEN a.at_data <= ((DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date)
               ELSE a.at_data <= CURRENT_DATE
             END
           )
       ) p ON TRUE
       WHERE m.me_usuario_id = $1`,
      [usuarioId]
    )
  ]);

  const dias = diasResult.rows.map((row) => parseDataISO(row.at_data)).filter(Boolean);

  return {
    tempoMinutos: Number(tempoResult.rows[0]?.total_tempo || 0),
    streakDias: calcularStreakAtual(dias),
    metasConcluidas: Number(metasResult.rows[0]?.metas_concluidas || 0)
  };
}

function avaliarCriterio(tipo, valor, metricas) {
  if (tipo === "tempo_minutos") return metricas.tempoMinutos >= valor;
  if (tipo === "streak_dias") return metricas.streakDias >= valor;
  if (tipo === "metas_concluidas") return metricas.metasConcluidas >= valor;
  return false;
}

async function desbloquearConquistasElegiveis(usuarioId) {
  const metricas = await obterMetricasUsuario(usuarioId);
  const conquistasResult = await pool.query("SELECT * FROM conquista ORDER BY co_id ASC");
  const desbloqueadasAgora = [];

  for (const conquista of conquistasResult.rows) {
    const atingiu = avaliarCriterio(
      conquista.co_criterio_tipo,
      Number(conquista.co_criterio_valor),
      metricas
    );

    if (!atingiu) {
      continue;
    }

    const insertResult = await pool.query(
      `INSERT INTO usuario_conquista (uc_usuario_id, uc_conquista_id)
       VALUES ($1, $2)
       ON CONFLICT (uc_usuario_id, uc_conquista_id) DO NOTHING
       RETURNING uc_id`,
      [usuarioId, conquista.co_id]
    );

    if (insertResult.rowCount > 0) {
      desbloqueadasAgora.push({
        id: conquista.co_id,
        codigo: conquista.co_codigo,
        titulo: conquista.co_titulo
      });
    }
  }

  return {
    metricas,
    desbloqueadasAgora
  };
}

async function listarConquistasComStatus(usuarioId) {
  const result = await pool.query(
    `SELECT
       c.co_id,
       c.co_codigo,
       c.co_titulo,
       c.co_descricao,
       c.co_criterio_tipo,
       c.co_criterio_valor,
       uc.uc_desbloqueado_em
     FROM conquista c
     LEFT JOIN usuario_conquista uc
       ON uc.uc_conquista_id = c.co_id
      AND uc.uc_usuario_id = $1
     ORDER BY c.co_id ASC`,
    [usuarioId]
  );

  return result.rows.map((row) => ({
    co_id: row.co_id,
    co_codigo: row.co_codigo,
    co_titulo: row.co_titulo,
    co_descricao: row.co_descricao,
    criterio: {
      tipo: row.co_criterio_tipo,
      valor: Number(row.co_criterio_valor)
    },
    status: row.uc_desbloqueado_em ? "desbloqueada" : "bloqueada",
    desbloqueadoEm: row.uc_desbloqueado_em || null
  }));
}

module.exports = {
  desbloquearConquistasElegiveis,
  listarConquistasComStatus
};
