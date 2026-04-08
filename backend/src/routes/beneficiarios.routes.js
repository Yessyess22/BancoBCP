const express = require('express');
const router = express.Router();
const controller = require('../controllers/beneficiarios.controller');
const { createBeneficiarioSchema } = require('../validators/beneficiario.validator');

router.get('/entidades', controller.listarEntidades);
router.get('/', controller.listarBeneficiarios);
router.post('/', createBeneficiarioSchema, controller.agregarBeneficiario);
router.delete('/:id', controller.eliminarBeneficiario);

module.exports = router;
