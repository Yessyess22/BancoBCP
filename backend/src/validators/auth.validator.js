const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');

const loginSchema = [
  body('username').notEmpty().withMessage('Username es obligatorio').isString(),
  body('password').notEmpty().withMessage('Contraseña es obligatoria').isString(),
  validate
];

module.exports = { loginSchema };
