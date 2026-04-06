const pool = require('../config/db');

const getDashboardStats = async () => {
  const stats = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM clientes WHERE activo = TRUE)::int                       AS total_clientes,
      (SELECT COALESCE(SUM(saldo), 0) FROM cuentas WHERE activa = TRUE)              AS saldo_total,
      (SELECT COUNT(*) FROM transacciones)::int                                      AS total_transacciones,
      (SELECT COUNT(*) FROM creditos WHERE estado = 'aprobado')::int                 AS creditos_activos,
      (SELECT COALESCE(SUM(monto_aprobado), 0) FROM creditos WHERE estado = 'aprobado') AS cartera_creditos
  `);
  return stats.rows[0];
};

const getRecentTransactions = async (limit = 10) => {
  const { rows } = await pool.query(`
    SELECT 
      t.id, t.tipo, t.monto, t.descripcion, t.created_at,
      co.numero_cuenta AS origen,
      cd.numero_cuenta AS destino
    FROM transacciones t
    LEFT JOIN cuentas co ON t.cuenta_origen_id  = co.id
    LEFT JOIN cuentas cd ON t.cuenta_destino_id = cd.id
    ORDER BY t.created_at DESC
    LIMIT $1
  `, [limit]);
  return rows;
};

const getConsolidatedData = async () => {
  const cuentas = await pool.query(`
    SELECT 
      c.id, c.numero_cuenta, c.saldo, c.activa, c.created_at,
      cl.nombre, cl.apellido, cl.dni,
      tc.descripcion AS tipo,
      m.codigo AS moneda
    FROM cuentas c 
    JOIN clientes cl ON c.cliente_id = cl.id
    LEFT JOIN tipos_cuenta tc ON c.tipo_cuenta_id = tc.id
    LEFT JOIN monedas m ON c.moneda_id = m.id
    ORDER BY c.created_at DESC
  `);

  const transacciones = await pool.query(`
    SELECT 
      t.id, t.tipo, t.monto, t.descripcion, t.created_at,
      co.numero_cuenta AS origen,
      cd.numero_cuenta AS destino
    FROM transacciones t
    LEFT JOIN cuentas co ON t.cuenta_origen_id  = co.id
    LEFT JOIN cuentas cd ON t.cuenta_destino_id = cd.id
    ORDER BY t.created_at DESC
  `);

  const creditos = await pool.query(`
    SELECT 
      cr.id, cr.monto_solicitado, cr.monto_aprobado, cr.tasa_interes,
      cr.plazo_meses, cr.estado, cr.fecha_aprobacion, cr.created_at,
      cl.nombre, cl.apellido, cl.dni
    FROM creditos cr 
    JOIN clientes cl ON cr.cliente_id = cl.id
    ORDER BY cr.created_at DESC
  `);

  return {
    cuentas:       cuentas.rows,
    transacciones: transacciones.rows,
    creditos:      creditos.rows,
  };
};

module.exports = { getDashboardStats, getRecentTransactions, getConsolidatedData };
