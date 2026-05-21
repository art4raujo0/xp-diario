const express = require("express");
const pool = require("../config/db");
const { autenticar } = require("../middlewares/auth");

const router = express.Router();

router.get("/", autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const result = await pool.query(
      `SELECT
         us_id,
         us_nome,
         us_email,
         COALESCE(us_pontos_total, 0) AS us_pontos_total
       FROM usuarios
       WHERE us_id = $1
       LIMIT 1`,
      [usuarioId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Usuario nao encontrado." });
    }

    return res.json({
      sucesso: true,
      perfil: result.rows[0]
    });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return res.status(500).json({ erro: "Erro ao buscar perfil" });
  }
});

module.exports = router;
