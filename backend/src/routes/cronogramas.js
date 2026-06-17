const express = require("express");
const pool = require("../config/db");
const { autenticar } = require("../middlewares/auth");

const router = express.Router();

function normalizarData(valor) {
  if (!valor) {
    return null;
  }

  const texto = String(valor).trim().slice(0, 10);
  const formatoBrasileiro = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const formatoIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!formatoBrasileiro && !formatoIso) {
    return null;
  }

  const partes = formatoBrasileiro
    ? [formatoBrasileiro[3], formatoBrasileiro[2], formatoBrasileiro[1]]
    : [formatoIso[1], formatoIso[2], formatoIso[3]];

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

  return `${partes[0]}-${partes[1]}-${partes[2]}`;
}

function normalizarHorario(valor) {
  if (!valor) {
    return null;
  }

  const texto = String(valor).trim();
  const match = texto.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);

  if (!match) {
    return null;
  }

  const horas = Number(match[1]);
  const minutos = Number(match[2]);

  if (horas > 23 || minutos > 59) {
    return null;
  }

  return `${match[1]}:${match[2]}`;
}

function validarCronograma(body) {
  const disciplinaId = Number(body.cr_disciplina);
  const duracaoMin = Number(body.cr_duracao_min);
  const data = normalizarData(body.cr_data);
  const horarioInicio = normalizarHorario(body.cr_horario_inicio);

  if (!Number.isInteger(disciplinaId) || disciplinaId <= 0) {
    return { erro: "Matéria inválida" };
  }

  if (!data) {
    return { erro: "Data do cronograma inválida" };
  }

  if (!horarioInicio) {
    return { erro: "Horário de início inválido" };
  }

  if (!Number.isInteger(duracaoMin) || duracaoMin <= 0) {
    return { erro: "Duração da sessão deve ser maior que zero" };
  }

  return {
    dados: {
      disciplinaId,
      data,
      horarioInicio,
      duracaoMin
    }
  };
}

async function buscarDisciplina(disciplinaId) {
  const result = await pool.query(
    "SELECT di_id, di_disciplina FROM disciplina WHERE di_id = $1 LIMIT 1",
    [disciplinaId]
  );

  return result.rows[0] || null;
}

async function existeCronogramaDuplicado({ usuarioId, disciplinaId, data, horarioInicio, ignorarId }) {
  const params = [usuarioId, disciplinaId, data, horarioInicio];
  let filtroId = "";

  if (ignorarId) {
    params.push(ignorarId);
    filtroId = "AND cr_id <> $5";
  }

  const result = await pool.query(
    `SELECT cr_id
     FROM cronograma_estudo
     WHERE cr_usuario_id = $1
       AND cr_disciplina = $2
       AND cr_data = $3
       AND cr_horario_inicio = $4
       ${filtroId}
     LIMIT 1`,
    params
  );

  return result.rowCount > 0;
}

function tratarErroDependenciaBanco(error, res) {
  if (error && error.code === "42P01") {
    return res.status(500).json({
      erro: "Tabela cronograma_estudo não encontrada. Execute o script SQL da funcionalidade de cronogramas."
    });
  }

  if (error && error.code === "23505") {
    return res.status(409).json({
      erro: "Já existe um cronograma para esta matéria, data e horário"
    });
  }

  return null;
}

router.get("/", autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const result = await pool.query(`
      SELECT
        c.*,
        d.di_disciplina,
        d.di_cor
      FROM cronograma_estudo c
      INNER JOIN disciplina d ON d.di_id = c.cr_disciplina
      WHERE c.cr_usuario_id = $1
      ORDER BY c.cr_data ASC, c.cr_horario_inicio ASC, c.cr_id ASC
    `, [usuarioId]);

    res.json({
      sucesso: true,
      total: result.rows.length,
      cronogramas: result.rows
    });
  } catch (error) {
    console.error("Erro ao buscar cronogramas:", error);

    if (tratarErroDependenciaBanco(error, res)) {
      return;
    }

    res.status(500).json({ erro: "Erro ao buscar cronogramas" });
  }
});

router.post("/", autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const validacao = validarCronograma(req.body);

    if (validacao.erro) {
      return res.status(400).json({ erro: validacao.erro });
    }

    const { disciplinaId, data, horarioInicio, duracaoMin } = validacao.dados;
    const disciplina = await buscarDisciplina(disciplinaId);

    if (!disciplina) {
      return res.status(404).json({ erro: "Matéria não encontrada" });
    }

    const duplicado = await existeCronogramaDuplicado({
      usuarioId,
      disciplinaId,
      data,
      horarioInicio
    });

    if (duplicado) {
      return res.status(409).json({
        erro: "Já existe um cronograma para esta matéria, data e horário"
      });
    }

    const result = await pool.query(
      `INSERT INTO cronograma_estudo
       (cr_usuario_id, cr_disciplina, cr_data, cr_horario_inicio, cr_duracao_min)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [usuarioId, disciplinaId, data, horarioInicio, duracaoMin]
    );

    res.status(201).json({
      sucesso: true,
      mensagem: "Cronograma salvo com sucesso",
      dados: {
        ...result.rows[0],
        di_disciplina: disciplina.di_disciplina
      }
    });
  } catch (error) {
    console.error("Erro ao criar cronograma:", error);

    if (tratarErroDependenciaBanco(error, res)) {
      return;
    }

    res.status(500).json({ erro: "Erro ao criar cronograma" });
  }
});

router.put("/:id", autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const id = Number(req.params.id);
    const validacao = validarCronograma(req.body);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ erro: "Cronograma inválido" });
    }

    if (validacao.erro) {
      return res.status(400).json({ erro: validacao.erro });
    }

    const { disciplinaId, data, horarioInicio, duracaoMin } = validacao.dados;
    const disciplina = await buscarDisciplina(disciplinaId);

    if (!disciplina) {
      return res.status(404).json({ erro: "Matéria não encontrada" });
    }

    const duplicado = await existeCronogramaDuplicado({
      usuarioId,
      disciplinaId,
      data,
      horarioInicio,
      ignorarId: id
    });

    if (duplicado) {
      return res.status(409).json({
        erro: "Já existe um cronograma para esta matéria, data e horário"
      });
    }

    const result = await pool.query(
      `UPDATE cronograma_estudo
       SET cr_disciplina = $1,
           cr_data = $2,
           cr_horario_inicio = $3,
           cr_duracao_min = $4,
           cr_atualizado_em = CURRENT_TIMESTAMP
       WHERE cr_id = $5 AND cr_usuario_id = $6
       RETURNING *`,
      [disciplinaId, data, horarioInicio, duracaoMin, id, usuarioId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Cronograma não encontrado" });
    }

    res.json({
      sucesso: true,
      mensagem: "Cronograma atualizado com sucesso",
      dados: {
        ...result.rows[0],
        di_disciplina: disciplina.di_disciplina
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar cronograma:", error);

    if (tratarErroDependenciaBanco(error, res)) {
      return;
    }

    res.status(500).json({ erro: "Erro ao atualizar cronograma" });
  }
});

router.delete("/:id", autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ erro: "Cronograma inválido" });
    }

    const result = await pool.query(
      "DELETE FROM cronograma_estudo WHERE cr_id = $1 AND cr_usuario_id = $2 RETURNING *",
      [id, usuarioId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Cronograma não encontrado" });
    }

    res.json({
      sucesso: true,
      mensagem: "Cronograma excluído com sucesso"
    });
  } catch (error) {
    console.error("Erro ao deletar cronograma:", error);

    if (tratarErroDependenciaBanco(error, res)) {
      return;
    }

    res.status(500).json({ erro: "Erro ao deletar cronograma" });
  }
});

router._test = {
  normalizarData,
  normalizarHorario,
  validarCronograma
};

module.exports = router;
