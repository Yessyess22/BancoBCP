const service = require('../services/credito.service');

const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll();
    res.json({ success: true, data, message: 'OK' });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id);
    const cuotas = await service.getCuotas(req.params.id);
    res.json({ success: true, data: { ...data, cuotas }, message: 'OK' });
  } catch (err) {
    next(err);
  }
};

const solicitar = async (req, res, next) => {
  try {
    const data = await service.solicitar(req.body);
    res.status(201).json({ success: true, data, message: 'Solicitud enviada' });
  } catch (err) {
    next(err);
  }
};

const revisar = async (req, res, next) => {
  try {
    const data = await service.procesarRevision(req.params.id, {
      ...req.body,
      usuario_aprueba: req.user.id
    });
    res.json({ success: true, data, message: `Estado actualizado a ${req.body.estado}` });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, solicitar, revisar };
