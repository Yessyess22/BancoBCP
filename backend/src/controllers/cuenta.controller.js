const service = require('../services/cuenta.service');

const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll();
    res.json({ success: true, data, message: 'OK' });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body);
    res.status(201).json({ success: true, data, message: 'Cuenta creada exitosamente' });
  } catch (err) {
    if (err.code === '23505') {
       return res.status(409).json({ success: false, message: 'Conflicto: El número de cuenta generado ya existe. Por favor, intente de nuevo.' });
    }
    next(err);
  }
};

const updateEstado = async (req, res, next) => {
  try {
    const data = await service.updateEstado(req.params.id, req.body.activa);
    if (!data) return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
    res.json({ success: true, message: `Cuenta ${req.body.activa ? 'activada' : 'suspendida'} exitosamente`, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, updateEstado };
