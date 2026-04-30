require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importando as rotas (A sua e a do seu amigo)
const materiasRoutes = require('./src/routes/materias');
const metasRoutes = require('./src/routes/metas');
const loginRoutes = require('./src/routes/login');

const app = express();

app.use(cors()); 
app.use(express.json());
app.use(express.static('public'));


app.get('/', (req, res) => {
  res.redirect('/metas');
});


app.get('/metas', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'metas.html'));
});


app.use('/api/metas', metasRoutes);
app.use('/api/materias', materiasRoutes);


// Organizando o trânsito (Quem chama o quê)
app.use('/materias', materiasRoutes);
app.use('/api/login', loginRoutes); // Apontando para o seu novo arquivo

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});