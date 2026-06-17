const express = require("express");
const pool = require("../config/db");
const { autenticar } = require("../middlewares/auth");

const router = express.Router();

function validarData(valor) {
  if (!valor) return null;
  const texto = String(valor).slice(0, 10);
  const partes = texto.split("-");
  if (partes.length !== 3) return null;
  const [ano, mes, dia] = partes.map(Number);
  if (!ano || !mes || !dia) return null;
  const d = new Date(ano, mes - 1, dia);
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;
  return texto;
}

router.get("/", autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const inicio = validarData(req.query.inicio);
    const fim = validarData(req.query.fim);

    if (!inicio || !fim) {
      return res.status(400).json({ erro: "Informe datas de início e fim válidas (YYYY-MM-DD)." });
    }

    if (inicio > fim) {
      return res.status(400).json({ erro: "A data de início não pode ser maior que a data de fim." });
    }

    const resumoResult = await pool.query(
      `SELECT
         COUNT(*)::int           AS total_sessoes,
         COALESCE(SUM(at_tempo_min), 0)::int  AS total_minutos,
         COALESCE(SUM(at_tarefas_concluidas), 0)::int AS total_tarefas
       FROM atividade
       WHERE at_usuario_id = $1
         AND at_data BETWEEN $2 AND $3`,
      [usuarioId, inicio, fim]
    );

    const porDisciplinaResult = await pool.query(
      `SELECT
         d.di_disciplina   AS nome,
         d.di_cor          AS cor,
         COUNT(*)::int     AS sessoes,
         COALESCE(SUM(a.at_tempo_min), 0)::int AS minutos
       FROM atividade a
       INNER JOIN disciplina d ON d.di_id = a.at_disciplina
       WHERE a.at_usuario_id = $1
         AND a.at_data BETWEEN $2 AND $3
       GROUP BY d.di_id, d.di_disciplina, d.di_cor
       ORDER BY minutos DESC`,
      [usuarioId, inicio, fim]
    );

    const { total_sessoes, total_minutos, total_tarefas } = resumoResult.rows[0];

    res.json({
      sucesso: true,
      periodo: { inicio, fim },
      resumo: { total_sessoes, total_minutos, total_tarefas },
      por_disciplina: porDisciplinaResult.rows
    });
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    res.status(500).json({ erro: "Erro ao gerar relatório." });
  }
});

module.exports = router;
