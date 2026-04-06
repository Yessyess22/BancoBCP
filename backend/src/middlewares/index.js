const { verifyToken } = require('./auth.middleware');
const { authorizeRoles } = require('./role.middleware');
const { errorHandler } = require('./error.middleware');

module.exports = { verifyToken, authorizeRoles, errorHandler };
