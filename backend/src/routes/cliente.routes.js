const express = require('express');
const router = express.Router();
const pool = require('../config/db');

const { authorizeRoles, hasPermission } = require('../middlewares/role.middleware');

// GET /api/clientes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.nombre AS ubicacion_nombre 
      FROM clientes c
      LEFT JOIN ubicacion u ON c.ubicacion_id = u.id
      WHERE c.activo = TRUE 
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clientes/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clientes
router.post('/', hasPermission('OP_REGISTRAR_CLIENTE'), async (req, res) => {
  const { dni, nombre, apellido, email, telefono, direccion, fecha_nacimiento, ubicacion_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO clientes (dni, nombre, apellido, email, telefono, direccion, fecha_nacimiento, ubicacion_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [dni, nombre, apellido, email, telefono, direccion, fecha_nacimiento || null, ubicacion_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/clientes/:id
router.put('/:id', async (req, res) => {
  const { nombre, apellido, email, telefono, direccion, fecha_nacimiento, ubicacion_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE clientes SET nombre=$1, apellido=$2, email=$3, telefono=$4, direccion=$5, fecha_nacimiento=$6, ubicacion_id=$7 WHERE id=$8 RETURNING *`,
      [nombre, apellido, email, telefono, direccion, fecha_nacimiento || null, ubicacion_id || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/clientes/:id (soft delete) - Admin Only
router.delete('/:id', authorizeRoles('admin'), async (req, res) => {
  try {
    await pool.query('UPDATE clientes SET activo = FALSE WHERE id = $1', [req.params.id]);
    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
