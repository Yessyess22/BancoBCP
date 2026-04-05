const service = require('../services/auth.service');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      const err = new Error('username y password son requeridos');
      err.status = 400;
      throw err;
    }

    const data = await service.login(username, password, req.ip);
    res.json({ success: true, data, message: 'Login exitoso' });
  } catch (err) {
    next(err);
  }
};

module.exports = { login };
