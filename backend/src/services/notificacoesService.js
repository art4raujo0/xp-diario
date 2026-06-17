/**
 * Serviço de Notificações Diárias
 *
 * Roda a cada minuto via node-cron.
 * Para cada usuário com notificação ativa:
 *   - Verifica o horário configurado no fuso do usuário
 *   - Garante no máximo 1 envio por dia (nc_ultimo_envio)
 *   - Envia e-mail via Nodemailer + Gmail SMTP
 */

const cron = require('node-cron');
const nodemailer = require('nodemailer');
const pool = require('../config/db');

// ---------------------------------------------------------------------------
// Transporte Gmail SMTP
// ---------------------------------------------------------------------------
function criarTransporte() {
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true'; // true para 465, false para 587
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    requireTLS: !secure, // força STARTTLS no 587
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

// ---------------------------------------------------------------------------
// Hora local do usuário no fuso configurado (HH:mm)
// ---------------------------------------------------------------------------
function horaLocalUsuario(fusoHorario) {
  // en-GB com hour12:false produz "HH:mm" confiável em todos os Node.js,
  // inclusive meia-noite como "00:xx" (pt-BR pode retornar "24:xx" em alguns ambientes)
  const fuso = fusoHorario || 'America/Sao_Paulo';
  try {
    const partes = new Intl.DateTimeFormat('en-GB', {
      timeZone: fuso,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(new Date());
    const h = partes.find(p => p.type === 'hour').value;
    const m = partes.find(p => p.type === 'minute').value;
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  } catch {
    const partes = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(new Date());
    const h = partes.find(p => p.type === 'hour').value;
    const m = partes.find(p => p.type === 'minute').value;
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  }
}

// Data local do usuário no formato YYYY-MM-DD
function dataLocalUsuario(fusoHorario) {
  try {
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: fusoHorario,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  }
}

// ---------------------------------------------------------------------------
// Envio de e-mail via Nodemailer
// ---------------------------------------------------------------------------
async function enviarEmailNotificacao(nomeUsuario, emailUsuario) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Notificações] SMTP não configurado. Defina SMTP_HOST, SMTP_USER e SMTP_PASS no .env');
    return;
  }

  const transporte = criarTransporte();
  const nome = nomeUsuario || 'estudante';
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  await transporte.sendMail({
    from: `"XP Diário" <${process.env.SMTP_USER}>`,
    to: emailUsuario,
    subject: '📚 Hora de estudar! Seu lembrete diário do XP Diário',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f6f8fb; padding: 32px 16px;">
        <div style="background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 2.5rem;">🎓</span>
            <h1 style="color: #2f2f41; font-size: 1.4rem; margin: 8px 0 0;">XP Diário</h1>
          </div>
          <h2 style="color: #2f2f41; font-size: 1.1rem; margin-bottom: 8px;">Olá, ${nome}! 👋</h2>
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Este é o seu <strong>lembrete diário de estudos</strong>. Não esqueça de registrar seu progresso hoje e manter sua sequência!
          </p>
          <div style="background: #f0ecff; border-radius: 10px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <span style="font-size: 1.8rem;">🔥</span>
            <p style="color: #583cd3; font-weight: 700; margin: 6px 0 0;">Mantenha sua sequência de estudos!</p>
          </div>
          <div style="text-align: center;">
            <a href="${appUrl}/app"
               style="display: inline-block; background: #6a49f2; color: #fff; text-decoration: none;
                      padding: 12px 32px; border-radius: 10px; font-weight: 600; font-size: 1rem;">
              Estudar agora 🚀
            </a>
          </div>
          <p style="color: #aaa; font-size: 0.75rem; text-align: center; margin-top: 28px;">
            Você recebe este e-mail porque ativou lembretes no XP Diário.<br>
            Para desativar, acesse Configurações de Notificação na plataforma.
          </p>
        </div>
      </div>
    `
  });
}

// ---------------------------------------------------------------------------
// Job principal — executado a cada minuto
// ---------------------------------------------------------------------------
async function verificarEEnviarNotificacoes() {
  try {
    const result = await pool.query(`
      SELECT
        nc.nc_id,
        nc.nc_usuario_id,
        nc.nc_horario,
        nc.nc_fuso_horario,
        nc.nc_ultimo_envio,
        u.us_email,
        u.us_nome
      FROM notificacoes_config nc
      JOIN usuarios u ON u.us_id = nc.nc_usuario_id
      WHERE nc.nc_ativo = TRUE
    `);

    for (const config of result.rows) {
      try {
        const fusoHorario = config.nc_fuso_horario || 'America/Sao_Paulo';
        const horaAtual = horaLocalUsuario(fusoHorario);
        const dataAtual = dataLocalUsuario(fusoHorario);
        const horarioConfigurado = config.nc_horario.slice(0, 5);

        if (horaAtual !== horarioConfigurado) continue;

        if (config.nc_ultimo_envio) {
          const ultimoEnvio = config.nc_ultimo_envio instanceof Date
            ? config.nc_ultimo_envio.toISOString().split('T')[0]
            : String(config.nc_ultimo_envio).split('T')[0];

          if (ultimoEnvio === dataAtual) continue;
        }

        await enviarEmailNotificacao(config.us_nome, config.us_email);

        await pool.query(
          `UPDATE notificacoes_config SET nc_ultimo_envio = $1 WHERE nc_id = $2`,
          [dataAtual, config.nc_id]
        );

        console.log(`[Notificações] E-mail enviado para ${config.us_email} (${dataAtual} ${horaAtual})`);
      } catch (erroEnvio) {
        console.error(`[Notificações] Erro ao enviar para usuário ${config.nc_usuario_id}:`, erroEnvio.message);
      }
    }
  } catch (error) {
    console.error('[Notificações] Erro no job de notificações:', error.message);
  }
}

// ---------------------------------------------------------------------------
// Inicialização do scheduler
// ---------------------------------------------------------------------------
function iniciarScheduler() {
  cron.schedule('* * * * *', verificarEEnviarNotificacoes);
  console.log('[Notificações] Scheduler de lembretes diários iniciado.');
}

module.exports = { iniciarScheduler };
