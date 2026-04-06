const express = require('express');
const router = express.Router();
const controller = require('../controllers/credito.controller');
const { hasPermission } = require('../middlewares/role.middleware');

// GET /api/creditos
router.get('/', controller.getAll);

// GET /api/creditos/:id
router.get('/:id', controller.getById);

// POST /api/creditos/solicitar
router.post('/solicitar', controller.solicitar);

// PATCH /api/creditos/:id/revisar (Sustituimos authorizeRoles por hasPermission dinámico)
router.patch('/:id/revisar', hasPermission('OP_REVISAR_CREDITO'), controller.revisar);

module.exports = router;
