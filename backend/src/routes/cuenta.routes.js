const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/cuentas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, cl.nombre, cl.apellido, cl.dni 
      FROM cuentas c
      JOIN clientes cl ON c.cliente_id = cl.id
      WHERE c.activa = TRUE
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cuentas/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, cl.nombre, cl.apellido FROM cuentas c
       JOIN clientes cl ON c.cliente_id = cl.id
       WHERE c.id = $1`, [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cuenta no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cuentas
router.post('/', async (req, res) => {
  const { cliente_id, tipo, saldo_inicial, moneda } = req.body;
  const numero_cuenta = 'BCP-' + Date.now() + Math.floor(Math.random() * 1000);
  try {
    const result = await pool.query(
      `INSERT INTO cuentas (numero_cuenta, cliente_id, tipo, saldo, moneda)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [numero_cuenta, cliente_id, tipo || 'ahorros', saldo_inicial || 0, moneda || 'PEN']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
