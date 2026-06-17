const express = require("express");
const pool = require("../config/db");
const { autenticar } = require("../middlewares/auth");
const router = express.Router();

router.get("/", autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const result = await pool.query(
      "SELECT * FROM disciplina WHERE (di_usuario_id = $1 OR di_usuario_id IS NULL) ORDER BY di_id ASC",
      [usuarioId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar disciplinas" });
  }
});

router.post("/", autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { di_disciplina, di_dificuldade, di_descricao, di_cor } = req.body;
    const nome = (di_disciplina || "").trim();

    if (!nome) {
      return res.status(400).json({ erro: "Nome da matéria é obrigatório" });
    }

    const duplicada = await pool.query(
      "SELECT di_id FROM disciplina WHERE LOWER(TRIM(di_disciplina)) = LOWER(TRIM($1)) AND (di_usuario_id = $2 OR di_usuario_id IS NULL) LIMIT 1",
      [nome, usuarioId]
    );

    if (duplicada.rowCount > 0) {
      return res.status(409).json({ erro: "Matéria já cadastrada" });
    }

    const result = await pool.query(
      `INSERT INTO disciplina (di_disciplina, di_dificuldade, di_descricao, di_cor, di_usuario_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nome, di_dificuldade, di_descricao, di_cor, usuarioId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao criar disciplina" });
  }
});

router.put("/:id", autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id } = req.params;
    const { di_disciplina, di_dificuldade, di_descricao, di_cor } = req.body;
    const nome = (di_disciplina || "").trim();

    if (!nome) {
      return res.status(400).json({ erro: "Nome da matéria é obrigatório" });
    }

    const result = await pool.query(
      `UPDATE disciplina
       SET di_disciplina = $1, di_dificuldade = $2, di_descricao = $3, di_cor = $4
       WHERE di_id = $5 AND (di_usuario_id = $6 OR di_usuario_id IS NULL)
       RETURNING *`,
      [nome, di_dificuldade, di_descricao, di_cor, id, usuarioId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Disciplina não encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao atualizar disciplina" });
  }
});

router.delete("/:id", autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM disciplina WHERE di_id = $1 AND (di_usuario_id = $2 OR di_usuario_id IS NULL) RETURNING *",
      [id, usuarioId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Disciplina não encontrada" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao deletar disciplina" });
  }
});

module.exports = router;
