const express = require('express');
const pool = require('../config/db');
const { autenticar } = require('../middlewares/auth');
const { exigirAdmin } = require('../middlewares/roles');

const router = express.Router();

// ----------------------------------------------------------------
// GET /api/admin/usuarios — lista todos os usuários
// ----------------------------------------------------------------
router.get('/usuarios', autenticar, exigirAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.us_id,
        u.us_nome,
        u.us_email,
        u.us_tipo,
        COALESCE(u.us_pontos_total, 0) AS us_pontos_total,
        (SELECT COUNT(*) FROM turma_aluno    WHERE ta_aluno_id    = u.us_id)::int AS turmas_como_aluno,
        (SELECT COUNT(*) FROM turma          WHERE tu_professor_id = u.us_id)::int AS turmas_como_professor
      FROM usuarios u
      ORDER BY u.us_nome
    `);

    res.json({ sucesso: true, usuarios: result.rows });
  } catch (err) {
    console.error('Erro ao listar usuários (admin):', err);
    res.status(500).json({ erro: 'Erro ao listar usuários.' });
  }
});

// ----------------------------------------------------------------
// PUT /api/admin/usuarios/:id/tipo — altera o papel de um usuário
// ----------------------------------------------------------------
router.put('/usuarios/:id/tipo', autenticar, exigirAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { tipo } = req.body;

    if (!['admin', 'professor', 'aluno'].includes(tipo)) {
      return res.status(400).json({ erro: "Tipo inválido. Use 'admin', 'professor' ou 'aluno'." });
    }

    if (userId === req.usuario.id) {
      return res.status(400).json({ erro: 'Você não pode alterar seu próprio tipo.' });
    }

    const result = await pool.query(
      `UPDATE usuarios SET us_tipo = $1 WHERE us_id = $2
       RETURNING us_id, us_nome, us_email, us_tipo`,
      [tipo, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    res.json({ sucesso: true, usuario: result.rows[0] });
  } catch (err) {
    console.error('Erro ao alterar tipo de usuário:', err);
    res.status(500).json({ erro: 'Erro ao alterar tipo de usuário.' });
  }
});

// ----------------------------------------------------------------
// GET /api/admin/turmas — lista todas as turmas (visão geral)
// ----------------------------------------------------------------
router.get('/turmas', autenticar, exigirAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.tu_id,
        t.tu_nome,
        t.tu_codigo,
        t.tu_ativa,
        t.tu_criada_em,
        u.us_nome  AS professor_nome,
        u.us_email AS professor_email,
        COUNT(ta.ta_aluno_id)::int AS total_alunos
      FROM turma t
      JOIN usuarios u ON u.us_id = t.tu_professor_id
      LEFT JOIN turma_aluno ta ON ta.ta_turma_id = t.tu_id
      GROUP BY t.tu_id, u.us_nome, u.us_email
      ORDER BY t.tu_criada_em DESC
    `);

    res.json({ sucesso: true, turmas: result.rows });
  } catch (err) {
    console.error('Erro ao listar turmas (admin):', err);
    res.status(500).json({ erro: 'Erro ao listar turmas.' });
  }
});

// ----------------------------------------------------------------
// GET /api/admin/turmas/:id/alunos — dados dos alunos de uma turma
// ----------------------------------------------------------------
router.get('/turmas/:id/alunos', autenticar, exigirAdmin, async (req, res) => {
  try {
    const turmaId = parseInt(req.params.id);

    const turmaResult = await pool.query('SELECT tu_nome FROM turma WHERE tu_id = $1', [turmaId]);
    if (turmaResult.rowCount === 0) return res.status(404).json({ erro: 'Turma não encontrada.' });

    const alunosResult = await pool.query(`
      SELECT
        u.us_id,
        u.us_nome,
        u.us_email,
        COALESCE(u.us_pontos_total, 0) AS us_pontos_total,
        ta.ta_entrou_em,
        (SELECT COALESCE(SUM(at_tempo_min), 0)
           FROM atividade WHERE at_usuario_id = u.us_id)::int AS total_minutos
      FROM turma_aluno ta
      JOIN usuarios u ON u.us_id = ta.ta_aluno_id
      WHERE ta.ta_turma_id = $1
      ORDER BY u.us_nome
    `, [turmaId]);

    res.json({
      sucesso: true,
      turma: turmaResult.rows[0].tu_nome,
      alunos: alunosResult.rows
    });
  } catch (err) {
    console.error('Erro ao buscar alunos da turma (admin):', err);
    res.status(500).json({ erro: 'Erro ao buscar alunos.' });
  }
});

module.exports = router;
