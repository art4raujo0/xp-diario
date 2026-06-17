const jwt = require("jsonwebtoken");

function autenticar(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [tipo, token] = authHeader.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Token de autenticacao nao informado." });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "chave_super_secreta_padrao"
    );

    req.usuario = {
      id: Number(payload.id),
      email: payload.email,
      tipo: payload.tipo || 'aluno'
    };

    if (!Number.isInteger(req.usuario.id) || req.usuario.id <= 0) {
      return res.status(401).json({ erro: "Token invalido." });
    }

    return next();
  } catch (error) {
    return res.status(401).json({ erro: "Token invalido ou expirado." });
  }
}

module.exports = {
  autenticar
};
