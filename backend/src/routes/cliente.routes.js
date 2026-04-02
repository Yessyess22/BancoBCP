const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/clientes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes WHERE activo = TRUE ORDER BY created_at DESC');
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
router.post('/', async (req, res) => {
  const { dni, nombre, apellido, email, telefono, direccion, fecha_nacimiento } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO clientes (dni, nombre, apellido, email, telefono, direccion, fecha_nacimiento)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [dni, nombre, apellido, email, telefono, direccion, fecha_nacimiento]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/clientes/:id
router.put('/:id', async (req, res) => {
  const { nombre, apellido, email, telefono, direccion } = req.body;
  try {
    const result = await pool.query(
      `UPDATE clientes SET nombre=$1, apellido=$2, email=$3, telefono=$4, direccion=$5
       WHERE id=$6 RETURNING *`,
      [nombre, apellido, email, telefono, direccion, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/clientes/:id (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE clientes SET activo = FALSE WHERE id = $1', [req.params.id]);
    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
