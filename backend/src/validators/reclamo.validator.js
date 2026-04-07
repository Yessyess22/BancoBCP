const { body } = require('express-validator');
const { validate } = require('../middlewares/validate.middleware');

const createReclamoSchema = [
  body('cliente_id').notEmpty().withMessage('cliente_id es obligatorio').isInt(),
  body('cuenta_id').optional({ nullable: true }).isInt(),
  body('titulo').notEmpty().withMessage('Título es obligatorio').isLength({ max: 200 }),
  body('descripcion').notEmpty().withMessage('Descripción es obligatoria').isString(),
  validate
];

const updateReclamoSchema = [
  body('estado').optional().notEmpty().isIn(['abierto', 'en_proceso', 'resuelto', 'cerrado']).withMessage('Estado inválido'),
  body('resolucion').optional().isString(),
  validate
];

module.exports = { createReclamoSchema, updateReclamoSchema };
