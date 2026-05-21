const express = require("express");
const pool = require("../config/db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM disciplina ORDER BY di_id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao buscar disciplinas"
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { di_disciplina, di_dificuldade, di_descricao, di_cor } = req.body;
    const nome = (di_disciplina || "").trim();

    if (!nome) {
      return res.status(400).json({
        erro: "Nome da matéria é obrigatório"
      });
    }

    const duplicada = await pool.query(
      "SELECT di_id FROM disciplina WHERE LOWER(TRIM(di_disciplina)) = LOWER(TRIM($1)) LIMIT 1",
      [nome]
    );

    if (duplicada.rowCount > 0) {
      return res.status(409).json({
        erro: "Matéria já cadastrada"
      });
    }

    const result = await pool.query(
      `INSERT INTO disciplina (di_disciplina, di_dificuldade, di_descricao, di_cor)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nome, di_dificuldade, di_descricao, di_cor]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao criar disciplina"
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { di_disciplina, di_dificuldade, di_descricao, di_cor } = req.body;
    const nome = (di_disciplina || "").trim();

    if (!nome) {
      return res.status(400).json({
        erro: "Nome da matéria é obrigatório"
      });
    }

    const result = await pool.query(
      `UPDATE disciplina
       SET di_disciplina = $1, di_dificuldade = $2, di_descricao = $3, di_cor = $4
       WHERE di_id = $5
       RETURNING *`,
      [nome, di_dificuldade, di_descricao, di_cor, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "Disciplina não encontrada"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao atualizar disciplina"
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM disciplina WHERE di_id = $1 RETURNING *", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({
        erro: "Disciplina não encontrada"
      });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao deletar disciplina"
    });
  }
});

module.exports = router;
