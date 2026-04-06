import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function TransaccionesPage() {
  const [transacciones, setTransacciones] = useState([]);
  const [cuentas, setCuentas]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [tipoOpe, setTipoOpe]             = useState('deposito'); // Renombrado para evitar conflicto con filtro
  const [showForm, setShowForm]           = useState(false);
  const [msg, setMsg]                     = useState('');
  const [form, setForm] = useState({ cuenta_origen_id: '', cuenta_destino_id: '', monto: '', descripcion: '' });

  // Estados para búsqueda y paginación
  const [searchTerm, setSearchTerm]   = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Estados para búsqueda de cuentas (Autocomplete)
  const [originSearch, setOriginSearch]           = useState('');
  const [destSearch, setDestSearch]                 = useState('');
  const [showOriginDrop, setShowOriginDrop]       = useState(false);
  const [showDestDrop, setShowDestDrop]           = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resTrans, resCuentas] = await Promise.all([
        axios.get(`${API}/transacciones`),
        axios.get(`${API}/cuentas`),
      ]);
      setTransacciones(Array.isArray(resTrans.data) ? resTrans.data : (resTrans.data?.data || []));
      setCuentas(Array.isArray(resCuentas.data) ? resCuentas.data : (resCuentas.data?.data || []));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Resetear página al filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 5000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((tipoOpe === 'retiro' || tipoOpe === 'transferencia') && !form.cuenta_origen_id) {
      flash('❌ Seleccione una cuenta de origen válida'); return;
    }
    if ((tipoOpe === 'deposito' || tipoOpe === 'transferencia') && !form.cuenta_destino_id) {
      flash('❌ Seleccione una cuenta de destino válida'); return;
    }

    try {
      const payload = { ...form, monto: parseFloat(form.monto) };
      await axios.post(`${API}/transacciones/${tipoOpe}`, payload);
      flash(`✅ ${tipoOpe.charAt(0).toUpperCase() + tipoOpe.slice(1)} procesado exitosamente`);
      setShowForm(false);
      setForm({ cuenta_origen_id: '', cuenta_destino_id: '', monto: '', descripcion: '' });
      setOriginSearch(''); setDestSearch('');
      fetchData();
    } catch (err) {
      flash('❌ Error: ' + (err.response?.data?.message || err.response?.data?.error || 'Error en la operación'));
    }
  };

  // Lógica de filtrado para Autocomplete
  const filterAccounts = (term) => {
    const t = term.toLowerCase();
    return cuentas.filter(c => c.activa && (
      c.numero_cuenta.toLowerCase().includes(t) ||
      c.nombre.toLowerCase().includes(t) ||
      c.apellido.toLowerCase().includes(t) ||
      c.dni.toLowerCase().includes(t)
    )).slice(0, 8);
  };

  const selectOrigin = (c) => {
    setForm({ ...form, cuenta_origen_id: c.id });
    setOriginSearch(`${c.numero_cuenta} — ${c.nombre} ${c.apellido}`);
    setShowOriginDrop(false);
  };

  const selectDest = (c) => {
    setForm({ ...form, cuenta_destino_id: c.id });
    setDestSearch(`${c.numero_cuenta} — ${c.nombre} ${c.apellido}`);
    setShowDestDrop(false);
  };

  // Lógica de filtrado de tabla
  const filteredTransacciones = transacciones.filter(t => {
    const term = searchTerm.toLowerCase();
    return t.tipo?.toLowerCase().includes(term) || 
           t.cuenta_origen?.toLowerCase().includes(term) || 
           t.cuenta_destino?.toLowerCase().includes(term);
  });

  // Lógica de paginación
  const totalItems = filteredTransacciones.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTransacciones = filteredTransacciones.slice(startIndex, startIndex + pageSize);

  const tipoBadge = (t) => t === 'deposito' ? 'green' : t === 'retiro' ? 'red' : 'blue';
  const tipoIcon  = (t) => t === 'deposito' ? '⬆️' : t === 'retiro' ? '⬇️' : '↔️';

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

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Nueva Operación Bancaria</div>

          <div className="type-toggle-group">
            {['deposito', 'retiro', 'transferencia'].map(t => (
              <button key={t} type="button"
                className={`type-toggle-btn ${tipoOpe === t ? 'active' : ''}`}
                onClick={() => { 
                  setTipoOpe(t); 
                  setForm({ cuenta_origen_id: '', cuenta_destino_id: '', monto: '', descripcion: '' });
                  setOriginSearch(''); setDestSearch('');
                }}>
                {t === 'deposito' ? '⬆️' : t === 'retiro' ? '⬇️' : '↔️'} {t.toUpperCase()}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {(tipoOpe === 'retiro' || tipoOpe === 'transferencia') && (
                <div className="form-group">
                  <label>Cuenta de Origen *</label>
                  <div className="search-select-container">
                    <input 
                      type="text" 
                      placeholder="🔍 Buscar cuenta origen..."
                      value={originSearch}
                      onChange={(e) => {
                        setOriginSearch(e.target.value);
                        setShowOriginDrop(true);
                        if (form.cuenta_origen_id) setForm({ ...form, cuenta_origen_id: '' });
                      }}
                      onFocus={() => setShowOriginDrop(true)}
                      required
                    />
                    {showOriginDrop && originSearch.length > 0 && (
                      <ul className="search-select-results">
                        {filterAccounts(originSearch).length === 0 ? (
                          <li className="search-select-no-results">No hay coincidencias</li>
                        ) : (
                          filterAccounts(originSearch).map(c => (
                            <li key={c.id} className="search-select-item" onClick={() => selectOrigin(c)}>
                              <strong>{c.numero_cuenta} — {c.nombre} {c.apellido}</strong>
                              <span>Saldo: S/. {parseFloat(c.saldo).toFixed(2)} | DNI: {c.dni}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              )}
              {(tipoOpe === 'deposito' || tipoOpe === 'transferencia') && (
                <div className="form-group">
                  <label>Cuenta de Destino *</label>
                  <div className="search-select-container">
                    <input 
                      type="text" 
                      placeholder="🔍 Buscar cuenta destino..."
                      value={destSearch}
                      onChange={(e) => {
                        setDestSearch(e.target.value);
                        setShowDestDrop(true);
                        if (form.cuenta_destino_id) setForm({ ...form, cuenta_destino_id: '' });
                      }}
                      onFocus={() => setShowDestDrop(true)}
                      required
                    />
                    {showDestDrop && destSearch.length > 0 && (
                      <ul className="search-select-results">
                        {filterAccounts(destSearch).length === 0 ? (
                          <li className="search-select-no-results">No hay coincidencias</li>
                        ) : (
                          filterAccounts(destSearch).map(c => (
                            <li key={c.id} className="search-select-item" onClick={() => selectDest(c)}>
                              <strong>{c.numero_cuenta} — {c.nombre} {c.apellido}</strong>
                              <span>DNI: {c.dni}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </div>
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
              Procesar {tipoOpe.charAt(0).toUpperCase() + tipoOpe.slice(1)}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <div className="card-title" style={{ margin: 0 }}>Historial de Operaciones ({totalItems})</div>
          <div className="search-box">
            <input 
              type="text" 
              placeholder="🔍 Filtrar por tipo o cuenta..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '300px' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : (
          <>
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
                  {paginatedTransacciones.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      <div className="empty-state-icon">💸</div>
                      <p>Sin operaciones registradas</p>
                    </td></tr>
                  ) : paginatedTransacciones.map(t => (
                    <tr key={t.id}>
                      <td>
                        <span className={`badge badge-${tipoBadge(t.tipo)}`}>
                          {tipoIcon(t.tipo)} {t.tipo?.toUpperCase()}
                        </span>
                      </td>
                      <td>{t.cuenta_origen ? <code style={{ fontSize: 11 }}>{t.cuenta_origen}</code> : <em style={{ color: 'var(--text-muted)', fontSize: 12 }}>Efectivo</em>}</td>
                      <td>{t.cuenta_destino ? <code style={{ fontSize: 11 }}>{t.cuenta_destino}</code> : <em style={{ color: 'var(--text-muted)', fontSize: 12 }}>Efectivo</em>}</td>
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
