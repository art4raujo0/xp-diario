const express = require("express");
const pool = require("../config/db");
const { autenticar } = require("../middlewares/auth");
const { desbloquearConquistasElegiveis } = require("../services/conquistasService");
const router = express.Router();



router.get("/", autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const result = await pool.query(`
      SELECT 
        m.*,
        d.di_disciplina
      FROM meta m
      LEFT JOIN disciplina d ON d.di_id = m.me_disciplina
      WHERE m.me_usuario_id = $1
      ORDER BY m.me_id ASC
    `, [usuarioId]);

    res.json(result.rows);

  } catch (error) {
    console.error("Erro ao buscar metas:", error);
    res.status(500).json({ erro: "Erro ao buscar metas" });
  }
});



router.post("/", autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const {
      me_tipo,
      me_tempo_min,
      me_disciplina,
      me_data_inicio
    } = req.body;

    // validação
    if (!me_tipo || !me_tempo_min || me_tempo_min <= 0 || !me_disciplina) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    const result = await pool.query(
      `INSERT INTO meta 
      (me_tipo, me_tempo_min, me_disciplina, me_data_inicio, me_usuario_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [me_tipo, me_tempo_min, me_disciplina, me_data_inicio || null, usuarioId]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Erro ao criar meta:", error);
    res.status(500).json({ erro: "Erro ao criar meta" });
  }
});



router.put("/:id", autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id } = req.params;

    const {
      me_tipo,
      me_tempo_min,
      me_disciplina,
      me_data_inicio
    } = req.body;

    if (!me_tipo || !me_tempo_min || me_tempo_min <= 0 || !me_disciplina) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    const result = await pool.query(
      `UPDATE meta
       SET me_tipo = $1,
           me_tempo_min = $2,
           me_disciplina = $3,
           me_data_inicio = $4
       WHERE me_id = $5 AND me_usuario_id = $6
       RETURNING *`,
      [me_tipo, me_tempo_min, me_disciplina, me_data_inicio || null, id, usuarioId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Meta não encontrada" });
    }

    await desbloquearConquistasElegiveis(usuarioId);
    res.json(result.rows[0]);

  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
    res.status(500).json({ erro: "Erro ao atualizar meta" });
  }
});



router.delete("/:id", autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM meta WHERE me_id = $1 AND me_usuario_id = $2 RETURNING *",
      [id, usuarioId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Meta não encontrada" });
    }

    res.json({ mensagem: "Meta deletada com sucesso" });

  } catch (error) {
    console.error("Erro ao deletar meta:", error);
    res.status(500).json({ erro: "Erro ao deletar meta" });
  }
});


module.exports = router;
