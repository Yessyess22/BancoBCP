const express = require('express');
const router = express.Router();

const { authorizeRoles } = require('../middlewares/role.middleware');
const { createUsuarioSchema, updateUsuarioSchema } = require('../validators/usuario.validator');
const ctrl = require('../controllers/usuario.controller');

// Solo admin puede gestionar usuarios
router.get('/', authorizeRoles('admin'), ctrl.getAll);
router.get('/:id', authorizeRoles('admin'), ctrl.getById);
router.post('/', authorizeRoles('admin'), createUsuarioSchema, ctrl.create);
router.put('/:id', authorizeRoles('admin'), updateUsuarioSchema, ctrl.update);
router.delete('/:id', authorizeRoles('admin'), ctrl.remove);

module.exports = router;
