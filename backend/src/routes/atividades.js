const express = require("express");
const pool = require("../config/db");
const { autenticar } = require("../middlewares/auth");
const { desbloquearConquistasElegiveis } = require("../services/conquistasService");

const router = express.Router();

function normalizarData(valor) {
  if (!valor) {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  const texto = String(valor).slice(0, 10);
  const partes = texto.split("-");

  if (partes.length !== 3) {
    return null;
  }

  const [ano, mes, dia] = partes.map(Number);

  if (!ano || !mes || !dia) {
    return null;
  }

  const data = new Date(ano, mes - 1, dia);

  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return null;
  }

  return texto;
}

function tratarErroDependenciaBanco(error, res) {
  if (error && error.code === "42P01") {
    return res.status(500).json({
      erro: "Tabela atividade nao encontrada. Execute o script SQL da funcionalidade de progresso."
    });
  }

  return null;
}

router.get("/", autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const result = await pool.query(`
      SELECT
        a.*,
        d.di_disciplina
      FROM atividade a
      INNER JOIN disciplina d ON d.di_id = a.at_disciplina
      WHERE a.at_usuario_id = $1
      ORDER BY a.at_data DESC, a.at_id DESC
    `, [usuarioId]);

    res.json({
      sucesso: true,
      total: result.rows.length,
      historico: result.rows
    });
  } catch (error) {
    console.error("Erro ao buscar atividades:", error);

    if (tratarErroDependenciaBanco(error, res)) {
      return;
    }

    res.status(500).json({
      erro: "Erro ao buscar atividades"
    });
  }
});

router.post("/", autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const disciplinaId = Number(req.body.at_disciplina);
    const tempoMin = Number(req.body.at_tempo_min);
    const tarefasConcluidas = req.body.at_tarefas_concluidas === undefined || req.body.at_tarefas_concluidas === null || req.body.at_tarefas_concluidas === ""
      ? 0
      : Number(req.body.at_tarefas_concluidas);
    const descricao = (req.body.at_descricao || "").trim();
    const dataAtividade = normalizarData(req.body.at_data);

    if (!Number.isInteger(disciplinaId) || disciplinaId <= 0) {
      return res.status(400).json({
        erro: "Disciplina invalida"
      });
    }

    if (!Number.isInteger(tempoMin) || tempoMin <= 0) {
      return res.status(400).json({
        erro: "Tempo estudado invalido"
      });
    }

    if (!Number.isInteger(tarefasConcluidas) || tarefasConcluidas < 0) {
      return res.status(400).json({
        erro: "Quantidade de tarefas concluidas invalida"
      });
    }

    if (!dataAtividade) {
      return res.status(400).json({
        erro: "Data da atividade invalida"
      });
    }

    const disciplinaResult = await pool.query(
      "SELECT di_id, di_disciplina FROM disciplina WHERE di_id = $1 LIMIT 1",
      [disciplinaId]
    );

    if (disciplinaResult.rowCount === 0) {
      return res.status(404).json({
        erro: "Disciplina nao encontrada"
      });
    }

    const result = await pool.query(
      `INSERT INTO atividade
      (at_disciplina, at_tempo_min, at_tarefas_concluidas, at_data, at_descricao, at_usuario_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        disciplinaId,
        tempoMin,
        tarefasConcluidas,
        dataAtividade,
        descricao || null,
        usuarioId
      ]
    );

    const desbloqueio = await desbloquearConquistasElegiveis(usuarioId);

    res.status(201).json({
      sucesso: true,
      mensagem: "Registro de estudo salvo com sucesso",
      dados: {
        ...result.rows[0],
        di_disciplina: disciplinaResult.rows[0].di_disciplina
      },
      conquistasDesbloqueadas: desbloqueio.desbloqueadasAgora
    });
  } catch (error) {
    console.error("Erro ao registrar atividade:", error);

    if (tratarErroDependenciaBanco(error, res)) {
      return;
    }

    res.status(500).json({
      erro: "Erro ao registrar atividade"
    });
  }
});

module.exports = router;
