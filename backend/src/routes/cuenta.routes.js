const express = require('express');
const router = express.Router();

const { hasPermission } = require('../middlewares/role.middleware');
const { createCuentaSchema, updateEstadoCuentaSchema } = require('../validators/cuenta.validator');
const ctrl = require('../controllers/cuenta.controller');

router.get('/', ctrl.getAll);
router.post('/', hasPermission('OP_APERTURA_CUENTA'), createCuentaSchema, ctrl.create);
router.patch('/:id/estado', updateEstadoCuentaSchema, ctrl.updateEstado);

module.exports = router;
