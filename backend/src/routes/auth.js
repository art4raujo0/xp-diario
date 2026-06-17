const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const pool = require('../config/db');

const router = express.Router();

function criarTransporte() {
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true';
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    requireTLS: !secure,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    tls: { rejectUnauthorized: true }
  });
}

// POST /api/auth/esqueci-senha
router.post('/esqueci-senha', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const RESP = { mensagem: 'Se esse e-mail estiver cadastrado, você receberá as instruções em breve.' };

  if (!email) return res.status(400).json({ erro: 'E-mail obrigatório.' });

  try {
    const user = await pool.query(
      'SELECT us_id, us_nome FROM usuarios WHERE LOWER(us_email) = $1',
      [email]
    );
    if (user.rowCount === 0) return res.json(RESP);

    const { us_id, us_nome } = user.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await pool.query(
      'UPDATE usuarios SET us_reset_token = $1, us_reset_token_expiry = $2 WHERE us_id = $3',
      [token, expiry, us_id]
    );

    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const link = `${appUrl}/redefinir-senha?token=${token}`;
    const nome = (us_nome || 'Usuário').split(' ')[0];

    const transporter = criarTransporte();
    await transporter.sendMail({
      from: `"XP Diário" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'XP Diário — Redefinição de senha',
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;background:#f4f5ff;padding:32px 16px;">
          <div style="background:#1a1032;border-radius:16px;padding:32px;color:#fff;text-align:center;margin-bottom:20px;">
            <div style="font-size:2.5rem;">🎓</div>
            <h2 style="margin:8px 0 4px;font-size:1.4rem;">XP Diário</h2>
            <p style="opacity:.7;font-size:.85rem;margin:0;">Redefinição de Senha</p>
          </div>
          <div style="background:#fff;border-radius:16px;padding:28px;">
            <p style="color:#1e293b;font-size:1rem;">Olá, <strong>${nome}</strong>!</p>
            <p style="color:#475569;font-size:.9rem;line-height:1.6;">
              Recebemos uma solicitação para redefinir a senha da sua conta.
              Clique no botão abaixo para criar uma nova senha:
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${link}"
                style="background:#5b5ef4;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:.95rem;display:inline-block;">
                🔐 Redefinir Senha
              </a>
            </div>
            <p style="color:#94a3b8;font-size:.78rem;text-align:center;margin:0;">
              Este link expira em <strong>1 hora</strong>.<br>
              Se você não solicitou a redefinição, ignore este e-mail.
            </p>
          </div>
        </div>
      `
    });

    res.json(RESP);
  } catch (err) {
    console.error('[auth] Erro em esqueci-senha:', err.message);
    res.status(500).json({ erro: 'Erro ao processar solicitação. Tente novamente.' });
  }
});

// POST /api/auth/redefinir-senha
router.post('/redefinir-senha', async (req, res) => {
  const { token, novaSenha } = req.body;

  if (!token || !novaSenha) return res.status(400).json({ erro: 'Dados incompletos.' });
  if (novaSenha.length < 6) return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });

  try {
    const user = await pool.query(
      'SELECT us_id FROM usuarios WHERE us_reset_token = $1 AND us_reset_token_expiry > NOW()',
      [token]
    );

    if (user.rowCount === 0) {
      return res.status(400).json({ erro: 'Link inválido ou expirado. Solicite um novo.' });
    }

    const hash = await bcrypt.hash(novaSenha, 10);
    await pool.query(
      'UPDATE usuarios SET us_senha = $1, us_reset_token = NULL, us_reset_token_expiry = NULL WHERE us_id = $2',
      [hash, user.rows[0].us_id]
    );

    res.json({ mensagem: 'Senha redefinida com sucesso! Você já pode fazer login.' });
  } catch (err) {
    console.error('[auth] Erro em redefinir-senha:', err.message);
    res.status(500).json({ erro: 'Erro ao redefinir senha. Tente novamente.' });
  }
});

module.exports = router;
