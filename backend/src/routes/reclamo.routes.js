const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reclamo.controller');
const { createReclamoSchema, updateReclamoSchema } = require('../validators/reclamo.validator');
const { authorizeRoles } = require('../middlewares/role.middleware');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', createReclamoSchema, ctrl.create);
router.put('/:id', authorizeRoles('admin', 'empleado'), updateReclamoSchema, ctrl.update);

module.exports = router;
