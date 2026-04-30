require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importando as rotas (A sua e a do seu amigo)
const materiasRoutes = require('./src/routes/materias');
const metasRoutes = require('./src/routes/metas');
const loginRoutes = require('./src/routes/login');

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


app.get('/metas', (req, res) => {
  res.sendFile(path.join(publicPath, 'metas.html'));
});


app.use('/api/metas', metasRoutes);
app.use('/api/materias', materiasRoutes);


// Organizando o trânsito (Quem chama o quê)
app.use('/materias', materiasRoutes);
app.use('/api/login', loginRoutes); // Apontando para o seu novo arquivo

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
