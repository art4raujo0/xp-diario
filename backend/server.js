const express = require('express');
const materiasRoutes = require('./src/routes/materias');
const metasRoutes = require('./src/routes/metas');


const app = express();

app.use(express.json());

app.use('/materias', materiasRoutes);
app.use('/metas', metasRoutes);


app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
