const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, data: null, message: 'Token requerido' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    next();
  } catch {
    res.status(401).json({ success: false, data: null, message: 'Token inválido o expirado' });
  }
};

/**
 * verifyRole(...allowedRoles)
 * Verifica que req.user tenga al menos uno de los roles permitidos.
 * Compara contra req.user.rol (columna directa) y req.user.roles (array de usuario_roles).
 *
 * Uso: verifyRole('admin', 'gerente')
 */
const verifyRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, data: null, message: 'No autenticado' });
  }

  const userRol = req.user.rol;
  const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [];

  const hasRole =
    allowedRoles.includes(userRol) ||
    userRoles.some((r) => allowedRoles.includes(r));

  if (!hasRole) {
    return res.status(403).json({
      success: false,
      data: null,
      message: `Acceso denegado. Roles requeridos: ${allowedRoles.join(', ')}`,
    });
  }

  next();
};

module.exports = { verifyToken, verifyRole };
