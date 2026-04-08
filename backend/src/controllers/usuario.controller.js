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
    if (!data) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    res.json({ success: true, data, message: 'OK' });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body);
    res.status(201).json({ success: true, data, message: 'Usuario creado exitosamente' });
  } catch (err) {
    if (err.code === '23505') {
      let msg = 'El usuario ya existe (username o email duplicado)';
      if (err.detail?.includes('username')) msg = 'Error: El nombre de usuario ya está en uso';
      if (err.detail?.includes('email')) msg = 'Error: El correo electrónico ya está en uso';
      return res.status(409).json({ success: false, message: msg });
    }
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    res.json({ success: true, data, message: 'Usuario actualizado exitosamente' });
  } catch (err) {
    if (err.code === '23505') {
      let msg = 'Datos duplicados';
      if (err.detail?.includes('email')) msg = 'Error: El correo electrónico ya está en uso';
      return res.status(409).json({ success: false, message: msg });
    }
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'No puedes desactivar tu propia cuenta' });
    }
    await service.remove(req.params.id);
    res.json({ success: true, message: 'Usuario desactivado exitosamente' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
