const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/transacciones
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, 
        co.numero_cuenta AS cuenta_origen,
        cd.numero_cuenta AS cuenta_destino
      FROM transacciones t
      LEFT JOIN cuentas co ON t.cuenta_origen_id = co.id
      LEFT JOIN cuentas cd ON t.cuenta_destino_id = cd.id
      ORDER BY t.created_at DESC LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transacciones/deposito
router.post('/deposito', async (req, res) => {
  const { cuenta_destino_id, monto, descripcion } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE cuentas SET saldo = saldo + $1 WHERE id = $2', [monto, cuenta_destino_id]);
    const result = await client.query(
      `INSERT INTO transacciones (cuenta_destino_id, tipo, monto, descripcion)
       VALUES ($1,'deposito',$2,$3) RETURNING *`,
      [cuenta_destino_id, monto, descripcion]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// POST /api/transacciones/retiro
router.post('/retiro', async (req, res) => {
  const { cuenta_origen_id, monto, descripcion } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const check = await client.query('SELECT saldo FROM cuentas WHERE id = $1', [cuenta_origen_id]);
    if (check.rows[0].saldo < monto) {
      throw new Error('Saldo insuficiente');
    }
    await client.query('UPDATE cuentas SET saldo = saldo - $1 WHERE id = $2', [monto, cuenta_origen_id]);
    const result = await client.query(
      `INSERT INTO transacciones (cuenta_origen_id, tipo, monto, descripcion)
       VALUES ($1,'retiro',$2,$3) RETURNING *`,
      [cuenta_origen_id, monto, descripcion]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// POST /api/transacciones/transferencia
router.post('/transferencia', async (req, res) => {
  const { cuenta_origen_id, cuenta_destino_id, monto, descripcion } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const check = await client.query('SELECT saldo FROM cuentas WHERE id = $1', [cuenta_origen_id]);
    if (check.rows[0].saldo < monto) throw new Error('Saldo insuficiente');
    await client.query('UPDATE cuentas SET saldo = saldo - $1 WHERE id = $2', [monto, cuenta_origen_id]);
    await client.query('UPDATE cuentas SET saldo = saldo + $1 WHERE id = $2', [monto, cuenta_destino_id]);
    const result = await client.query(
      `INSERT INTO transacciones (cuenta_origen_id, cuenta_destino_id, tipo, monto, descripcion)
       VALUES ($1,$2,'transferencia',$3,$4) RETURNING *`,
      [cuenta_origen_id, cuenta_destino_id, monto, descripcion]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
