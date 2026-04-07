const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tarjeta.controller');
const { createTarjetaSchema, updateEstadoTarjetaSchema } = require('../validators/tarjeta.validator');
const { authorizeRoles } = require('../middlewares/role.middleware');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorizeRoles('admin', 'empleado'), createTarjetaSchema, ctrl.create);
router.put('/:id/estado', authorizeRoles('admin', 'empleado'), updateEstadoTarjetaSchema, ctrl.updateEstado);

module.exports = router;
