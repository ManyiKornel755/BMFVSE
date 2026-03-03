const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || 'WaveAlertDB',
  user: process.env.DB_USER || 'webuser',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT !== 'false',
    enableArithAbort: true,
    connectionTimeout: 15000,
    requestTimeout: 30000
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('SQL Server kapcsolodva');
    return pool;
  })
  .catch(err => {
    console.error('SQL Server kapcsolodasi hiba:', err.message);
    console.error('-> Ellenorizd az SQL Server beallitasokat a .env fajlban!');
    return Promise.reject(err);
  });

// Prevent unhandled rejection crash
poolPromise.catch(() => {});

async function testConnection() {
  try {
    const pool = await poolPromise;
    await pool.request().query('SELECT 1');
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = { sql, poolPromise, testConnection };
