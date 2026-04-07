const service = require('../services/reclamo.service');

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
    if (!data) return res.status(404).json({ success: false, message: 'Reclamo no encontrado' });
    res.json({ success: true, data, message: 'OK' });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body);
    res.status(201).json({ success: true, data, message: 'Reclamo creado correctamente' });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body, req.user ? req.user.id : null);
    if (!data) return res.status(404).json({ success: false, message: 'Reclamo no encontrado' });
    res.json({ success: true, data, message: 'Reclamo actualizado' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update };
