const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const pool = require('../config/db');

router.post('/', async (req, res) => {
  const nome = (req.body.nome || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const senha = req.body.senha;
  const confirmarSenha = req.body.confirmarSenha;
  const tipo = ['professor', 'aluno'].includes(req.body.us_tipo) ? req.body.us_tipo : 'aluno';
  const objetivoEstudo = req.body.objetivo_estudo ? String(req.body.objetivo_estudo).trim().slice(0, 255) : null;
  const horasDisponiveisRaw = req.body.horas_disponiveis ? Number(req.body.horas_disponiveis) : null;
  const horasDisponiveis = horasDisponiveisRaw !== null && horasDisponiveisRaw > 0 && horasDisponiveisRaw <= 24 ? horasDisponiveisRaw : null;

  if (!nome || !email || !senha || !confirmarSenha) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  if (nome.length < 3) {
    return res.status(400).json({ erro: 'O nome deve possuir no mínimo 3 caracteres.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ erro: 'Formato de e-mail inválido.' });
  }

  if (typeof senha !== 'string' || senha.length < 6) {
    return res.status(400).json({ erro: 'A senha deve possuir no mínimo 6 caracteres.' });
  }

  if (senha !== confirmarSenha) {
    return res.status(400).json({ erro: 'A confirmação de senha deve ser idêntica à senha informada.' });
  }

  try {
    const usuarioExistente = await pool.query(
      'SELECT us_id FROM usuarios WHERE us_email = $1',
      [email]
    );

    if (usuarioExistente.rowCount > 0) {
      return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const novoUsuario = await pool.query(
      `INSERT INTO usuarios (us_nome, us_email, us_senha_hash, us_tipo, us_objetivo_estudo, us_horas_disponiveis)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING us_id, us_nome, us_email, us_tipo`,
      [nome, email, senhaHash, tipo, objetivoEstudo, horasDisponiveis]
    );

    const usuario = novoUsuario.rows[0];
    const token = jwt.sign(
      { id: usuario.us_id, nome: usuario.us_nome, email: usuario.us_email, tipo: usuario.us_tipo },
      process.env.JWT_SECRET || 'chave_super_secreta_padrao',
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      mensagem: 'Conta criada com sucesso.',
      token,
      tipo: usuario.us_tipo,
      usuario
    });
  } catch (erro) {
    console.error('Erro na rota de cadastro:', erro);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

module.exports = router;
