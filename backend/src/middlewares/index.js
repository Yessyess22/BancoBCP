const { verifyToken, verifyRole } = require('./auth.middleware');
const { errorHandler } = require('./error.middleware');

module.exports = { verifyToken, verifyRole, errorHandler };
