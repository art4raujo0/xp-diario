const express = require('express');
const pool = require('../config/db');
const { autenticar } = require('../middlewares/auth');

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
    ultimo_inicio: row.se_ultimo_inicio
  };
}

router.get('/ativa', autenticar, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
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
      `INSERT INTO sessao_estudo (se_usuario_id, se_disciplina, se_status, se_ultimo_inicio)
       VALUES ($1, $2, 'iniciada', NOW())
       RETURNING *`,
      [req.usuario.id, Number.isInteger(disciplina) && disciplina > 0 ? disciplina : null]
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
    const result = await pool.query(
      `UPDATE sessao_estudo
       SET se_segundos_focados = se_segundos_focados +
             CASE WHEN se_status = 'iniciada' THEN GREATEST(0, EXTRACT(EPOCH FROM (NOW() - se_ultimo_inicio))::int) ELSE 0 END,
           se_status = 'encerrada',
           se_fim = NOW(),
           se_atualizado_em = NOW()
       WHERE se_id = $1 AND se_usuario_id = $2 AND se_status IN ('iniciada', 'pausada')
       RETURNING *`,
      [req.params.id, req.usuario.id]
    );

    if (result.rowCount === 0) return res.status(404).json({ erro: 'Sessao ativa nao encontrada.' });
    res.json({ sucesso: true, sessao: mapSessao(result.rows[0]) });
  } catch (error) {
    console.error('Erro ao encerrar sessao:', error);
    res.status(500).json({ erro: 'Erro ao encerrar sessao.' });
  }
});

module.exports = router;
