const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/parametros/ubicaciones
router.get('/ubicaciones', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ubicacion WHERE activo = TRUE ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/parametros/tipos-cuenta
router.get('/tipos-cuenta', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tipos_cuenta WHERE activo = TRUE');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/parametros/monedas
router.get('/monedas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM monedas WHERE activo = TRUE');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
