const pool = require('../config/db');

const WITH_ROLES = `
  SELECT u.id, u.username, u.nombre, u.email, u.rol, u.activo, u.created_at, u.updated_at,
    COALESCE(json_agg(r.nombre) FILTER (WHERE r.nombre IS NOT NULL), '[]') AS roles
  FROM usuarios u
  LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
  LEFT JOIN roles r ON r.id = ur.rol_id
`;

const findAll = async () => {
  const { rows } = await pool.query(
    `${WITH_ROLES} WHERE u.activo = TRUE GROUP BY u.id ORDER BY u.created_at DESC`
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `${WITH_ROLES} WHERE u.id = $1 GROUP BY u.id`,
    [id]
  );
  return rows[0] || null;
};

const findByUsernameOrEmail = async (username, email) => {
  const { rows } = await pool.query(
    `SELECT id FROM usuarios WHERE username = $1 OR email = $2`,
    [username, email]
  );
  return rows[0] || null;
};

const create = async ({ username, nombre, email, password, rol }) => {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (username, nombre, email, password, rol)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, username, nombre, email, rol, activo, created_at`,
    [username, nombre, email, password, rol || 'empleado']
  );
  return rows[0];
};

const update = async (id, { nombre, email, rol }) => {
  const { rows } = await pool.query(
    `UPDATE usuarios
     SET nombre=$1, email=$2, rol=$3, updated_at=NOW()
     WHERE id=$4 AND activo=TRUE
     RETURNING id, username, nombre, email, rol, activo, updated_at`,
    [nombre, email, rol, id]
  );
  return rows[0] || null;
};

const deactivate = async (id) => {
  const { rows } = await pool.query(
    `UPDATE usuarios SET activo=FALSE, updated_at=NOW()
     WHERE id=$1 AND activo=TRUE RETURNING id`,
    [id]
  );
  return rows[0] || null;
};

const assignRole = async (usuario_id, rol_id) => {
  await pool.query(
    `INSERT INTO usuario_roles (usuario_id, rol_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [usuario_id, rol_id]
  );
};

const removeRole = async (usuario_id, rol_id) => {
  await pool.query(
    `DELETE FROM usuario_roles WHERE usuario_id=$1 AND rol_id=$2`,
    [usuario_id, rol_id]
  );
};

module.exports = {
  findAll,
  findById,
  findByUsernameOrEmail,
  create,
  update,
  deactivate,
  assignRole,
  removeRole,
};
