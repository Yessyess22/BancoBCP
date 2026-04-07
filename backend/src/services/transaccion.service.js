const pool = require('../config/db');
const repo = require('../repositories/transaccion.repository');

const getAll = () => repo.findAll();

const depositar = async ({ cuenta_destino_id, monto, descripcion }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await repo.actualizarSaldo(client, cuenta_destino_id, monto);
    const tx = await repo.insertarTransaccion(client, {
      cuenta_destino_id,
      tipo: 'deposito',
      monto,
      descripcion,
    });
    await client.query('COMMIT');
    return tx;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const retirar = async ({ cuenta_origen_id, monto, descripcion }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cuenta = await repo.getSaldoById(client, cuenta_origen_id);
    if (!cuenta) throw Object.assign(new Error('Cuenta no encontrada'), { status: 404 });
    if (parseFloat(cuenta.saldo) < monto) throw Object.assign(new Error('Saldo insuficiente'), { status: 400 });
    await repo.actualizarSaldo(client, cuenta_origen_id, -monto);
    const tx = await repo.insertarTransaccion(client, {
      cuenta_origen_id,
      tipo: 'retiro',
      monto,
      descripcion,
    });
    await client.query('COMMIT');
    return tx;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const transferir = async ({ cuenta_origen_id, cuenta_destino_id, monto, descripcion, banco_nombre, cuenta_externa }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const origen = await repo.getSaldoById(client, cuenta_origen_id);
    if (!origen) throw Object.assign(new Error('Cuenta origen no encontrada'), { status: 404 });
    if (parseFloat(origen.saldo) < monto) throw Object.assign(new Error('Saldo insuficiente'), { status: 400 });

    // Descontar origen
    await repo.actualizarSaldo(client, cuenta_origen_id, -monto);

    // Si hay destino interno, abonar
    if (cuenta_destino_id) {
      await repo.actualizarSaldo(client, cuenta_destino_id, monto);
    }

    // Preparar descripción con info de Interbancaria si aplica
    let finalDesc = descripcion || '';
    if (!cuenta_destino_id && banco_nombre && cuenta_externa) {
      finalDesc = `INTERBANCARIA | ${banco_nombre} | Cuenta: ${cuenta_externa} | ${finalDesc}`;
    }

    const tx = await repo.insertarTransaccion(client, {
      cuenta_origen_id,
      cuenta_destino_id: cuenta_destino_id || null,
      tipo: 'transferencia',
      monto,
      descripcion: finalDesc,
    });
    await client.query('COMMIT');
    return tx;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { getAll, depositar, retirar, transferir };
