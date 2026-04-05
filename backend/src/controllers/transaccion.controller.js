const service = require('../services/transaccion.service');

const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll();
    res.json({ success: true, data, message: 'OK' });
  } catch (err) {
    next(err);
  }
};

const deposito = async (req, res, next) => {
  try {
    const data = await service.depositar(req.body);
    res.status(201).json({ success: true, data, message: 'Depósito realizado' });
  } catch (err) {
    next(err);
  }
};

const retiro = async (req, res, next) => {
  try {
    const data = await service.retirar(req.body);
    res.status(201).json({ success: true, data, message: 'Retiro realizado' });
  } catch (err) {
    next(err);
  }
};

const transferencia = async (req, res, next) => {
  try {
    const data = await service.transferir(req.body);
    res.status(201).json({ success: true, data, message: 'Transferencia realizada' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, deposito, retiro, transferencia };
