import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function TransaccionesPage() {
  const [transacciones, setTransacciones] = useState([]);
  const [cuentas, setCuentas]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [tipo, setTipo]                   = useState('deposito');
  const [showForm, setShowForm]           = useState(false);
  const [msg, setMsg]                     = useState('');
  const [form, setForm] = useState({ cuenta_origen_id: '', cuenta_destino_id: '', monto: '', descripcion: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resTrans, resCuentas] = await Promise.all([
        axios.get(`${API}/transacciones`),
        axios.get(`${API}/cuentas`),
      ]);
      // transacciones → {success, data}; cuentas → plain array
      setTransacciones(Array.isArray(resTrans.data) ? resTrans.data : (resTrans.data?.data || []));
      setCuentas(Array.isArray(resCuentas.data) ? resCuentas.data : (resCuentas.data?.data || []));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 5000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, monto: parseFloat(form.monto) };
      await axios.post(`${API}/transacciones/${tipo}`, payload);
      flash(`✅ ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} procesado exitosamente`);
      setShowForm(false);
      setForm({ cuenta_origen_id: '', cuenta_destino_id: '', monto: '', descripcion: '' });
      fetchData();
    } catch (err) {
      flash('❌ Error: ' + (err.response?.data?.message || err.response?.data?.error || 'Error en la operación'));
    }
  };

  const tipoBadge = (t) => t === 'deposito' ? 'green' : t === 'retiro' ? 'red' : 'blue';
  const tipoIcon  = (t) => t === 'deposito' ? '⬆️' : t === 'retiro' ? '⬇️' : '↔️';

  // Stats summary
  const totalDepositos    = transacciones.filter(t => t.tipo === 'deposito').reduce((s, t) => s + parseFloat(t.monto), 0);
  const totalRetiros      = transacciones.filter(t => t.tipo === 'retiro').reduce((s, t) => s + parseFloat(t.monto), 0);
  const totalTransferencias = transacciones.filter(t => t.tipo === 'transferencia').length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Motor de Transacciones</h2>
          <p className="page-subtitle">Depósitos, Retiros y Transferencias con procesamiento atómico · Módulo de Denis Q.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '➕ Nueva Transacción'}
        </button>
      </div>

      {/* Summary */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-green">⬆️</div>
          <div>
            <div className="stat-num" style={{ fontSize: 16, color: 'var(--primary)' }}>
              S/. {totalDepositos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </div>
            <div className="stat-label">Total Depósitos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-red">⬇️</div>
          <div>
            <div className="stat-num" style={{ fontSize: 16, color: 'var(--danger)' }}>
              S/. {totalRetiros.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </div>
            <div className="stat-label">Total Retiros</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-blue">↔️</div>
          <div>
            <div className="stat-num">{totalTransferencias}</div>
            <div className="stat-label">Transferencias</div>
          </div>
        </div>
      </div>

      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Nueva Operación Bancaria</div>

          {/* Type selector */}
          <div className="type-toggle-group">
            {['deposito', 'retiro', 'transferencia'].map(t => (
              <button key={t} type="button"
                className={`type-toggle-btn ${tipo === t ? 'active' : ''}`}
                onClick={() => { setTipo(t); setForm({ cuenta_origen_id: '', cuenta_destino_id: '', monto: '', descripcion: '' }); }}>
                {t === 'deposito' ? '⬆️' : t === 'retiro' ? '⬇️' : '↔️'} {t.toUpperCase()}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {(tipo === 'retiro' || tipo === 'transferencia') && (
                <div className="form-group">
                  <label>Cuenta de Origen *</label>
                  <select value={form.cuenta_origen_id}
                    onChange={e => setForm({ ...form, cuenta_origen_id: e.target.value })} required>
                    <option value="">-- Seleccionar cuenta origen --</option>
                    {cuentas.filter(c => c.activa).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.numero_cuenta} — {c.nombre} {c.apellido} | Saldo: S/. {parseFloat(c.saldo).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {(tipo === 'deposito' || tipo === 'transferencia') && (
                <div className="form-group">
                  <label>Cuenta de Destino *</label>
                  <select value={form.cuenta_destino_id}
                    onChange={e => setForm({ ...form, cuenta_destino_id: e.target.value })} required>
                    <option value="">-- Seleccionar cuenta destino --</option>
                    {cuentas.filter(c => c.activa).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.numero_cuenta} — {c.nombre} {c.apellido}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Monto de la Operación (S/.) *</label>
                <input type="number" step="0.01" min="0.01" value={form.monto}
                  onChange={e => setForm({ ...form, monto: e.target.value })} required
                  placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Concepto / Glosa</label>
                <input value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Ej: Pago de servicios" />
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--info-light)', borderRadius: 8, fontSize: 12, color: 'var(--info)' }}>
              🔒 La operación se procesa de forma <strong>atómica</strong> (BEGIN/COMMIT) — garantizando integridad del saldo.
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }}>
              Procesar {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-title">
          Historial de Operaciones ({transacciones.length})
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Cuenta Origen</th>
                  <th>Cuenta Destino</th>
                  <th>Monto</th>
                  <th>Concepto</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {transacciones.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    <div className="empty-state-icon">💸</div>
                    <p>Sin operaciones registradas</p>
                  </td></tr>
                ) : transacciones.map(t => (
                  <tr key={t.id}>
                    <td>
                      <span className={`badge badge-${tipoBadge(t.tipo)}`}>
                        {tipoIcon(t.tipo)} {t.tipo?.toUpperCase()}
                      </span>
                    </td>
                    <td>{t.cuenta_origen
                      ? <code style={{ fontSize: 11 }}>{t.cuenta_origen}</code>
                      : <em style={{ color: 'var(--text-muted)', fontSize: 12 }}>Efectivo</em>}
                    </td>
                    <td>{t.cuenta_destino
                      ? <code style={{ fontSize: 11 }}>{t.cuenta_destino}</code>
                      : <em style={{ color: 'var(--text-muted)', fontSize: 12 }}>Efectivo</em>}
                    </td>
                    <td>
                      <strong style={{ color: t.tipo === 'deposito' ? 'var(--primary-dark)' : t.tipo === 'retiro' ? 'var(--danger)' : 'var(--info)' }}>
                        S/. {parseFloat(t.monto).toFixed(2)}
                      </strong>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t.descripcion || <em>—</em>}</td>
                    <td style={{ fontSize: 12 }}>{new Date(t.created_at).toLocaleString('es-PE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
