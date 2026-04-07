const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');

const depositoSchema = [
  body('cuenta_destino_id').notEmpty().withMessage('Cuenta destino es obligatoria').isInt(),
  body('monto').isFloat({ gt: 0 }).withMessage('El monto debe ser un número positivo'),
  body('descripcion').optional({ nullable: true, checkFalsy: true }).isLength({ max: 200 }),
  validate
];

const retiroSchema = [
  body('cuenta_origen_id').notEmpty().withMessage('Cuenta origen es obligatoria').isInt(),
  body('monto').isFloat({ gt: 0 }).withMessage('El monto debe ser un número positivo'),
  body('descripcion').optional({ nullable: true, checkFalsy: true }).isLength({ max: 200 }),
  validate
];

const transferenciaSchema = [
  body('cuenta_origen_id').notEmpty().withMessage('Cuenta origen es obligatoria').isInt(),
  body('cuenta_destino_id').notEmpty().withMessage('Cuenta destino es obligatoria').isInt(),
  body('monto').isFloat({ gt: 0 }).withMessage('El monto debe ser un número positivo'),
  body('descripcion').optional({ nullable: true, checkFalsy: true }).isLength({ max: 200 }),
  validate
];

module.exports = { depositoSchema, retiroSchema, transferenciaSchema };
