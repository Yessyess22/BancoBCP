const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');

const createBeneficiarioSchema = [
  body('cliente_id').notEmpty().isInt().withMessage('ID de cliente inválido'),
  body('entidad_id').notEmpty().isInt().withMessage('ID de entidad inválida'),
  body('alias_contacto')
    .notEmpty().withMessage('Alias/nombre de contacto es obligatorio')
    .isLength({ max: 50 }).withMessage('Alias no puede superar 50 caracteres'),
  body('numero_cuenta')
    .notEmpty().withMessage('Número de cuenta es obligatorio')
    .isNumeric().withMessage('Número de cuenta debe ser numérico')
    .isLength({ max: 20 }).withMessage('Número de cuenta demasiado largo'),
  validate
];

module.exports = { createBeneficiarioSchema };
