const router = require('express').Router();
const { verifyToken } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/transaccion.controller');

router.get('/',               verifyToken, ctrl.getAll);
router.post('/deposito',      verifyToken, ctrl.deposito);
router.post('/retiro',        verifyToken, ctrl.retiro);
router.post('/transferencia', verifyToken, ctrl.transferencia);

module.exports = router;
