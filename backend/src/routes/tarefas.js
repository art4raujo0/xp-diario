const express = require("express");
const pool = require("../config/db");
const { autenticar } = require("../middlewares/auth");

const router = express.Router();

function normalizarTexto(valor) {
  return String(valor || "").trim();
}

function normalizarData(valor) {
  if (valor === undefined || valor === null || valor === "") {
    return null;
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

function obterDataHojeLocal() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function extrairDataISO(valor) {
  if (!valor) {
    return null;
  }

  return String(valor).slice(0, 10);
}

function validarStatus(valor) {
  return valor === "pendente" || valor === "concluida";
}

async function buscarDisciplinaValida(disciplinaId) {
  if (disciplinaId === null || disciplinaId === undefined || disciplinaId === "") {
    return null;
  }

  const id = Number(disciplinaId);

  if (!Number.isInteger(id) || id <= 0) {
    return false;
  }

  const result = await pool.query(
    "SELECT di_id, di_disciplina FROM disciplina WHERE di_id = $1 LIMIT 1",
    [id]
  );

  if (result.rowCount === 0) {
    return false;
  }

  return result.rows[0];
}

async function registrarHistorico(client, dados) {
  await client.query(
    `INSERT INTO tarefa_historico
     (th_tarefa_id, th_usuario_id, th_acao, th_titulo_snapshot, th_status_anterior, th_status_novo, th_descricao)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      dados.tarefaId || null,
      dados.usuarioId,
      dados.acao,
      dados.titulo,
      dados.statusAnterior || null,
      dados.statusNovo || null,
      dados.descricao || null
    ]
  );
}

async function listarTarefasEHistorico(usuarioId) {
  const [tarefasResult, historicoResult] = await Promise.all([
    pool.query(
      `SELECT
         t.ta_id,
         t.ta_usuario_id,
         t.ta_titulo,
         t.ta_descricao,
         t.ta_prazo,
         t.ta_status,
         t.ta_concluida_em,
         t.ta_criado_em,
         t.ta_atualizado_em,
         t.ta_disciplina_id,
         d.di_disciplina,
         d.di_cor
       FROM tarefa t
       LEFT JOIN disciplina d ON d.di_id = t.ta_disciplina_id
       WHERE t.ta_usuario_id = $1
       ORDER BY
         CASE WHEN t.ta_status = 'pendente' THEN 0 ELSE 1 END,
         t.ta_prazo ASC NULLS LAST,
         t.ta_atualizado_em DESC`,
      [usuarioId]
    ),
    pool.query(
      `SELECT
         th_id,
         th_tarefa_id,
         th_acao,
         th_titulo_snapshot,
         th_status_anterior,
         th_status_novo,
         th_descricao,
         th_criado_em
       FROM tarefa_historico
       WHERE th_usuario_id = $1
       ORDER BY th_criado_em DESC, th_id DESC
       LIMIT 50`,
      [usuarioId]
    )
  ]);

  const tarefas = tarefasResult.rows;
  const concluidas = tarefas.filter((tarefa) => tarefa.ta_status === "concluida").length;
  const pendentes = tarefas.length - concluidas;
  const hoje = obterDataHojeLocal();
  const vencidas = tarefas.filter(
    (tarefa) => tarefa.ta_status === "pendente" && tarefa.ta_prazo && extrairDataISO(tarefa.ta_prazo) < hoje
  ).length;

  return {
    sucesso: true,
    resumo: {
      total: tarefas.length,
      pendentes,
      concluidas,
      vencidas
    },
    tarefas,
    historico: historicoResult.rows
  };
}

router.get("/", autenticar, async (req, res) => {
  try {
    const dados = await listarTarefasEHistorico(req.usuario.id);
    res.json(dados);
  } catch (error) {
    console.error("Erro ao buscar tarefas:", error);
    res.status(500).json({ erro: "Erro ao buscar tarefas" });
  }
});

router.post("/", autenticar, async (req, res) => {
  const client = await pool.connect();

  try {
    const usuarioId = req.usuario.id;
    const titulo = normalizarTexto(req.body.ta_titulo);
    const descricao = normalizarTexto(req.body.ta_descricao);
    const prazo = normalizarData(req.body.ta_prazo);
    const hoje = obterDataHojeLocal();

    if (!titulo) {
      return res.status(400).json({ erro: "Titulo da tarefa e obrigatorio" });
    }

    if (req.body.ta_prazo !== undefined && req.body.ta_prazo !== null && req.body.ta_prazo !== "" && !prazo) {
      return res.status(400).json({ erro: "Prazo da tarefa invalido" });
    }

    if (prazo && prazo < hoje) {
      return res.status(400).json({ erro: "O prazo da tarefa nao pode ser anterior a data de criacao" });
    }

    const disciplina = await buscarDisciplinaValida(req.body.ta_disciplina_id);

    if (disciplina === false) {
      return res.status(400).json({ erro: "Materia associada invalida" });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO tarefa
       (ta_usuario_id, ta_titulo, ta_descricao, ta_prazo, ta_disciplina, ta_disciplina_id, ta_status, ta_concluida)
       VALUES ($1, $2, $3, $4, $5, $6, 'pendente', FALSE)
       RETURNING *`,
      [
        usuarioId,
        titulo,
        descricao || null,
        prazo,
        disciplina ? disciplina.di_id : null,
        disciplina ? disciplina.di_id : null
      ]
    );

    await registrarHistorico(client, {
      tarefaId: result.rows[0].ta_id,
      usuarioId,
      acao: "criada",
      titulo,
      statusNovo: "pendente",
      descricao: "Tarefa criada"
    });

    await client.query("COMMIT");

    res.status(201).json({
      sucesso: true,
      mensagem: "Tarefa cadastrada com sucesso",
      tarefa: {
        ...result.rows[0],
        di_disciplina: disciplina ? disciplina.di_disciplina : null
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao criar tarefa:", error);
    res.status(500).json({ erro: "Erro ao criar tarefa" });
  } finally {
    client.release();
  }
});

router.put("/:id", autenticar, async (req, res) => {
  const client = await pool.connect();

  try {
    const usuarioId = req.usuario.id;
    const tarefaId = Number(req.params.id);
    const titulo = normalizarTexto(req.body.ta_titulo);
    const descricao = normalizarTexto(req.body.ta_descricao);
    const prazo = normalizarData(req.body.ta_prazo);

    if (!Number.isInteger(tarefaId) || tarefaId <= 0) {
      return res.status(400).json({ erro: "Tarefa invalida" });
    }

    if (!titulo) {
      return res.status(400).json({ erro: "Titulo da tarefa e obrigatorio" });
    }

    if (req.body.ta_prazo !== undefined && req.body.ta_prazo !== null && req.body.ta_prazo !== "" && !prazo) {
      return res.status(400).json({ erro: "Prazo da tarefa invalido" });
    }

    const disciplina = await buscarDisciplinaValida(req.body.ta_disciplina_id);

    if (disciplina === false) {
      return res.status(400).json({ erro: "Materia associada invalida" });
    }

    await client.query("BEGIN");

    const atualResult = await client.query(
      `SELECT *
       FROM tarefa
       WHERE ta_id = $1 AND ta_usuario_id = $2
       LIMIT 1`,
      [tarefaId, usuarioId]
    );

    if (atualResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erro: "Tarefa nao encontrada" });
    }

    const tarefaAtual = atualResult.rows[0];
    const dataCriacao = extrairDataISO(tarefaAtual.ta_criado_em);
    const hojeLocal = obterDataHojeLocal();
    const dataMinimaPrazo = dataCriacao && dataCriacao < hojeLocal
      ? dataCriacao
      : hojeLocal;

    if (prazo && dataMinimaPrazo && prazo < dataMinimaPrazo) {
      await client.query("ROLLBACK");
      return res.status(400).json({ erro: "O prazo da tarefa nao pode ser anterior a data de criacao" });
    }

    const updateResult = await client.query(
      `UPDATE tarefa
       SET ta_titulo = $1,
           ta_descricao = $2,
           ta_prazo = $3,
           ta_disciplina = $4,
           ta_disciplina_id = $5,
           ta_atualizado_em = NOW()
       WHERE ta_id = $6 AND ta_usuario_id = $7
       RETURNING *`,
      [
        titulo,
        descricao || null,
        prazo,
        disciplina ? disciplina.di_id : null,
        disciplina ? disciplina.di_id : null,
        tarefaId,
        usuarioId
      ]
    );

    await registrarHistorico(client, {
      tarefaId,
      usuarioId,
      acao: "atualizada",
      titulo,
      statusAnterior: tarefaAtual.ta_status,
      statusNovo: tarefaAtual.ta_status,
      descricao: "Dados da tarefa atualizados"
    });

    await client.query("COMMIT");

    res.json({
      sucesso: true,
      mensagem: "Tarefa atualizada com sucesso",
      tarefa: {
        ...updateResult.rows[0],
        di_disciplina: disciplina ? disciplina.di_disciplina : null
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao atualizar tarefa:", error);
    res.status(500).json({ erro: "Erro ao atualizar tarefa" });
  } finally {
    client.release();
  }
});

router.patch("/:id/status", autenticar, async (req, res) => {
  const client = await pool.connect();

  try {
    const usuarioId = req.usuario.id;
    const tarefaId = Number(req.params.id);
    const status = normalizarTexto(req.body.status).toLowerCase();

    if (!Number.isInteger(tarefaId) || tarefaId <= 0) {
      return res.status(400).json({ erro: "Tarefa invalida" });
    }

    if (!validarStatus(status)) {
      return res.status(400).json({ erro: "Status da tarefa invalido" });
    }

    await client.query("BEGIN");

    const atualResult = await client.query(
      `SELECT
         t.*,
         d.di_disciplina
       FROM tarefa t
       LEFT JOIN disciplina d ON d.di_id = t.ta_disciplina_id
       WHERE t.ta_id = $1 AND t.ta_usuario_id = $2
       LIMIT 1`,
      [tarefaId, usuarioId]
    );

    if (atualResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erro: "Tarefa nao encontrada" });
    }

    const tarefaAtual = atualResult.rows[0];

    const updateResult = await client.query(
      `UPDATE tarefa
       SET ta_status = $1::varchar(20),
           ta_concluida = CASE WHEN $1::varchar(20) = 'concluida' THEN TRUE ELSE FALSE END,
           ta_concluida_em = CASE WHEN $1::varchar(20) = 'concluida' THEN NOW() ELSE NULL END,
           ta_atualizado_em = NOW()
       WHERE ta_id = $2 AND ta_usuario_id = $3
       RETURNING *`,
      [status, tarefaId, usuarioId]
    );

    await registrarHistorico(client, {
      tarefaId,
      usuarioId,
      acao: "status_alterado",
      titulo: tarefaAtual.ta_titulo,
      statusAnterior: tarefaAtual.ta_status,
      statusNovo: status,
      descricao: status === "concluida"
        ? "Tarefa marcada como concluida"
        : "Tarefa retornou para pendente"
    });

    await client.query("COMMIT");

    res.json({
      sucesso: true,
      mensagem: status === "concluida"
        ? "Tarefa concluida com sucesso"
        : "Tarefa atualizada para pendente",
      tarefa: {
        ...updateResult.rows[0],
        di_disciplina: tarefaAtual.di_disciplina || null
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao alterar status da tarefa:", error);
    res.status(500).json({ erro: "Erro ao alterar status da tarefa" });
  } finally {
    client.release();
  }
});

router.delete("/:id", autenticar, async (req, res) => {
  const client = await pool.connect();

  try {
    const usuarioId = req.usuario.id;
    const tarefaId = Number(req.params.id);

    if (!Number.isInteger(tarefaId) || tarefaId <= 0) {
      return res.status(400).json({ erro: "Tarefa invalida" });
    }

    await client.query("BEGIN");

    const atualResult = await client.query(
      `SELECT *
       FROM tarefa
       WHERE ta_id = $1 AND ta_usuario_id = $2
       LIMIT 1`,
      [tarefaId, usuarioId]
    );

    if (atualResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erro: "Tarefa nao encontrada" });
    }

    const tarefaAtual = atualResult.rows[0];

    await registrarHistorico(client, {
      tarefaId,
      usuarioId,
      acao: "excluida",
      titulo: tarefaAtual.ta_titulo,
      statusAnterior: tarefaAtual.ta_status,
      statusNovo: null,
      descricao: "Tarefa excluida"
    });

    await client.query(
      "DELETE FROM tarefa WHERE ta_id = $1 AND ta_usuario_id = $2",
      [tarefaId, usuarioId]
    );

    await client.query("COMMIT");

    res.json({
      sucesso: true,
      mensagem: "Tarefa excluida com sucesso"
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao excluir tarefa:", error);
    res.status(500).json({ erro: "Erro ao excluir tarefa" });
  } finally {
    client.release();
  }
});

module.exports = router;
