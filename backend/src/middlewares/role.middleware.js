const pool = require('../config/db');

/**
 * Middleware para verificar si el rol del usuario tiene un permiso específico en la BD.
 * @param {string} permissionCode - El código del permiso (ej: 'OP_REGISTRAR_CLIENTE')
 */
const hasPermission = (permissionCode) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.rol) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      // Consulta para verificar si el rol del usuario tiene el permiso solicitado
      const result = await pool.query(`
        SELECT p.codigo 
        FROM rol_permisos rp
        JOIN roles r ON rp.rol_id = r.id
        JOIN permisos p ON rp.permiso_id = p.id
        WHERE r.nombre = $1 AND p.codigo = $2
      `, [req.user.rol, permissionCode]);

      // Si es ADMIN, le permitimos todo por defecto (opcional, según reglas de negocio)
      if (req.user.rol === 'admin' || result.rows.length > 0) {
        return next();
      }

      return res.status(403).json({ 
        success: false, 
        message: `No tiene el permiso necesario: ${permissionCode}` 
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Error de servidor en autorización' });
    }
  };
};

/**
 * Middleware clásico basado solo en el nombre del rol (para compatibilidad).
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tiene permisos para realizar esta acción' 
      });
    }
    next();
  };
};

module.exports = { authorizeRoles, hasPermission };
