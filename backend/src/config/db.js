const { Pool } = require('pg')

const DATABASE_URL_FALLBACK = 'postgresql://neondb_owner:npg_HR6oE3xeMmrS@ep-autumn-silence-ac2y8oqt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool ({
    connectionString: process.env.DATABASE_URL || DATABASE_URL_FALLBACK,
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
