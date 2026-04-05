const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cliente.controller');
const { verifyToken, verifyRole } = require('../middlewares');

// GET /api/clientes - Cajero, Asesor, Gerente, Admin
router.get('/', verifyToken, verifyRole('admin', 'empleado', 'gerente'), ctrl.getAll);

// GET /api/clientes/:id
router.get('/:id', verifyToken, verifyRole('admin', 'empleado', 'gerente'), ctrl.getById);

// POST /api/clientes - Cajero+
router.post('/', verifyToken, verifyRole('admin', 'empleado', 'gerente'), ctrl.create);

// PUT /api/clientes/:id - Cajero+
router.put('/:id', verifyToken, verifyRole('admin', 'empleado', 'gerente'), ctrl.update);

// DELETE /api/clientes/:id (soft delete) - solo Gerente y Admin
router.delete('/:id', verifyToken, verifyRole('admin', 'gerente'), ctrl.deactivate);

module.exports = router;
