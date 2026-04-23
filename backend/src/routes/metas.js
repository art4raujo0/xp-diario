const express = require("express");
const pool = require("../config/db");
const router = express.Router();


//listar metas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM meta ORDER BY me_id ASC"
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao buscar metas"
    });
  }
});


//criar metas
router.post("/", async (req, res) => {
  try {
    const {
      me_tipo,
      me_tempo_min,
      me_disciplina,
      me_data_inicio
    } = req.body;

    if (!me_tipo || !me_tempo_min || me_tempo_min <= 0 || !me_disciplina) {
      return res.status(400).json({
        erro: "Dados inválidos"
      });
    }

    const result = await pool.query(
      `INSERT INTO meta 
      (me_tipo, me_tempo_min, me_disciplina, me_data_inicio)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [me_tipo, me_tempo_min, me_disciplina, me_data_inicio]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao criar meta"
    });
  }
});


//editar metas
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      me_tipo,
      me_tempo_min,
      me_disciplina,
      me_data_inicio
    } = req.body;

    if (!me_tipo || !me_tempo_min || me_tempo_min <= 0 || !me_disciplina) {
      return res.status(400).json({
        erro: "Dados inválidos"
      });
    }

    const result = await pool.query(
      `UPDATE meta
       SET me_tipo = $1,
           me_tempo_min = $2,
           me_disciplina = $3,
           me_data_inicio = $4
       WHERE me_id = $5
       RETURNING *`,
      [me_tipo, me_tempo_min, me_disciplina, me_data_inicio, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "Meta não encontrada"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao atualizar meta"
    });
  }
});


//deletar
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM meta WHERE me_id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        erro: "Meta não encontrada"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      erro: "Erro ao deletar meta"
    });
  }
});


module.exports = router;