import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams as useParamStore } from '../App';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function CuentasPage() {
  const { tiposCuenta, monedas } = useParamStore();
  const [cuentas, setCuentas]     = useState([]);
  const [clientes, setClientes]   = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState('');
  const [filter, setFilter]       = useState('all');
  const [form, setForm] = useState({ cliente_id: '', tipo_cuenta_id: '', saldo_inicial: '', moneda_id: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resCuentas, resClientes] = await Promise.all([
        axios.get(`${API}/cuentas`),
        axios.get(`${API}/clientes`),
      ]);
      setCuentas(Array.isArray(resCuentas.data) ? resCuentas.data : (resCuentas.data?.data || []));
      setClientes(Array.isArray(resClientes.data) ? resClientes.data : (resClientes.data?.data || []));
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 4000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/cuentas`, form);
      flash('✅ Cuenta aperturada exitosamente');
      setShowForm(false);
      setForm({ cliente_id: '', tipo_cuenta_id: '', saldo_inicial: '', moneda_id: '' });
      fetchData();
    } catch (err) {
      flash('❌ ' + (err.response?.data?.message || err.response?.data?.error || 'Error al crear cuenta'));
    }
  };

  const handleToggleEstado = async (id, currentStatus) => {
    try {
      await axios.patch(`${API}/cuentas/${id}/estado`, { activa: !currentStatus });
      flash(`✅ Cuenta ${!currentStatus ? 'activada' : 'suspendida'}`);
      fetchData();
    } catch (err) {
      flash('❌ Error: ' + err.message);
    }
  };

  const displayed = cuentas.filter(c =>
    filter === 'all' ? true : filter === 'activa' ? c.activa : !c.activa
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Gestión de Cuentas Bancarias</h2>
          <p className="page-subtitle">Apertura y administración de productos vinculados a clientes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '➕ Nueva Apertura'}
        </button>
      </div>

      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Aperturar Nueva Cuenta</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Cliente Titular *</label>
                <select value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })} required>
                  <option value="">-- Seleccionar cliente --</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido} ({c.dni})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Producto / Tipo de Cuenta *</label>
                <select value={form.tipo_cuenta_id} onChange={e => setForm({ ...form, tipo_cuenta_id: e.target.value })} required>
                  <option value="">-- Seleccionar tipo --</option>
                  {tiposCuenta.map(t => <option key={t.id} value={t.id}>{t.descripcion}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Saldo Inicial (S/.)</label>
                <input type="number" step="0.01" min="0" value={form.saldo_inicial} onChange={e => setForm({ ...form, saldo_inicial: e.target.value })} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Moneda *</label>
                <select value={form.moneda_id} onChange={e => setForm({ ...form, moneda_id: e.target.value })} required>
                  <option value="">-- Seleccionar moneda --</option>
                  {monedas.map(m => <option key={m.id} value={m.id}>{m.codigo} - {m.nombre}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }}>Confirmar Apertura</button>
          </form>
        </div>
      )}

      {/* Tabs Filter */}
      <div className="type-toggle-group" style={{ marginBottom: 16 }}>
        {[['all', '📋 Todas'], ['activa', '✅ Activas'], ['suspendida', '🛑 Suspendidas']].map(([val, label]) => (
          <button key={val} className={`type-toggle-btn ${filter === val ? 'active' : ''}`} onClick={() => setFilter(val)}>
            {label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-title">Cuentas ({displayed.length})</div>
        {loading ? <div className="spinner" style={{ margin: '40px auto' }}></div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Número de Cuenta</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Saldo</th>
                  <th>Moneda</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(c => (
                  <tr key={c.id}>
                    <td><code>{c.numero_cuenta}</code></td>
                    <td><strong>{c.nombre} {c.apellido}</strong><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.dni}</div></td>
                    <td><span className="badge badge-blue">{c.tipo_descripcion || c.tipo}</span></td>
                    <td><strong>S/. {parseFloat(c.saldo).toFixed(2)}</strong></td>
                    <td>{c.moneda_codigo || c.moneda}</td>
                    <td><span className={`badge badge-${c.activa ? 'green' : 'red'}`}>{c.activa ? 'ACTIVA' : 'SUSPENDIDA'}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => handleToggleEstado(c.id, c.activa)} className={`btn btn-sm ${c.activa ? 'btn-warning' : 'btn-success'}`}>
                        {c.activa ? 'Suspender' : 'Activar'}
                      </button>
                    </td>
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
