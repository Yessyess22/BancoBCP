const pool = require('../config/db');

const findAll = async () => {
  const { rows } = await pool.query(`
    SELECT cr.*, cl.nombre, cl.apellido, cl.dni 
    FROM creditos cr
    JOIN clientes cl ON cr.cliente_id = cl.id
    ORDER BY cr.created_at DESC
  `);
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(`
    SELECT cr.*, cl.nombre, cl.apellido 
    FROM creditos cr
    JOIN clientes cl ON cr.cliente_id = cl.id
    WHERE cr.id = $1
  `, [id]);
  return rows[0];
};

const findCuotasByCreditoId = async (creditoId) => {
  const { rows } = await pool.query(
    'SELECT * FROM cuotas_credito WHERE credito_id = $1 ORDER BY numero_cuota',
    [creditoId]
  );
  return rows;
};

const createSolicitud = async (client, data) => {
  const { cliente_id, monto_solicitado, tasa_interes, plazo_meses } = data;
  const { rows } = await client.query(
    `INSERT INTO creditos (cliente_id, monto_solicitado, tasa_interes, plazo_meses, estado)
     VALUES ($1, $2, $3, $4, 'solicitado') RETURNING *`,
    [cliente_id, monto_solicitado, tasa_interes, plazo_meses]
  );
  return rows[0];
};

const updateEstado = async (client, id, { estado, monto_aprobado, usuario_aprueba }) => {
  const { rows } = await client.query(
    `UPDATE creditos SET 
      estado = $1, 
      monto_aprobado = $2, 
      usuario_aprueba = $3, 
      fecha_aprobacion = CASE WHEN $1 = 'aprobado' THEN CURRENT_DATE ELSE fecha_aprobacion END
     WHERE id = $4 RETURNING *`,
    [estado, monto_aprobado, usuario_aprueba, id]
  );
  return rows[0];
};

const insertCuotas = async (client, cuotas) => {
  for (const cuota of cuotas) {
    await client.query(
      `INSERT INTO cuotas_credito 
       (credito_id, numero_cuota, monto_cuota, monto_capital, monto_interes, fecha_vencimiento, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'pendiente')`,
      [cuota.credito_id, cuota.numero_cuota, cuota.monto_cuota, cuota.monto_capital, cuota.monto_interes, cuota.fecha_vencimiento]
    );
  }
};

module.exports = { 
  findAll, 
  findById, 
  findCuotasByCreditoId, 
  createSolicitud, 
  updateEstado, 
  insertCuotas 
};
