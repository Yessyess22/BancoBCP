const express = require('express');
const router = express.Router();
const controller = require('../controllers/beneficiarios.controller');

router.post('/', controller.agregarBeneficiario);
router.get('/', controller.listarBeneficiarios);
router.get('/entidades', controller.listarEntidades);

module.exports = router;
