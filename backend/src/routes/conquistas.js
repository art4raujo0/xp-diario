const express = require("express");
const { autenticar } = require("../middlewares/auth");
const {
  desbloquearConquistasElegiveis,
  listarConquistasComStatus
} = require("../services/conquistasService");

const router = express.Router();

router.get("/", autenticar, async (req, res) => {
  try {
    await desbloquearConquistasElegiveis(req.usuario.id);
    const conquistas = await listarConquistasComStatus(req.usuario.id);

    res.json({
      sucesso: true,
      total: conquistas.length,
      conquistas
    });
  } catch (error) {
    console.error("Erro ao listar conquistas:", error);
    res.status(500).json({ erro: "Erro ao listar conquistas" });
  }
});

module.exports = router;
