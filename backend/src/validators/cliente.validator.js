const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');

const createClienteSchema = [
  body('dni')
    .notEmpty().withMessage('DNI es obligatorio')
    .isNumeric().withMessage('DNI debe ser solo números')
    .isLength({ min: 7, max: 20 }).withMessage('DNI debe tener entre 7 y 20 dígitos'),
  body('nombre')
    .notEmpty().withMessage('Nombre es obligatorio')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/).withMessage('Nombre solo puede contener letras y espacios')
    .isLength({ max: 100 }),
  body('apellido')
    .notEmpty().withMessage('Apellido es obligatorio')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/).withMessage('Apellido solo puede contener letras y espacios')
    .isLength({ max: 100 }),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage('Email inválido'),
  body('telefono')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('Teléfono debe contener solo números')
    .isLength({ min: 8, max: 15 }).withMessage('Teléfono inválido (8-15 dígitos)'),
  body('direccion').optional({ nullable: true, checkFalsy: true }),
  body('fecha_nacimiento')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().toDate().withMessage('Fecha inválida'),
  body('ubicacion_id').optional({ nullable: true, checkFalsy: true }).isInt().withMessage('ID de ubicación inválido'),
  validate
];

const updateClienteSchema = [
  body('nombre')
    .optional()
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/).withMessage('Nombre solo puede contener letras y espacios'),
  body('apellido')
    .optional()
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/).withMessage('Apellido solo puede contener letras y espacios'),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Email inválido'),
  body('telefono')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('Teléfono debe contener solo números'),
  body('fecha_nacimiento').optional({ nullable: true, checkFalsy: true }).isISO8601().toDate(),
  body('ubicacion_id').optional({ nullable: true, checkFalsy: true }).isInt(),
  validate
];

module.exports = { createClienteSchema, updateClienteSchema };
