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
  body('cuenta_destino_id')
    .optional({ nullable: true, checkFalsy: true })
    .isInt().withMessage('Cuenta destino debe ser un entero válido'),
  body('banco_nombre')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 100 }),
  body('cuenta_externa')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 30 }),
  body('monto').isFloat({ gt: 0 }).withMessage('El monto debe ser un número positivo'),
  body('descripcion').optional({ nullable: true, checkFalsy: true }).isLength({ max: 200 }),
  body().custom((_, { req }) => {
    if (!req.body.cuenta_destino_id && !req.body.cuenta_externa) {
      throw new Error('Debe indicar una cuenta destino interna o una cuenta externa (interbancaria)');
    }
    return true;
  }),
  validate
];

module.exports = { depositoSchema, retiroSchema, transferenciaSchema };
