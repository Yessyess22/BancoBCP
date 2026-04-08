const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const getAll = async () => {
  const result = await pool.query(`
    SELECT id, username, nombre, email, rol, activo, created_at, updated_at
    FROM usuarios
    ORDER BY created_at DESC
  `);
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query(
    'SELECT id, username, nombre, email, rol, activo, created_at, updated_at FROM usuarios WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

const create = async (data) => {
  const { username, nombre, email, password, rol } = data;
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO usuarios (username, nombre, email, password, rol)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, username, nombre, email, rol, activo, created_at`,
    [username, nombre, email, hash, rol || 'empleado']
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const { nombre, email, rol, activo, password } = data;
  let result;
  if (password && password.trim() !== '') {
    const hash = await bcrypt.hash(password, 10);
    result = await pool.query(
      `UPDATE usuarios SET nombre=$1, email=$2, rol=$3, activo=$4, password=$5, updated_at=NOW()
       WHERE id=$6
       RETURNING id, username, nombre, email, rol, activo, updated_at`,
      [nombre, email, rol, activo, hash, id]
    );
  } else {
    result = await pool.query(
      `UPDATE usuarios SET nombre=$1, email=$2, rol=$3, activo=$4, updated_at=NOW()
       WHERE id=$5
       RETURNING id, username, nombre, email, rol, activo, updated_at`,
      [nombre, email, rol, activo, id]
    );
  }
  return result.rows[0];
};

const remove = async (id) => {
  await pool.query('UPDATE usuarios SET activo = FALSE, updated_at = NOW() WHERE id = $1', [id]);
};

module.exports = { getAll, getById, create, update, remove };
