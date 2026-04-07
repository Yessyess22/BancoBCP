const pool = require('../config/db');

const getAll = async () => {
  const result = await pool.query(`
    SELECT r.*, c.nombre, c.apellido, c.dni
    FROM reclamos r
    JOIN clientes c ON r.cliente_id = c.id
    ORDER BY r.created_at DESC
  `);
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query('SELECT * FROM reclamos WHERE id = $1', [id]);
  return result.rows[0];
};

const create = async (data) => {
  const { cliente_id, cuenta_id, titulo, descripcion } = data;
  const result = await pool.query(
    `INSERT INTO reclamos (cliente_id, cuenta_id, titulo, descripcion, estado)
     VALUES ($1, $2, $3, $4, 'abierto') RETURNING *`,
    [cliente_id, cuenta_id || null, titulo, descripcion]
  );
  return result.rows[0];
};

const update = async (id, data, usuario_id) => {
  const { estado, resolucion } = data;
  let query = 'UPDATE reclamos SET updated_at = NOW()';
  const params = [];
  let paramCount = 1;

  if (estado) {
    query += `, estado = $${paramCount++}`;
    params.push(estado);
  }
  if (resolucion !== undefined) {
    query += `, resolucion = $${paramCount++}`;
    params.push(resolucion);
  }
  if (usuario_id) {
    query += `, atendido_por = $${paramCount++}`;
    params.push(usuario_id);
  }

  // Si se cerró, marcar fecha_cierre
  if (estado === 'cerrado' || estado === 'resuelto') {
    query += `, fecha_cierre = NOW()`;
  }

  query += ` WHERE id = $${paramCount} RETURNING *`;
  params.push(id);

  const result = await pool.query(query, params);
  return result.rows[0];
};

module.exports = { getAll, getById, create, update };
