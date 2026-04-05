const pool = require('../config/db');

const findAll = async () => {
  const { rows } = await pool.query(
    `SELECT c.*, u.nombre AS ubicacion_nombre
     FROM clientes c
     LEFT JOIN ubicacion u ON u.id = c.ubicacion_id
     WHERE c.activo = TRUE
     ORDER BY c.created_at DESC`
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT c.*, u.nombre AS ubicacion_nombre
     FROM clientes c
     LEFT JOIN ubicacion u ON u.id = c.ubicacion_id
     WHERE c.id = $1`,
    [id]
  );
  return rows[0] || null;
};

const findByDni = async (dni) => {
  const { rows } = await pool.query(
    `SELECT id FROM clientes WHERE dni = $1`,
    [dni]
  );
  return rows[0] || null;
};

const findByEmail = async (email, excludeId = null) => {
  const { rows } = await pool.query(
    `SELECT id FROM clientes WHERE email = $1 AND ($2::int IS NULL OR id <> $2)`,
    [email, excludeId]
  );
  return rows[0] || null;
};

const create = async ({ dni, nombre, apellido, email, telefono, direccion, fecha_nacimiento, ubicacion_id }) => {
  const { rows } = await pool.query(
    `INSERT INTO clientes (dni, nombre, apellido, email, telefono, direccion, fecha_nacimiento, ubicacion_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [dni, nombre, apellido, email || null, telefono || null, direccion || null, fecha_nacimiento || null, ubicacion_id || null]
  );
  return rows[0];
};

const update = async (id, { nombre, apellido, email, telefono, direccion, ubicacion_id }) => {
  const { rows } = await pool.query(
    `UPDATE clientes
     SET nombre=$1, apellido=$2, email=$3, telefono=$4, direccion=$5, ubicacion_id=$6, updated_at=NOW()
     WHERE id=$7 AND activo=TRUE
     RETURNING *`,
    [nombre, apellido, email || null, telefono || null, direccion || null, ubicacion_id || null, id]
  );
  return rows[0] || null;
};

const deactivate = async (id) => {
  const { rows } = await pool.query(
    `UPDATE clientes SET activo=FALSE, updated_at=NOW()
     WHERE id=$1 AND activo=TRUE RETURNING id`,
    [id]
  );
  return rows[0] || null;
};

module.exports = { findAll, findById, findByDni, findByEmail, create, update, deactivate };
