const pool = require('../config/db');

const getAll = async () => {
  const result = await pool.query(`
    SELECT c.*, u.nombre AS ubicacion_nombre 
    FROM clientes c
    LEFT JOIN ubicacion u ON c.ubicacion_id = u.id
    WHERE c.activo = TRUE 
    ORDER BY c.created_at DESC
  `);
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
  return result.rows[0];
};

const create = async (data) => {
  const { dni, nombre, apellido, email, telefono, direccion, fecha_nacimiento, ubicacion_id } = data;
  const result = await pool.query(
    `INSERT INTO clientes (dni, nombre, apellido, email, telefono, direccion, fecha_nacimiento, ubicacion_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [dni, nombre, apellido, email || null, telefono || null, direccion || null, fecha_nacimiento || null, ubicacion_id || null]
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const { nombre, apellido, email, telefono, direccion, fecha_nacimiento, ubicacion_id } = data;
  const result = await pool.query(
    `UPDATE clientes SET nombre=$1, apellido=$2, email=$3, telefono=$4, direccion=$5, fecha_nacimiento=$6, ubicacion_id=$7 WHERE id=$8 RETURNING *`,
    [nombre, apellido, email || null, telefono || null, direccion || null, fecha_nacimiento || null, ubicacion_id || null, id]
  );
  return result.rows[0];
};

const remove = async (id) => {
  await pool.query('UPDATE clientes SET activo = FALSE WHERE id = $1', [id]);
};

module.exports = { getAll, getById, create, update, remove };
