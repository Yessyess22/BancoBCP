const express = require('express');
const router = express.Router();
const pool = require('../config/db');

const { hasPermission } = require('../middlewares/role.middleware');

// GET /api/cuentas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, cl.nombre, cl.apellido, cl.dni,
             tc.descripcion AS tipo_descripcion,
             m.codigo AS moneda_codigo
      FROM cuentas c
      JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN tipos_cuenta tc ON c.tipo_cuenta_id = tc.id
      LEFT JOIN monedas m ON c.moneda_id = m.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cuentas
router.post('/', hasPermission('OP_APERTURA_CUENTA'), async (req, res) => {
  const { cliente_id, tipo_cuenta_id, saldo_inicial, moneda_id } = req.body;
  const numero_cuenta = 'BCP-' + Date.now() + Math.floor(Math.random() * 1000);
  
  try {
    const result = await pool.query(
      `INSERT INTO cuentas (numero_cuenta, cliente_id, tipo_cuenta_id, saldo, moneda_id, activa)
       VALUES ($1,$2,$3,$4,$5, TRUE) RETURNING *`,
      [numero_cuenta, cliente_id, tipo_cuenta_id, saldo_inicial || 0, moneda_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/cuentas/:id/estado
router.patch('/:id/estado', async (req, res) => {
  const { activa } = req.body; // true: ACTIVA, false: SUSPENDIDA
  try {
    const result = await pool.query(
      `UPDATE cuentas SET activa = $1 WHERE id = $2 RETURNING *`,
      [activa, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cuenta no encontrada' });
    res.json({ message: `Cuenta ${activa ? 'activada' : 'suspendida'} exitosamente`, cuenta: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
