const express = require('express');
const pool = require('../config/db');
const { autenticar } = require('../middlewares/auth');
const { desbloquearConquistasElegiveis } = require('../services/conquistasService');

const router = express.Router();

function mapSessao(row) {
  if (!row) return null;
  return {
    id: row.se_id,
    status: row.se_status,
    disciplina: row.se_disciplina,
    inicio: row.se_inicio,
    fim: row.se_fim,
    segundos_focados: Number(row.se_segundos_focados || 0),
    segundos_correntes: Number(row.se_segundos_correntes != null ? row.se_segundos_correntes : (row.se_segundos_focados || 0)),
    ultimo_inicio: row.se_ultimo_inicio,
    descricao: row.se_descricao || null,
    tarefas: Number(row.se_tarefas || 0)
  };
}

async function concluirSessaoERegistrarAtividade(sessaoId, usuarioId) {
  const encerrada = await pool.query(
    `UPDATE sessao_estudo
     SET se_segundos_focados = se_segundos_focados +
           CASE WHEN se_status = 'iniciada' THEN GREATEST(0, EXTRACT(EPOCH FROM (NOW() - se_ultimo_inicio))::int) ELSE 0 END,
         se_status = 'encerrada',
         se_fim = NOW(),
         se_atualizado_em = NOW()
     WHERE se_id = $1 AND se_usuario_id = $2 AND se_status IN ('iniciada', 'pausada')
     RETURNING *`,
    [sessaoId, usuarioId]
  );

  if (encerrada.rowCount === 0) {
    return null;
  }

  const sessao = encerrada.rows[0];
  const minutos = Math.floor(Number(sessao.se_segundos_focados || 0) / 60);
  let atividade = null;
  let totalPontos = null;
  let conquistasDesbloqueadas = [];

  if (minutos > 0 && Number.isInteger(Number(sessao.se_disciplina)) && Number(sessao.se_disciplina) > 0) {
    const atividadeResult = await pool.query(
      `INSERT INTO atividade
       (at_disciplina, at_tempo_min, at_tarefas_concluidas, at_data, at_descricao, at_usuario_id)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, $5)
       RETURNING *`,
      [
        sessao.se_disciplina,
        minutos,
        Number(sessao.se_tarefas || 0),
        sessao.se_descricao || 'Sessao registrada pelo timer',
        usuarioId
      ]
    );
    atividade = atividadeResult.rows[0];

    const pontosResult = await pool.query(
      `UPDATE usuarios
       SET us_pontos_total = COALESCE(us_pontos_total, 0) + $1
       WHERE us_id = $2
       RETURNING us_pontos_total`,
      [minutos, usuarioId]
    );
    totalPontos = Number(pontosResult.rows[0]?.us_pontos_total || 0);
    const desbloqueio = await desbloquearConquistasElegiveis(usuarioId);
    conquistasDesbloqueadas = desbloqueio.desbloqueadasAgora || [];
  }

  return {
    sessao: mapSessao(sessao),
    minutos,
    atividade,
    totalPontos,
    conquistasDesbloqueadas
  };
}

router.get('/ativa', autenticar, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *,
        CASE WHEN se_status = 'iniciada'
          THEN se_segundos_focados + GREATEST(0, EXTRACT(EPOCH FROM (NOW() - se_ultimo_inicio))::int)
          ELSE se_segundos_focados
        END AS se_segundos_correntes
       FROM sessao_estudo
       WHERE se_usuario_id = $1 AND se_status IN ('iniciada', 'pausada')
       ORDER BY se_id DESC
       LIMIT 1`,
      [req.usuario.id]
    );

    res.json({ sucesso: true, sessao: mapSessao(result.rows[0]) });
  } catch (error) {
    console.error('Erro ao buscar sessao ativa:', error);
    res.status(500).json({ erro: 'Erro ao buscar sessao ativa.' });
  }
});

router.post('/iniciar', autenticar, async (req, res) => {
  try {
    const disciplina = req.body.disciplina ? Number(req.body.disciplina) : null;
    const descricao = req.body.descricao ? String(req.body.descricao).trim().slice(0, 255) : null;
    const tarefas = Number.isInteger(Number(req.body.tarefas)) ? Math.max(0, Number(req.body.tarefas)) : 0;

    const ativa = await pool.query(
      `SELECT * FROM sessao_estudo
       WHERE se_usuario_id = $1 AND se_status IN ('iniciada', 'pausada')
       ORDER BY se_id DESC LIMIT 1`,
      [req.usuario.id]
    );

    if (ativa.rowCount > 0) {
      return res.json({ sucesso: true, sessao: mapSessao(ativa.rows[0]) });
    }

    const result = await pool.query(
      `INSERT INTO sessao_estudo (se_usuario_id, se_disciplina, se_status, se_ultimo_inicio, se_descricao, se_tarefas)
       VALUES ($1, $2, 'iniciada', NOW(), $3, $4)
       RETURNING *`,
      [req.usuario.id, Number.isInteger(disciplina) && disciplina > 0 ? disciplina : null, descricao, tarefas]
    );

    res.status(201).json({ sucesso: true, sessao: mapSessao(result.rows[0]) });
  } catch (error) {
    console.error('Erro ao iniciar sessao:', error);
    res.status(500).json({ erro: 'Erro ao iniciar sessao.' });
  }
});

router.patch('/:id/pausar', autenticar, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE sessao_estudo
       SET se_segundos_focados = se_segundos_focados + GREATEST(0, EXTRACT(EPOCH FROM (NOW() - se_ultimo_inicio))::int),
           se_status = 'pausada',
           se_atualizado_em = NOW()
       WHERE se_id = $1 AND se_usuario_id = $2 AND se_status = 'iniciada'
       RETURNING *`,
      [req.params.id, req.usuario.id]
    );

    if (result.rowCount === 0) return res.status(404).json({ erro: 'Sessao iniciada nao encontrada.' });
    res.json({ sucesso: true, sessao: mapSessao(result.rows[0]) });
  } catch (error) {
    console.error('Erro ao pausar sessao:', error);
    res.status(500).json({ erro: 'Erro ao pausar sessao.' });
  }
});

router.patch('/:id/retomar', autenticar, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE sessao_estudo
       SET se_status = 'iniciada',
           se_ultimo_inicio = NOW(),
           se_atualizado_em = NOW()
       WHERE se_id = $1 AND se_usuario_id = $2 AND se_status = 'pausada'
       RETURNING *`,
      [req.params.id, req.usuario.id]
    );

    if (result.rowCount === 0) return res.status(404).json({ erro: 'Sessao pausada nao encontrada.' });
    res.json({ sucesso: true, sessao: mapSessao(result.rows[0]) });
  } catch (error) {
    console.error('Erro ao retomar sessao:', error);
    res.status(500).json({ erro: 'Erro ao retomar sessao.' });
  }
});

router.patch('/:id/encerrar', autenticar, async (req, res) => {
  try {
    const resultado = await concluirSessaoERegistrarAtividade(req.params.id, req.usuario.id);
    if (!resultado) return res.status(404).json({ erro: 'Sessao ativa nao encontrada.' });
    res.json({ sucesso: true, ...resultado });
  } catch (error) {
    console.error('Erro ao encerrar sessao:', error);
    res.status(500).json({ erro: 'Erro ao encerrar sessao.' });
  }
});

module.exports = router;
