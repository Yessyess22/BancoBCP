const pool = require('../config/db');
const repo = require('../repositories/cliente.repository');

const getAll = () => repo.findAll();

const getById = async (id) => {
  const cliente = await repo.findById(id);
  if (!cliente) {
    const err = new Error('Cliente no encontrado');
    err.status = 404;
    throw err;
  }
  return cliente;
};

const create = async (data, actorId) => {
  const { dni, nombre, apellido, email } = data;

  if (!dni || !nombre || !apellido) {
    const err = new Error('dni, nombre y apellido son requeridos');
    err.status = 400;
    throw err;
  }

  const dniExistente = await repo.findByDni(dni);
  if (dniExistente) {
    const err = new Error(`Ya existe un cliente registrado con el DNI ${dni}`);
    err.status = 409;
    throw err;
  }

  if (email) {
    const emailExistente = await repo.findByEmail(email);
    if (emailExistente) {
      const err = new Error('El email ya está registrado por otro cliente');
      err.status = 409;
      throw err;
    }
  }

  const cliente = await repo.create(data);

  await pool.query(
    `INSERT INTO auditoria (usuario_id, accion, tabla, registro_id, datos_despues, nivel)
     VALUES ($1, 'CREAR_CLIENTE', 'clientes', $2, $3, 'info')`,
    [actorId, cliente.id, JSON.stringify({ dni, nombre, apellido, email })]
  );

  return cliente;
};

const update = async (id, data, actorId) => {
  const { nombre, apellido, email } = data;

  if (!nombre || !apellido) {
    const err = new Error('nombre y apellido son requeridos');
    err.status = 400;
    throw err;
  }

  if (email) {
    const emailExistente = await repo.findByEmail(email, id);
    if (emailExistente) {
      const err = new Error('El email ya está registrado por otro cliente');
      err.status = 409;
      throw err;
    }
  }

  const cliente = await repo.update(id, data);
  if (!cliente) {
    const err = new Error('Cliente no encontrado');
    err.status = 404;
    throw err;
  }

  await pool.query(
    `INSERT INTO auditoria (usuario_id, accion, tabla, registro_id, datos_despues, nivel)
     VALUES ($1, 'ACTUALIZAR_CLIENTE', 'clientes', $2, $3, 'info')`,
    [actorId, id, JSON.stringify({ nombre, apellido, email })]
  );

  return cliente;
};

const deactivate = async (id, actorId) => {
  const result = await repo.deactivate(id);
  if (!result) {
    const err = new Error('Cliente no encontrado o ya inactivo');
    err.status = 404;
    throw err;
  }

  await pool.query(
    `INSERT INTO auditoria (usuario_id, accion, tabla, registro_id, nivel)
     VALUES ($1, 'ELIMINAR_CLIENTE', 'clientes', $2, 'warn')`,
    [actorId, id]
  );
};

module.exports = { getAll, getById, create, update, deactivate };
