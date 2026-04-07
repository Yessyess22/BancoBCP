const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  post: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'alex',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'BancoBCP',
});

const migrate = async () => {
  try {
    console.log('Connecting to database...');
    
    // Create tipos_cambio table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tipos_cambio (
        id SERIAL PRIMARY KEY,
        moneda_origen_id INTEGER REFERENCES monedas(id),
        moneda_destino_id INTEGER REFERENCES monedas(id),
        tasa_conversion DECIMAL(15,6) NOT NULL,
        fecha_vigencia TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Table tipos_cambio ensured.');

    // Insert Boliviano currency
    await pool.query(`
      INSERT INTO monedas (codigo, nombre, simbolo) 
      VALUES ('BOB', 'Boliviano', 'Bs.') 
      ON CONFLICT (codigo) DO NOTHING;
    `);
    console.log('Currency BOB ensured.');

    console.log('Migration successful.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    pool.end();
  }
};

migrate();
