const pool = require('../config/db');

const agregarBeneficiario = async (req, res) => {
  try {
    const { cliente_id, entidad_id, alias_contacto, numero_cuenta } = req.body;
    if (!cliente_id || !alias_contacto || !numero_cuenta) {
      return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
    }
    const query = `
      INSERT INTO agenda_beneficiarios (cliente_id, entidad_id, alias_contacto, numero_cuenta)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await pool.query(query, [cliente_id, entidad_id, alias_contacto, numero_cuenta]);
    res.status(201).json({ success: true, message: 'Beneficiario guardado', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'La cuenta ya existe para este cliente' });
    }
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
};

const listarBeneficiarios = async (req, res) => {
  try {
    const { cliente_id } = req.query;
    if (!cliente_id) return res.status(400).json({ success: false, message: 'cliente_id es requerido' });
    
    const query = `
      SELECT b.id, b.alias_contacto, b.numero_cuenta, b.created_at, e.nombre as entidad_nombre, e.codigo_sie
      FROM agenda_beneficiarios b
      JOIN entidades_financieras e ON b.entidad_id = e.id
      WHERE b.cliente_id = $1
      ORDER BY b.created_at DESC;
    `;
    const result = await pool.query(query, [cliente_id]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
};

const listarEntidades = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM entidades_financieras WHERE activa = true');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al cargar entidades' });
  }
};

module.exports = { agregarBeneficiario, listarBeneficiarios, listarEntidades };
