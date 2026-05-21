const express = require("express");
const pool = require("../config/db");
const { calcularStreakAtual } = require("../services/streakService");
const { autenticar } = require("../middlewares/auth");

const router = express.Router();

router.get("/", autenticar, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const result = await pool.query(
      "SELECT at_data FROM atividade WHERE at_usuario_id = $1 ORDER BY at_data ASC",
      [usuarioId]
    );

    const datas = result.rows.map((r) => r.at_data);
    const streak = calcularStreakAtual(datas);

    res.json({
      streak,
      total_registros: datas.length,
      dias_registrados: datas
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao calcular streak" });
  }
});

module.exports = router;
