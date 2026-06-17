require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const materiasRoutes = require('./src/routes/materias');
const metasRoutes = require('./src/routes/metas');
const loginRoutes = require('./src/routes/login');
const cadastroRoutes = require('./src/routes/cadastro');
const atividadesRoutes = require('./src/routes/atividades');
const progressoRoutes = require('./src/routes/progresso');
const streakRoutes = require("./src/routes/streak");
const conquistasRoutes = require("./src/routes/conquistas");
const perfilRoutes = require("./src/routes/perfil");
const notificacoesRoutes = require("./src/routes/notificacoes");
const cronogramasRoutes = require("./src/routes/cronogramas");
const tarefasRoutes = require("./src/routes/tarefas");
const relatorioRoutes = require("./src/routes/relatorio");
const turmasRoutes = require("./src/routes/turmas");
const adminRoutes = require("./src/routes/admin");
const { iniciarScheduler } = require("./src/services/notificacoesService");
const { executarMigracoes } = require("./src/config/migrar");


const app = express();
const publicPath = path.join(__dirname, '..', 'frontend');
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(publicPath));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(publicPath, 'login.html'));
});

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(publicPath, 'favicon.svg'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(publicPath, 'app.html'));
});

app.get('/metas', (req, res) => {
  res.sendFile(path.join(publicPath, 'metas.html'));
});

app.get('/materias', (req, res) => {
  res.sendFile(path.join(publicPath, 'materias.html'));
});

app.get('/cadastro', (req, res) => {
  res.sendFile(path.join(publicPath, 'cadastro.html'));
});

app.get('/estudos', (req, res) => {
  res.sendFile(path.join(publicPath, 'estudos.html'));
});

app.get('/cronogramas', (req, res) => {
  res.sendFile(path.join(publicPath, 'cronogramas.html'));
});

app.get('/tarefas', (req, res) => {
  res.sendFile(path.join(publicPath, 'tarefas.html'));
});

app.get('/conquistas', (req, res) => {
  res.sendFile(path.join(publicPath, 'conquistas.html'));
});

app.get('/perfil', (req, res) => {
  res.sendFile(path.join(publicPath, 'perfil.html'));
});

app.get('/relatorio', (req, res) => {
  res.sendFile(path.join(publicPath, 'relatorio.html'));
});

app.get('/turmas', (req, res) => {
  res.sendFile(path.join(publicPath, 'turmas.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicPath, 'admin.html'));
});



app.use('/api/metas', metasRoutes);
app.use('/api/materias', materiasRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/cadastro', cadastroRoutes);
app.use('/api/atividades', atividadesRoutes);
app.use('/api/progresso', progressoRoutes);
app.use("/api/streak", streakRoutes); 
app.use("/api/conquistas", conquistasRoutes);
app.use("/api/perfil", perfilRoutes);
app.use("/api/notificacoes", notificacoesRoutes);
app.use("/api/cronogramas", cronogramasRoutes);
app.use("/api/tarefas", tarefasRoutes);
app.use("/api/relatorio", relatorioRoutes);
app.use("/api/turmas", turmasRoutes);
app.use("/api/admin", adminRoutes);

executarMigracoes().then(() => iniciarScheduler());

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

