const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');

const solicitarCreditoSchema = [
  body('cliente_id').notEmpty().isInt().withMessage('ID de cliente inválido'),
  body('monto_solicitado').isFloat({ min: 100 }).withMessage('Monto mínimo de solicitud es 100 Bs.'),
  body('tasa_interes').isFloat({ min: 0.01, max: 1 }).withMessage('Tasa de interés inválida'),
  body('plazo_meses').isInt({ min: 1 }).withMessage('Plazo inválido'),
  validate
];

const revisarCreditoSchema = [
  body('estado').isIn(['aprobado', 'rechazado']).withMessage('Estado inválido'),
  body('monto_aprobado').optional().isFloat({ min: 0 }).withMessage('Monto aprobado inválido'),
  validate
];

module.exports = { solicitarCreditoSchema, revisarCreditoSchema };
