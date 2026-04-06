const express = require('express');
const router = express.Router();
const controller = require('../controllers/reporte.controller');

// GET /api/reportes/dashboard
router.get('/dashboard', controller.getDashboard);

// GET /api/reportes/consolidado
router.get('/consolidado', controller.getConsolidado);

module.exports = router;
