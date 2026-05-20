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


const app = express();
const publicPath = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(publicPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
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



app.use('/api/metas', metasRoutes);
app.use('/api/materias', materiasRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/cadastro', cadastroRoutes);
app.use('/api/atividades', atividadesRoutes);
app.use('/api/progresso', progressoRoutes);
app.use("/api/streak", streakRoutes); 
app.use("/api/conquistas", conquistasRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
