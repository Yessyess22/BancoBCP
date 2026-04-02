const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'alex',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'BancoBCP',
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database BancoBCP');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

module.exports = pool;
