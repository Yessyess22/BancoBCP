const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');

const createUsuarioSchema = [
  body('username')
    .notEmpty().withMessage('Username es obligatorio')
    .isLength({ min: 3, max: 50 }).withMessage('Username debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username solo puede contener letras, números y guion bajo'),
  body('nombre')
    .notEmpty().withMessage('Nombre es obligatorio')
    .isLength({ max: 100 }).withMessage('Nombre no puede superar 100 caracteres'),
  body('email')
    .notEmpty().withMessage('Email es obligatorio')
    .isEmail().withMessage('Email inválido'),
  body('password')
    .notEmpty().withMessage('Contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
  body('rol')
    .optional()
    .isIn(['admin', 'empleado']).withMessage('Rol debe ser admin o empleado'),
  validate
];

const updateUsuarioSchema = [
  body('nombre')
    .notEmpty().withMessage('Nombre es obligatorio')
    .isLength({ max: 100 }),
  body('email')
    .notEmpty().withMessage('Email es obligatorio')
    .isEmail().withMessage('Email inválido'),
  body('rol')
    .isIn(['admin', 'empleado']).withMessage('Rol debe ser admin o empleado'),
  body('activo')
    .isBoolean().withMessage('Activo debe ser true o false'),
  body('password')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres'),
  validate
];

module.exports = { createUsuarioSchema, updateUsuarioSchema };
