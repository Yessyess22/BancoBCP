const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, data: null, message: 'Token requerido' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'secret';
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ success: false, data: null, message: 'Token inválido o expirado' });
  }
};

module.exports = { verifyToken };
