const pool = require('../config/db');

const findAll = async () => {
  const { rows } = await pool.query(`
    SELECT t.*,
      co.numero_cuenta AS cuenta_origen,
      cd.numero_cuenta AS cuenta_destino
    FROM transacciones t
    LEFT JOIN cuentas co ON t.cuenta_origen_id = co.id
    LEFT JOIN cuentas cd ON t.cuenta_destino_id = cd.id
    ORDER BY t.created_at DESC LIMIT 100
  `);
  return rows;
};

const getSaldoById = async (client, id) => {
  const { rows } = await client.query('SELECT saldo FROM cuentas WHERE id = $1', [id]);
  return rows[0] || null;
};

const actualizarSaldo = async (client, id, delta) => {
  await client.query('UPDATE cuentas SET saldo = saldo + $1 WHERE id = $2', [delta, id]);
};

const insertarTransaccion = async (client, { cuenta_origen_id, cuenta_destino_id, tipo, monto, descripcion }) => {
  const { rows } = await client.query(
    `INSERT INTO transacciones (cuenta_origen_id, cuenta_destino_id, tipo, monto, descripcion, estado)
     VALUES ($1, $2, $3, $4, $5, 'completado') RETURNING *`,
    [cuenta_origen_id || null, cuenta_destino_id || null, tipo, monto, descripcion]
  );
  return rows[0];
};

module.exports = { findAll, getSaldoById, actualizarSaldo, insertarTransaccion };
