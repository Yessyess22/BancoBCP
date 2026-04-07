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
    if (!data) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    res.json({ success: true, data, message: 'OK' });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body);
    res.status(201).json({ success: true, data, message: 'Cliente registrado' });
  } catch (err) {
    if (err.code === '23505') {
       let msg = 'El cliente ya existe (DNI o email duplicado)';
       if (err.detail && err.detail.includes('dni')) msg = 'Error: Este número de DNI ya se encuentra registrado';
       if (err.detail && err.detail.includes('email')) msg = 'Error: Este correo electrónico ya está en uso';
       return res.status(409).json({ success: false, message: msg });
    }
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    res.json({ success: true, data, message: 'Cliente actualizado' });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.json({ success: true, message: 'Cliente eliminado exitosamente' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
