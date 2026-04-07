const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');

const createCuentaSchema = [
  body('cliente_id').notEmpty().withMessage('El ID de cliente es obligatorio').isInt().withMessage('Debe ser un entero'),
  body('tipo_cuenta_id').notEmpty().withMessage('El ID de tipo de cuenta es obligatorio').isInt().withMessage('Debe ser un entero'),
  body('moneda_id').notEmpty().withMessage('El ID de moneda es obligatorio').isInt().withMessage('Debe ser un entero'),
  body('saldo_inicial').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('El saldo inicial no puede ser negativo'),
  validate
];

const updateEstadoCuentaSchema = [
  body('activa').isBoolean().withMessage('El campo activa debe ser booleano'),
  validate
];

module.exports = { createCuentaSchema, updateEstadoCuentaSchema };
