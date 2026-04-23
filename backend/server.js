require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importando as rotas (A sua e a do seu amigo)
const materiasRoutes = require('./src/routes/materias');
const loginRoutes = require('./src/routes/login');

const app = express();

app.use(cors()); 
app.use(express.json());

// Organizando o trânsito (Quem chama o quê)
app.use('/materias', materiasRoutes);
app.use('/api/login', loginRoutes); // Apontando para o seu novo arquivo

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});