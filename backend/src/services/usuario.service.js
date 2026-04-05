const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const repo = require('../repositories/usuario.repository');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

const getAll = () => repo.findAll();

const getById = async (id) => {
  const user = await repo.findById(id);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  return user;
};

const create = async (data, actorId) => {
  const { username, nombre, email, password, rol } = data;

  if (!username || !nombre || !email || !password) {
    const err = new Error('username, nombre, email y password son requeridos');
    err.status = 400;
    throw err;
  }

  const existing = await repo.findByUsernameOrEmail(username, email);
  if (existing) {
    const err = new Error('El username o email ya está registrado');
    err.status = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await repo.create({ username, nombre, email, password: hashed, rol });

  await pool.query(
    `INSERT INTO auditoria (usuario_id, accion, tabla, registro_id, datos_despues, nivel)
     VALUES ($1, 'CREAR_USUARIO', 'usuarios', $2, $3, 'info')`,
    [actorId, user.id, JSON.stringify({ username, nombre, email, rol: rol || 'empleado' })]
  );

  return user;
};

const update = async (id, data, actorId) => {
  const { nombre, email, rol } = data;

  if (!nombre || !email) {
    const err = new Error('nombre y email son requeridos');
    err.status = 400;
    throw err;
  }

  const user = await repo.update(id, { nombre, email, rol });
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }

  await pool.query(
    `INSERT INTO auditoria (usuario_id, accion, tabla, registro_id, datos_despues, nivel)
     VALUES ($1, 'ACTUALIZAR_USUARIO', 'usuarios', $2, $3, 'info')`,
    [actorId, id, JSON.stringify({ nombre, email, rol })]
  );

  return user;
};

const deactivate = async (id, actorId) => {
  if (parseInt(id) === parseInt(actorId)) {
    const err = new Error('No puedes desactivar tu propia cuenta');
    err.status = 400;
    throw err;
  }

  const result = await repo.deactivate(id);
  if (!result) {
    const err = new Error('Usuario no encontrado o ya inactivo');
    err.status = 404;
    throw err;
  }

  await pool.query(
    `INSERT INTO auditoria (usuario_id, accion, tabla, registro_id, nivel)
     VALUES ($1, 'ELIMINAR_USUARIO', 'usuarios', $2, 'warn')`,
    [actorId, id]
  );
};

const assignRole = async (usuario_id, rol_id, actorId) => {
  await repo.assignRole(usuario_id, rol_id);
  await pool.query(
    `INSERT INTO auditoria (usuario_id, accion, tabla, registro_id, datos_despues, nivel)
     VALUES ($1, 'ASIGNAR_ROL', 'usuario_roles', $2, $3, 'info')`,
    [actorId, usuario_id, JSON.stringify({ rol_id })]
  );
};

const removeRole = async (usuario_id, rol_id, actorId) => {
  await repo.removeRole(usuario_id, rol_id);
  await pool.query(
    `INSERT INTO auditoria (usuario_id, accion, tabla, registro_id, datos_antes, nivel)
     VALUES ($1, 'REVOCAR_ROL', 'usuario_roles', $2, $3, 'warn')`,
    [actorId, usuario_id, JSON.stringify({ rol_id })]
  );
};

module.exports = { getAll, getById, create, update, deactivate, assignRole, removeRole };
