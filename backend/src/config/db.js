const { Pool } = require('pg')

const pool = new Pool ({
    connectionString: process.env.DATABASE_URL,
    ssl:{
        rejectUnauthorized: false
    
    }
});
pool.connect()
  .then(client => {
    console.log('Conectado ao Neon/PostgreSQL com sucesso!');
    client.release();
  })
  .catch(err => {
    console.error('Erro ao conectar no banco:', err.message);
  });

module.exports = pool;
