const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt for username: [${username}]`);
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE username = $1 AND activo = TRUE', [username]);
    console.log(`User found in DB: ${result.rows.length > 0 ? 'YES' : 'NO'}`);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, username: user.username, nombre: user.nombre, email: user.email, rol: user.rol } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
