const express = require('express');
const pool = require('../config/db');
const { autenticar } = require('../middlewares/auth');

const router = express.Router();

// Garante que a tabela existe no banco ao iniciar a rota
// Assim não é necessário executar o SQL manualmente
pool.query(`
  CREATE TABLE IF NOT EXISTS notificacoes_config (
    nc_id SERIAL PRIMARY KEY,
    nc_usuario_id INTEGER NOT NULL REFERENCES usuarios(us_id) ON DELETE CASCADE,
    nc_ativo BOOLEAN NOT NULL DEFAULT FALSE,
    nc_horario TIME NOT NULL DEFAULT '08:00',
    nc_fuso_horario VARCHAR(60) NOT NULL DEFAULT 'America/Sao_Paulo',
    nc_ultimo_envio DATE NULL,
    nc_atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT notificacoes_config_usuario_unique UNIQUE (nc_usuario_id)
  )
`).then(() => {
  console.log('[Notificações] Tabela notificacoes_config verificada/criada com sucesso.');
}).catch(err => {
  console.error('[Notificações] Erro ao criar tabela:', err.message);
});

// GET /api/notificacoes - busca config do usuário autenticado
router.get('/', autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const result = await pool.query(
      `SELECT nc_ativo, nc_horario, nc_fuso_horario
       FROM notificacoes_config
       WHERE nc_usuario_id = $1
       LIMIT 1`,
      [usuarioId]
    );

    if (result.rowCount === 0) {
      // Retorna config padrão se ainda não existir
      return res.json({
        ativo: false,
        horario: '08:00',
        fuso_horario: 'America/Sao_Paulo'
      });
    }

    const config = result.rows[0];
    // nc_horario vem como "HH:mm:ss" do postgres TIME — trunca para HH:mm
    const horario = config.nc_horario ? config.nc_horario.slice(0, 5) : '08:00';

    return res.json({
      ativo: config.nc_ativo,
      horario,
      fuso_horario: config.nc_fuso_horario
    });
  } catch (error) {
    console.error('Erro ao buscar config de notificação:', error);
    return res.status(500).json({ erro: 'Erro interno ao buscar configuração.' });
  }
});

// PUT /api/notificacoes - salva/atualiza config do usuário autenticado
router.put('/', autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { ativo, horario, fuso_horario } = req.body;

    // Validação do horário
    const horarioRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!horario || !horarioRegex.test(horario)) {
      return res.status(400).json({ erro: 'Horário inválido. Use o formato HH:mm.' });
    }

    if (typeof ativo !== 'boolean') {
      return res.status(400).json({ erro: 'Campo "ativo" deve ser verdadeiro ou falso.' });
    }

    const fuso = fuso_horario || 'America/Sao_Paulo';

    await pool.query(
      `INSERT INTO notificacoes_config (nc_usuario_id, nc_ativo, nc_horario, nc_fuso_horario, nc_atualizado_em)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (nc_usuario_id) DO UPDATE
         SET nc_ativo = EXCLUDED.nc_ativo,
             nc_horario = EXCLUDED.nc_horario,
             nc_fuso_horario = EXCLUDED.nc_fuso_horario,
             nc_atualizado_em = NOW()`,
      [usuarioId, ativo, horario, fuso]
    );

    return res.json({ sucesso: true, mensagem: 'Configuração salva com sucesso.' });
  } catch (error) {
    console.error('Erro ao salvar config de notificação:', error);
    return res.status(500).json({ erro: 'Erro interno ao salvar configuração.' });
  }
});

module.exports = router;
