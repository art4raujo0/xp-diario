const express = require('express');
const path = require('path');

const materiasRoutes = require('./src/routes/materias');
const metasRoutes = require('./src/routes/metas');

const app = express();

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



app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
