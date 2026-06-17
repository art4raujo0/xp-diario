function exigirAdmin(req, res, next) {
  if (req.usuario.tipo !== 'admin') {
    return res.status(403).json({ erro: 'Acesso restrito a administradores.' });
  }
  next();
}

function exigirProfessor(req, res, next) {
  if (!['admin', 'professor'].includes(req.usuario.tipo)) {
    return res.status(403).json({ erro: 'Acesso restrito a professores.' });
  }
  next();
}

module.exports = { exigirAdmin, exigirProfessor };
