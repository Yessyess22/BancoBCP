const service = require('../services/cliente.service');

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
    res.json({ success: true, data, message: 'OK' });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body, req.user.id);
    res.status(201).json({ success: true, data, message: 'Cliente registrado exitosamente' });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body, req.user.id);
    res.json({ success: true, data, message: 'Cliente actualizado exitosamente' });
  } catch (err) {
    next(err);
  }
};

const deactivate = async (req, res, next) => {
  try {
    await service.deactivate(req.params.id, req.user.id);
    res.json({ success: true, data: null, message: 'Cliente eliminado exitosamente' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, deactivate };
