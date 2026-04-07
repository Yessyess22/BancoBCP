const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const login = async (username, password) => {
  const result = await pool.query('SELECT * FROM usuarios WHERE username = $1 AND activo = TRUE', [username]);
  if (result.rows.length === 0) {
    throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
  }
  
  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
  }

  const token = jwt.sign(
    { id: user.id, rol: user.rol },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '8h' }
  );

  return { token, user: { id: user.id, username: user.username, nombre: user.nombre, email: user.email, rol: user.rol } };
};

module.exports = { login };
