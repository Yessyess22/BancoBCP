const service = require('../services/tarjeta.service');

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
    if (!data) return res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });
    res.json({ success: true, data, message: 'OK' });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body);
    res.status(201).json({ success: true, data, message: 'Tarjeta emitida correctamente' });
  } catch (err) {
    if (err.code === '23505') {
       return res.status(409).json({ success: false, message: 'Conflicto: El número de tarjeta ya existe. Intente nuevamente.' });
    }
    next(err);
  }
};

const updateEstado = async (req, res, next) => {
  try {
    const data = await service.updateEstado(req.params.id, req.body.estado);
    if (!data) return res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });
    res.json({ success: true, data, message: `Tarjeta ha sido cambiada a estado ${req.body.estado}` });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, updateEstado };
