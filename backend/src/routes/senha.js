const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const pool = require('../config/db');

const router = express.Router();

function criarTransporte() {
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true';

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP nao configurado. Defina SMTP_HOST, SMTP_USER e SMTP_PASS.');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    requireTLS: !secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    tls: { rejectUnauthorized: true }
  });
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function appUrl(req) {
  const envUrl = process.env.APP_URL && process.env.APP_URL.replace(/\/$/, '');
  if (envUrl) return envUrl;
  return `${req.protocol}://${req.get('host')}`;
}

async function enviarEmailReset(req, usuario, token) {
  const resetUrl = `${appUrl(req)}/resetar-senha?token=${encodeURIComponent(token)}`;
  const transporte = criarTransporte();
  const nome = usuario.us_nome || 'estudante';

  await transporte.sendMail({
    from: `"XP Diario" <${process.env.SMTP_USER}>`,
    to: usuario.us_email,
    subject: 'Redefina sua senha do XP Diario',
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;background:#f8faff;padding:28px 16px;">
        <div style="background:#fff;border:1px solid #e2e8f8;border-radius:18px;padding:28px;box-shadow:0 12px 30px rgba(79,70,229,.08);">
          <h1 style="margin:0 0 8px;color:#4f46e5;font-size:24px;">XP Diario</h1>
          <h2 style="margin:0 0 16px;color:#17203a;font-size:18px;">Ola, ${nome}!</h2>
          <p style="color:#475569;line-height:1.6;">Recebemos uma solicitacao para redefinir sua senha. Clique no botao abaixo para criar uma nova senha.</p>
          <p style="text-align:center;margin:28px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:13px 24px;border-radius:12px;font-weight:700;">Redefinir senha</a>
          </p>
          <p style="color:#64748b;font-size:13px;line-height:1.5;">Este link expira em 1 hora. Se voce nao solicitou essa alteracao, ignore este e-mail.</p>
        </div>
      </div>
    `
  });
}

router.post('/esqueci', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const respostaGenerica = {
    sucesso: true,
    mensagem: 'Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.'
  };

  if (!email) {
    return res.status(400).json({ erro: 'Informe seu e-mail.' });
  }

  try {
    const result = await pool.query(
      'SELECT us_id, us_nome, us_email FROM usuarios WHERE us_email = $1 LIMIT 1',
      [email]
    );

    if (result.rowCount === 0) {
      return res.json(respostaGenerica);
    }

    const usuario = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);

    await pool.query(
      `UPDATE usuarios
       SET us_reset_token_hash = $1,
           us_reset_expira_em = NOW() + INTERVAL '1 hour'
       WHERE us_id = $2`,
      [tokenHash, usuario.us_id]
    );

    await enviarEmailReset(req, usuario, token);

    return res.json(respostaGenerica);
  } catch (error) {
    console.error('Erro ao solicitar redefinicao de senha:', error);
    return res.status(500).json({ erro: 'Nao foi possivel enviar o e-mail de redefinicao.' });
  }
});

router.post('/redefinir', async (req, res) => {
  const token = String(req.body.token || '').trim();
  const senha = req.body.senha;
  const confirmarSenha = req.body.confirmarSenha;

  if (!token) {
    return res.status(400).json({ erro: 'Token de redefinicao ausente.' });
  }

  if (typeof senha !== 'string' || senha.length < 6) {
    return res.status(400).json({ erro: 'A senha deve possuir no minimo 6 caracteres.' });
  }

  if (senha !== confirmarSenha) {
    return res.status(400).json({ erro: 'As senhas nao coincidem.' });
  }

  try {
    const tokenHash = hashToken(token);
    const result = await pool.query(
      `SELECT us_id
       FROM usuarios
       WHERE us_reset_token_hash = $1
         AND us_reset_expira_em > NOW()
       LIMIT 1`,
      [tokenHash]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ erro: 'Link invalido ou expirado. Solicite uma nova redefinicao.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    await pool.query(
      `UPDATE usuarios
       SET us_senha_hash = $1,
           us_reset_token_hash = NULL,
           us_reset_expira_em = NULL,
           us_tentativas_falhas = 0,
           us_bloqueado_ate = NULL
       WHERE us_id = $2`,
      [senhaHash, result.rows[0].us_id]
    );

    return res.json({ sucesso: true, mensagem: 'Senha redefinida com sucesso. Faca login novamente.' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ erro: 'Erro ao redefinir senha.' });
  }
});

module.exports = router;
