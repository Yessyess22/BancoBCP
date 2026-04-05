const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usuario.controller');
const { verifyToken, verifyRole } = require('../middlewares');

// Solo administradores pueden gestionar usuarios
router.get('/',    verifyToken, verifyRole('admin'), ctrl.getAll);
router.get('/:id', verifyToken, verifyRole('admin'), ctrl.getById);
router.post('/',   verifyToken, verifyRole('admin'), ctrl.create);
router.put('/:id', verifyToken, verifyRole('admin'), ctrl.update);
router.delete('/:id', verifyToken, verifyRole('admin'), ctrl.deactivate);

// Gestión de roles
router.post('/:id/roles',   verifyToken, verifyRole('admin'), ctrl.assignRole);
router.delete('/:id/roles', verifyToken, verifyRole('admin'), ctrl.removeRole);

module.exports = router;
