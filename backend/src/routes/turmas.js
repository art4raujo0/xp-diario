const express = require('express');
const pool = require('../config/db');
const { autenticar } = require('../middlewares/auth');
const { exigirProfessor } = require('../middlewares/roles');

const router = express.Router();

// Caracteres sem ambiguidade visual (sem I, O, 0, 1)
const CHARS_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function gerarCodigo() {
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    codigo += CHARS_CODIGO[Math.floor(Math.random() * CHARS_CODIGO.length)];
  }
  return codigo;
}

async function gerarCodigoUnico() {
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const codigo = gerarCodigo();
    const existe = await pool.query('SELECT 1 FROM turma WHERE tu_codigo = $1', [codigo]);
    if (existe.rowCount === 0) return codigo;
  }
  throw new Error('Não foi possível gerar código único para a turma.');
}

// ----------------------------------------------------------------
// POST /api/turmas/entrar — aluno entra numa turma via código
// (deve vir ANTES de /:id para evitar conflito de rota)
// ----------------------------------------------------------------
router.post('/entrar', autenticar, async (req, res) => {
  try {
    const codigo = (req.body.codigo || '').trim().toUpperCase();
    const alunoId = req.usuario.id;

    if (!codigo) {
      return res.status(400).json({ erro: 'Código da turma obrigatório.' });
    }

    const turmaResult = await pool.query(
      'SELECT * FROM turma WHERE tu_codigo = $1 AND tu_ativa = true',
      [codigo]
    );

    if (turmaResult.rowCount === 0) {
      return res.status(404).json({ erro: 'Turma não encontrada ou inativa. Verifique o código.' });
    }

    const turma = turmaResult.rows[0];

    const jaVinculado = await pool.query(
      'SELECT 1 FROM turma_aluno WHERE ta_turma_id = $1 AND ta_aluno_id = $2',
      [turma.tu_id, alunoId]
    );

    if (jaVinculado.rowCount > 0) {
      return res.status(409).json({ erro: 'Você já está nessa turma.' });
    }

    await pool.query(
      'INSERT INTO turma_aluno (ta_turma_id, ta_aluno_id) VALUES ($1, $2)',
      [turma.tu_id, alunoId]
    );

    res.status(201).json({
      sucesso: true,
      mensagem: `Você entrou na turma "${turma.tu_nome}" com sucesso!`,
      turma: { tu_id: turma.tu_id, tu_nome: turma.tu_nome }
    });
  } catch (err) {
    console.error('Erro ao entrar na turma:', err);
    res.status(500).json({ erro: 'Erro ao entrar na turma.' });
  }
});

// ----------------------------------------------------------------
// POST /api/turmas — professor cria uma turma
// ----------------------------------------------------------------
router.post('/', autenticar, exigirProfessor, async (req, res) => {
  try {
    const nome = (req.body.tu_nome || '').trim();

    if (nome.length < 2) {
      return res.status(400).json({ erro: 'Nome da turma deve ter ao menos 2 caracteres.' });
    }

    const professorId = req.usuario.id;
    const codigo = await gerarCodigoUnico();

    const result = await pool.query(
      `INSERT INTO turma (tu_nome, tu_codigo, tu_professor_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [nome, codigo, professorId]
    );

    res.status(201).json({ sucesso: true, turma: result.rows[0] });
  } catch (err) {
    console.error('Erro ao criar turma:', err);
    res.status(500).json({ erro: 'Erro ao criar turma.' });
  }
});

// ----------------------------------------------------------------
// GET /api/turmas — lista turmas conforme o papel do usuário
// ----------------------------------------------------------------
router.get('/', autenticar, async (req, res) => {
  try {
    const { id: usuarioId, tipo } = req.usuario;
    let result;

    if (tipo === 'admin') {
      result = await pool.query(`
        SELECT t.*, u.us_nome AS professor_nome,
               COUNT(ta.ta_aluno_id)::int AS total_alunos
        FROM turma t
        JOIN usuarios u ON u.us_id = t.tu_professor_id
        LEFT JOIN turma_aluno ta ON ta.ta_turma_id = t.tu_id
        GROUP BY t.tu_id, u.us_nome
        ORDER BY t.tu_criada_em DESC
      `);
    } else if (tipo === 'professor') {
      result = await pool.query(`
        SELECT t.*,
               COUNT(ta.ta_aluno_id)::int AS total_alunos
        FROM turma t
        LEFT JOIN turma_aluno ta ON ta.ta_turma_id = t.tu_id
        WHERE t.tu_professor_id = $1
        GROUP BY t.tu_id
        ORDER BY t.tu_criada_em DESC
      `, [usuarioId]);
    } else {
      // Aluno: turmas em que está matriculado
      result = await pool.query(`
        SELECT t.tu_id, t.tu_nome, t.tu_ativa, t.tu_criada_em,
               u.us_nome AS professor_nome,
               ta.ta_entrou_em
        FROM turma t
        JOIN turma_aluno ta ON ta.ta_turma_id = t.tu_id
        JOIN usuarios u ON u.us_id = t.tu_professor_id
        WHERE ta.ta_aluno_id = $1
        ORDER BY ta.ta_entrou_em DESC
      `, [usuarioId]);
    }

    res.json({ sucesso: true, turmas: result.rows });
  } catch (err) {
    console.error('Erro ao listar turmas:', err);
    res.status(500).json({ erro: 'Erro ao listar turmas.' });
  }
});

// ----------------------------------------------------------------
// GET /api/turmas/:id — detalhes da turma + lista de alunos
// ----------------------------------------------------------------
router.get('/:id', autenticar, async (req, res) => {
  try {
    const turmaId = parseInt(req.params.id);
    const { id: usuarioId, tipo } = req.usuario;

    if (!Number.isInteger(turmaId) || turmaId <= 0) {
      return res.status(400).json({ erro: 'ID de turma inválido.' });
    }

    const turmaResult = await pool.query(`
      SELECT t.*, u.us_nome AS professor_nome
      FROM turma t
      JOIN usuarios u ON u.us_id = t.tu_professor_id
      WHERE t.tu_id = $1
    `, [turmaId]);

    if (turmaResult.rowCount === 0) {
      return res.status(404).json({ erro: 'Turma não encontrada.' });
    }

    const turma = turmaResult.rows[0];

    // Verifica autorização
    if (tipo === 'aluno') {
      const vinculo = await pool.query(
        'SELECT 1 FROM turma_aluno WHERE ta_turma_id = $1 AND ta_aluno_id = $2',
        [turmaId, usuarioId]
      );
      if (vinculo.rowCount === 0) {
        return res.status(403).json({ erro: 'Você não pertence a esta turma.' });
      }
    } else if (tipo === 'professor' && turma.tu_professor_id !== usuarioId) {
      return res.status(403).json({ erro: 'Acesso negado.' });
    }

    const alunosResult = await pool.query(`
      SELECT u.us_id, u.us_nome, u.us_email,
             COALESCE(u.us_pontos_total, 0) AS us_pontos_total,
             ta.ta_entrou_em
      FROM turma_aluno ta
      JOIN usuarios u ON u.us_id = ta.ta_aluno_id
      WHERE ta.ta_turma_id = $1
      ORDER BY u.us_nome
    `, [turmaId]);

    // Professor e admin vêem o código; alunos não
    if (tipo === 'aluno') delete turma.tu_codigo;

    res.json({ sucesso: true, turma, alunos: alunosResult.rows });
  } catch (err) {
    console.error('Erro ao buscar turma:', err);
    res.status(500).json({ erro: 'Erro ao buscar turma.' });
  }
});

// ----------------------------------------------------------------
// PUT /api/turmas/:id — professor atualiza nome ou status da turma
// ----------------------------------------------------------------
router.put('/:id', autenticar, exigirProfessor, async (req, res) => {
  try {
    const turmaId = parseInt(req.params.id);
    const { id: usuarioId, tipo } = req.usuario;

    const turmaResult = await pool.query('SELECT * FROM turma WHERE tu_id = $1', [turmaId]);
    if (turmaResult.rowCount === 0) return res.status(404).json({ erro: 'Turma não encontrada.' });

    const turma = turmaResult.rows[0];
    if (tipo !== 'admin' && turma.tu_professor_id !== usuarioId) {
      return res.status(403).json({ erro: 'Acesso negado.' });
    }

    const novoNome  = req.body.tu_nome  !== undefined ? req.body.tu_nome.trim()  : turma.tu_nome;
    const novaAtiva = req.body.tu_ativa !== undefined ? req.body.tu_ativa        : turma.tu_ativa;

    if (novoNome.length < 2) {
      return res.status(400).json({ erro: 'Nome deve ter ao menos 2 caracteres.' });
    }

    const result = await pool.query(
      'UPDATE turma SET tu_nome = $1, tu_ativa = $2 WHERE tu_id = $3 RETURNING *',
      [novoNome, novaAtiva, turmaId]
    );

    res.json({ sucesso: true, turma: result.rows[0] });
  } catch (err) {
    console.error('Erro ao atualizar turma:', err);
    res.status(500).json({ erro: 'Erro ao atualizar turma.' });
  }
});

// ----------------------------------------------------------------
// DELETE /api/turmas/:id — professor/admin exclui uma turma
// ----------------------------------------------------------------
router.delete('/:id', autenticar, exigirProfessor, async (req, res) => {
  try {
    const turmaId = parseInt(req.params.id);
    const { id: usuarioId, tipo } = req.usuario;

    if (!Number.isInteger(turmaId) || turmaId <= 0) {
      return res.status(400).json({ erro: 'ID de turma inválido.' });
    }

    const turmaResult = await pool.query(
      'SELECT tu_professor_id, tu_nome FROM turma WHERE tu_id = $1',
      [turmaId]
    );
    if (turmaResult.rowCount === 0) return res.status(404).json({ erro: 'Turma não encontrada.' });

    const turma = turmaResult.rows[0];
    if (tipo !== 'admin' && turma.tu_professor_id !== usuarioId) {
      return res.status(403).json({ erro: 'Acesso negado.' });
    }

    await pool.query('DELETE FROM turma WHERE tu_id = $1', [turmaId]);

    res.json({ sucesso: true, mensagem: `Turma "${turma.tu_nome}" excluída com sucesso.` });
  } catch (err) {
    console.error('Erro ao excluir turma:', err);
    res.status(500).json({ erro: 'Erro ao excluir turma.' });
  }
});

// ----------------------------------------------------------------
// DELETE /api/turmas/:id/alunos/:alunoId — remove aluno da turma
// ----------------------------------------------------------------
router.delete('/:id/alunos/:alunoId', autenticar, exigirProfessor, async (req, res) => {
  try {
    const turmaId  = parseInt(req.params.id);
    const alunoId  = parseInt(req.params.alunoId);
    const { id: usuarioId, tipo } = req.usuario;

    const turmaResult = await pool.query('SELECT tu_professor_id FROM turma WHERE tu_id = $1', [turmaId]);
    if (turmaResult.rowCount === 0) return res.status(404).json({ erro: 'Turma não encontrada.' });

    if (tipo !== 'admin' && turmaResult.rows[0].tu_professor_id !== usuarioId) {
      return res.status(403).json({ erro: 'Acesso negado.' });
    }

    const result = await pool.query(
      'DELETE FROM turma_aluno WHERE ta_turma_id = $1 AND ta_aluno_id = $2 RETURNING ta_id',
      [turmaId, alunoId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Aluno não encontrado nesta turma.' });
    }

    res.json({ sucesso: true, mensagem: 'Aluno removido da turma.' });
  } catch (err) {
    console.error('Erro ao remover aluno:', err);
    res.status(500).json({ erro: 'Erro ao remover aluno da turma.' });
  }
});

module.exports = router;
