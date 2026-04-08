const pool = require('../config/db');
const repo = require('../repositories/credito.repository');

const getAll = (clienteId = null) => repo.findAll(clienteId);
const getById = (id) => repo.findById(id);
const getCuotas = (id) => repo.findCuotasByCreditoId(id);

const solicitar = async (data) => {
  const client = await pool.connect();
  try {
    return await repo.createSolicitud(client, data);
  } finally {
    client.release();
  }
};

const procesarRevision = async (id, payload) => {
  const { estado, monto_aprobado, usuario_aprueba, rol_aprueba } = payload;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const credito = await repo.findById(id);
    if (!credito) throw Object.assign(new Error('Crédito no encontrado'), { status: 404 });
    if (credito.estado !== 'solicitado') throw Object.assign(new Error('Crédito ya ha sido procesado'), { status: 400 });

    // Un empleado no puede aprobar/rechazar su propia solicitud — requiere supervisor o admin
    if (rol_aprueba !== 'admin' && credito.usuario_registra && String(credito.usuario_registra) === String(usuario_aprueba)) {
      throw Object.assign(
        new Error('No puedes aprobar una solicitud que tú mismo registraste. Se requiere un supervisor.'),
        { status: 403 }
      );
    }

    const updated = await repo.updateEstado(client, id, { 
      estado, 
      monto_aprobado: estado === 'aprobado' ? monto_aprobado : null, 
      usuario_aprueba 
    });

    if (estado === 'aprobado') {
      const cuotas = calcularAmortizacion(id, monto_aprobado, updated.tasa_interes, updated.plazo_meses);
      await repo.insertCuotas(client, cuotas);
    }

    await client.query('COMMIT');
    return updated;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const calcularAmortizacion = (id, principal, tasaAnual, meses) => {
  const i = (parseFloat(tasaAnual) / 12);
  const n = parseInt(meses);
  const p = parseFloat(principal);
  
  // Pago mensual (Francés): A = P * [i(1+i)^n] / [(1+i)^n - 1]
  const montoCuota = p * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
  
  const cuotas = [];
  let saldoRestante = p;
  
  for (let num = 1; num <= n; num++) {
    const interes = saldoRestante * i;
    const capital = montoCuota - interes;
    saldoRestante -= capital;
    
    const fechaVencimiento = new Date();
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + num);

    cuotas.push({
      credito_id: id,
      numero_cuota: num,
      monto_cuota: montoCuota.toFixed(2),
      monto_capital: capital.toFixed(2),
      monto_interes: interes.toFixed(2),
      fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0]
    });
  }
  return cuotas;
};

module.exports = { getAll, getById, getCuotas, solicitar, procesarRevision };
