const express = require('express');
const router = express.Router();
const controller = require('../controllers/beneficiarios.controller');
const { createBeneficiarioSchema } = require('../validators/beneficiario.validator');

router.post('/', createBeneficiarioSchema, controller.agregarBeneficiario);
router.get('/', controller.listarBeneficiarios);
router.get('/entidades', controller.listarEntidades);

module.exports = router;
