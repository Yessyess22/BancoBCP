const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');

const createTarjetaSchema = [
  body('cliente_id').notEmpty().withMessage('cliente_id es obligatorio').isInt(),
  body('cuenta_id').optional({ nullable: true }).isInt(),
  body('tipo').notEmpty().isIn(['debito', 'credito']).withMessage('Tipo debe ser debito o credito'),
  validate
];

const updateEstadoTarjetaSchema = [
  body('estado').notEmpty().isIn(['activa', 'bloqueada', 'cancelada']).withMessage('Estado inválido'),
  validate
];

module.exports = { createTarjetaSchema, updateEstadoTarjetaSchema };
