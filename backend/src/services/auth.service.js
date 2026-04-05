const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const repo = require('../repositories/auth.repository');

const login = async (username, password, ip) => {
  const user = await repo.findByUsername(username);

  if (!user) {
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    await pool.query(
      `INSERT INTO auditoria (usuario_id, accion, ip, nivel)
       VALUES ($1, 'LOGIN_FALLIDO', $2::inet, 'warn')`,
      [user.id, ip || null]
    );
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }

  const payload = {
    id: user.id,
    username: user.username,
    rol: user.rol,
    roles: user.roles,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  await pool.query(
    `INSERT INTO auditoria (usuario_id, accion, ip, nivel)
     VALUES ($1, 'LOGIN_EXITOSO', $2::inet, 'info')`,
    [user.id, ip || null]
  );

  const { password: _pw, ...userData } = user;
  return { token, user: userData };
};

module.exports = { login };
