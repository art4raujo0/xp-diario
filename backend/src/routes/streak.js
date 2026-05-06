const express = require("express");
const pool = require("../config/db");
const { calcularStreakAtual } = require("../services/streakService");

const router = express.Router();

// GET /streak
router.get("/", async (req, res) => {
  try {
    // Alteração realizada para funcionalidade STREAK
    // Removido filtro por usuario_id pois a tabela não possui essa coluna
    const result = await pool.query(
      "SELECT at_data FROM atividade ORDER BY at_data ASC"
    );
    // Fim da alteração

    const datas = result.rows.map(r => r.at_data);

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