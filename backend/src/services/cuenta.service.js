const pool = require('../config/db');

const getAll = async () => {
  const result = await pool.query(`
    SELECT c.*, cl.nombre, cl.apellido, cl.dni,
           tc.descripcion AS tipo_descripcion,
           m.codigo AS moneda_codigo,
           m.simbolo
    FROM cuentas c
    JOIN clientes cl ON c.cliente_id = cl.id
    LEFT JOIN tipos_cuenta tc ON c.tipo_cuenta_id = tc.id
    LEFT JOIN monedas m ON c.moneda_id = m.id
    ORDER BY c.created_at DESC
  `);
  return result.rows;
};

const create = async (data) => {
  const { cliente_id, tipo_cuenta_id, saldo_inicial, moneda_id } = data;
  const numero_cuenta = 'BCP-' + Date.now() + Math.floor(Math.random() * 1000);
  
  const result = await pool.query(
    `INSERT INTO cuentas (numero_cuenta, cliente_id, tipo_cuenta_id, saldo, moneda_id, activa)
     VALUES ($1,$2,$3,$4,$5, TRUE) RETURNING *`,
    [numero_cuenta, cliente_id, tipo_cuenta_id, saldo_inicial || 0, moneda_id]
  );
  return result.rows[0];
};

const updateEstado = async (id, activa) => {
  const result = await pool.query(
    `UPDATE cuentas SET activa = $1 WHERE id = $2 RETURNING *`,
    [activa, id]
  );
  return result.rows[0];
};

module.exports = { getAll, create, updateEstado };
