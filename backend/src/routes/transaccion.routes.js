const router = require('express').Router();
const ctrl = require('../controllers/transaccion.controller');
const { hasPermission } = require('../middlewares/role.middleware');
const { depositoSchema, retiroSchema, transferenciaSchema } = require('../validators/transaccion.validator');

router.get('/', ctrl.getAll);
router.post('/deposito', hasPermission('OP_OPERAR_TRANSACCION'), depositoSchema, ctrl.deposito);
router.post('/retiro', hasPermission('OP_OPERAR_TRANSACCION'), retiroSchema, ctrl.retiro);
router.post('/transferencia', hasPermission('OP_OPERAR_TRANSACCION'), transferenciaSchema, ctrl.transferencia);

module.exports = router;
