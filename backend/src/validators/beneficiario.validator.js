const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');

const createBeneficiarioSchema = [
  body('cliente_id').notEmpty().isInt().withMessage('ID de cliente inválido'),
  body('entidad_id').notEmpty().isInt().withMessage('ID de entidad inválida'),
  body('nombre')
    .notEmpty().withMessage('Nombre de contacto es obligatorio')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/).withMessage('Nombre solo puede contener letras y espacios'),
  body('cuenta')
    .notEmpty().withMessage('Número de cuenta es obligatorio')
    .isNumeric().withMessage('Número de cuenta debe ser numérico'),
  validate
];

module.exports = { createBeneficiarioSchema };
