const service = require('../services/auth.service');

const login = async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const data = await service.login(username, password);
    res.json({ success: true, ...data });
  } catch (err) {
    if (err.status === 401) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
    next(err);
  }
};

module.exports = { login };
