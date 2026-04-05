const { verifyToken } = require('./auth.middleware');
const { errorHandler } = require('./error.middleware');

module.exports = { verifyToken, errorHandler };
