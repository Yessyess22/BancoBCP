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

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Estados para búsqueda de cliente (Autocomplete)
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resCuentas, resClientes] = await Promise.all([
        axios.get(`${API}/cuentas`),
        axios.get(`${API}/clientes`),
      ]);
      setCuentas(Array.isArray(resCuentas.data) ? resCuentas.data : (resCuentas.data?.data || []));
      setClientes(Array.isArray(resClientes.data) ? resClientes.data : (resClientes.data?.data || []));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 4000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cliente_id) {
      flash('❌ Por favor seleccione un cliente válido de la lista');
      return;
    }
    try {
      await axios.post(`${API}/cuentas`, form);
      flash('✅ Cuenta aperturada exitosamente');
      setShowForm(false);
      setForm({ cliente_id: '', tipo_cuenta_id: '', saldo_inicial: '', moneda_id: '' });
      setClientSearchTerm('');
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

  // Filtrado de clientes para el autocomplete
  const filteredClients = clientes.filter(c => {
    const term = clientSearchTerm.toLowerCase();
    return c.nombre.toLowerCase().includes(term) || 
           c.apellido.toLowerCase().includes(term) || 
           c.dni.toLowerCase().includes(term);
  }).slice(0, 8);

  const selectClient = (c) => {
    setForm({ ...form, cliente_id: c.id });
    setClientSearchTerm(`${c.nombre} ${c.apellido} (${c.dni})`);
    setShowClientDropdown(false);
  };

  const displayed = cuentas.filter(c =>
    filter === 'all' ? true : filter === 'activa' ? c.activa : !c.activa
  );

  const totalItems = displayed.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCuentas = displayed.slice(startIndex, startIndex + pageSize);

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
                <div className="search-select-container">
                  <input 
                    type="text" 
                    placeholder="🔍 Buscar cliente por nombre o DNI..."
                    value={clientSearchTerm}
                    onChange={(e) => {
                      setClientSearchTerm(e.target.value);
                      setShowClientDropdown(true);
                      if (form.cliente_id) setForm({ ...form, cliente_id: '' });
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    required
                  />
                  {showClientDropdown && clientSearchTerm.length > 0 && (
                    <ul className="search-select-results">
                      {filteredClients.length === 0 ? (
                        <li className="search-select-no-results">No se encontraron clientes</li>
                      ) : (
                        filteredClients.map(c => (
                          <li key={c.id} className="search-select-item" onClick={() => selectClient(c)}>
                            <strong>{c.nombre} {c.apellido}</strong>
                            <span>DNI: {c.dni}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Producto / Tipo de Cuenta *</label>
                <select value={form.tipo_cuenta_id} onChange={e => setForm({ ...form, tipo_cuenta_id: e.target.value })} required>
                  <option value="">-- Seleccionar tipo --</option>
                  {tiposCuenta.map(t => <option key={t.id} value={t.id}>{t.descripcion}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Saldo Inicial</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  title="Saldo inicial no puede ser negativo"
                  value={form.saldo_inicial} 
                  onChange={e => setForm({ ...form, saldo_inicial: e.target.value })} 
                  placeholder="0.00" 
                />
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

      <div className="type-toggle-group" style={{ marginBottom: 16 }}>
        {[['all', '📋 Todas'], ['activa', '✅ Activas'], ['suspendida', '🛑 Suspendidas']].map(([val, label]) => (
          <button key={val} className={`type-toggle-btn ${filter === val ? 'active' : ''}`} onClick={() => setFilter(val)}>
            {label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-title">Cuentas ({totalItems})</div>
        {loading ? <div className="spinner" style={{ margin: '40px auto' }}></div> : (
          <>
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
                  {paginatedCuentas.map(c => (
                    <tr key={c.id}>
                      <td><code>{c.numero_cuenta}</code></td>
                      <td><strong>{c.nombre} {c.apellido}</strong><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.dni}</div></td>
                      <td><span className="badge badge-blue">{c.tipo_descripcion || c.tipo}</span></td>
                      <td><strong>{c.simbolo || 'Bs.'} {parseFloat(c.saldo).toFixed(2)}</strong></td>
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

            {totalPages > 1 && (
              <div className="pagination-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, padding: '0 10px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  Mostrando página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({totalItems} resultados)
                </div>
                <div className="pagination-buttons" style={{ display: 'flex', gap: 8 }}>
                  <button 
                    className="btn btn-sm btn-secondary" 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    ⬅️ Anterior
                  </button>
                  <button 
                    className="btn btn-sm btn-secondary" 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Siguiente ➡️
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
