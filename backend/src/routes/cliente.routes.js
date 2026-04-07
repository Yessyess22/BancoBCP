const express = require('express');
const router = express.Router();

const { authorizeRoles, hasPermission } = require('../middlewares/role.middleware');
const { createClienteSchema, updateClienteSchema } = require('../validators/cliente.validator');
const ctrl = require('../controllers/cliente.controller');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', hasPermission('OP_REGISTRAR_CLIENTE'), createClienteSchema, ctrl.create);
router.put('/:id', updateClienteSchema, ctrl.update);
router.delete('/:id', authorizeRoles('admin'), ctrl.remove);

module.exports = router;
