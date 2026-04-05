const pool = require('../config/db');

/**
 * Busca un usuario activo por username incluyendo sus roles de usuario_roles.
 * Devuelve también el campo password para verificación en el service.
 */
const findByUsername = async (username) => {
  const { rows } = await pool.query(
    `SELECT u.*,
       COALESCE(
         json_agg(r.nombre) FILTER (WHERE r.nombre IS NOT NULL),
         '[]'
       ) AS roles
     FROM usuarios u
     LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
     LEFT JOIN roles r ON r.id = ur.rol_id
     WHERE u.username = $1 AND u.activo = TRUE
     GROUP BY u.id`,
    [username]
  );
  return rows[0] || null;
};

module.exports = { findByUsername };
