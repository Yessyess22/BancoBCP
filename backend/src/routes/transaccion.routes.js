const router = require('express').Router();
const ctrl = require('../controllers/transaccion.controller');
const { hasPermission } = require('../middlewares/role.middleware');

router.get('/', ctrl.getAll);
router.post('/deposito', hasPermission('OP_OPERAR_TRANSACCION'), ctrl.deposito);
router.post('/retiro', hasPermission('OP_OPERAR_TRANSACCION'), ctrl.retiro);
router.post('/transferencia', hasPermission('OP_OPERAR_TRANSACCION'), ctrl.transferencia);

module.exports = router;
