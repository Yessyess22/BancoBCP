const pool = require('../config/db');

const getAll = async () => {
  const result = await pool.query(`
    SELECT t.*, c.nombre, c.apellido, c.dni
    FROM tarjetas t
    JOIN clientes c ON t.cliente_id = c.id
    ORDER BY t.created_at DESC
  `);
  return result.rows;
};

const getById = async (id) => {
  const result = await pool.query('SELECT * FROM tarjetas WHERE id = $1', [id]);
  return result.rows[0];
};

const create = async (data) => {
  const { cliente_id, cuenta_id, tipo } = data;
  const numero_tarjeta = '4' + Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0');
  const fecha_vencimiento = new Date();
  fecha_vencimiento.setFullYear(fecha_vencimiento.getFullYear() + 5);

  const result = await pool.query(
    `INSERT INTO tarjetas (cliente_id, cuenta_id, numero_tarjeta, tipo, fecha_vencimiento, estado)
     VALUES ($1, $2, $3, $4, $5, 'activa') RETURNING *`,
    [cliente_id, cuenta_id || null, numero_tarjeta, tipo, fecha_vencimiento.toISOString().split('T')[0]]
  );
  return result.rows[0];
};

const updateEstado = async (id, estado) => {
  const result = await pool.query(
    `UPDATE tarjetas SET estado = $1 WHERE id = $2 RETURNING *`,
    [estado, id]
  );
  return result.rows[0];
};

module.exports = { getAll, getById, create, updateEstado };
