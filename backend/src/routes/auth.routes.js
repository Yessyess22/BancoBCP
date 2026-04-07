const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const { loginSchema } = require('../validators/auth.validator');

router.post('/login', loginSchema, ctrl.login);

module.exports = router;
