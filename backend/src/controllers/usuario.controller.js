const service = require('../services/usuario.service');

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
    res.status(201).json({ success: true, data, message: 'Usuario creado exitosamente' });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body, req.user.id);
    res.json({ success: true, data, message: 'Usuario actualizado exitosamente' });
  } catch (err) {
    next(err);
  }
};

const deactivate = async (req, res, next) => {
  try {
    await service.deactivate(req.params.id, req.user.id);
    res.json({ success: true, data: null, message: 'Usuario desactivado exitosamente' });
  } catch (err) {
    next(err);
  }
};

const assignRole = async (req, res, next) => {
  try {
    const { rol_id } = req.body;
    if (!rol_id) {
      const err = new Error('rol_id es requerido');
      err.status = 400;
      throw err;
    }
    await service.assignRole(req.params.id, rol_id, req.user.id);
    res.json({ success: true, data: null, message: 'Rol asignado exitosamente' });
  } catch (err) {
    next(err);
  }
};

const removeRole = async (req, res, next) => {
  try {
    const { rol_id } = req.body;
    if (!rol_id) {
      const err = new Error('rol_id es requerido');
      err.status = 400;
      throw err;
    }
    await service.removeRole(req.params.id, rol_id, req.user.id);
    res.json({ success: true, data: null, message: 'Rol revocado exitosamente' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, deactivate, assignRole, removeRole };
