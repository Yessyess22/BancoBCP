import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function CreditosPage() {
  const [creditos, setCreditos]       = useState([]);
  const [clientes, setClientes]       = useState([]);
  const [showForm, setShowForm]       = useState(false);
  const [loading, setLoading]         = useState(true);
  const [msg, setMsg]                 = useState('');
  const [approvalModal, setApprovalModal] = useState(null); // { id, monto_solicitado }
  const [montoAprobado, setMontoAprobado] = useState('');
  const [cuotasModal, setCuotasModal] = useState(null); // array of cuotas
  const [form, setForm] = useState({
    cliente_id: '', monto_solicitado: '', tasa_interes: '0.15', plazo_meses: '12'
  });

  // Estados para búsqueda y paginación
  const [searchTerm, setSearchTerm]   = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Estados para búsqueda de cliente (Autocomplete)
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resCred, resCli] = await Promise.all([
        axios.get(`${API}/creditos`),
        axios.get(`${API}/clientes`),
      ]);
      setCreditos(resCred.data?.data || resCred.data || []);
      setClientes(Array.isArray(resCli.data) ? resCli.data : (resCli.data?.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Resetear página al buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Lógica de filtrado para la tabla
  const filteredCreditos = creditos.filter(c => {
    const term = searchTerm.toLowerCase();
    const nombreCompleto = `${c.nombre} ${c.apellido}`.toLowerCase();
    return (
      nombreCompleto.includes(term) ||
      c.dni?.toLowerCase().includes(term) ||
      c.estado?.toLowerCase().includes(term)
    );
  });

  // Lógica de paginación
  const totalItems = filteredCreditos.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCreditos = filteredCreditos.slice(startIndex, startIndex + pageSize);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cliente_id) {
      flashMsg('❌ Por favor seleccione un cliente de la lista', false);
      return;
    }
    try {
      await axios.post(`${API}/creditos/solicitar`, form);
      flashMsg('✅ Solicitud enviada correctamente', true);
      setShowForm(false);
      setForm({ cliente_id: '', monto_solicitado: '', tasa_interes: '0.15', plazo_meses: '12' });
      setClientSearchTerm('');
      fetchData();
    } catch (err) {
      flashMsg('❌ Error: ' + (err.response?.data?.message || 'No se pudo enviar'), false);
    }
  };

  const flashMsg = (text, ok) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 4000);
  };

  const openApproval = (credito) => {
    setMontoAprobado(credito.monto_solicitado);
    setApprovalModal(credito);
  };

  const handleApprove = async () => {
    try {
      await axios.patch(`${API}/creditos/${approvalModal.id}/revisar`, {
        estado: 'aprobado',
        monto_aprobado: montoAprobado,
      });
      flashMsg('✅ Crédito aprobado y cuotas generadas', true);
      setApprovalModal(null);
      fetchData();
    } catch (err) {
      flashMsg('❌ Error: ' + (err.response?.data?.message || err.message), false);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.patch(`${API}/creditos/${id}/revisar`, { estado: 'rechazado' });
      flashMsg('✅ Crédito rechazado', true);
      fetchData();
    } catch (err) {
      flashMsg('❌ Error al rechazar', false);
    }
  };

  const viewCuotas = async (id) => {
    try {
      const res = await axios.get(`${API}/creditos/${id}`);
      const cuotas = res.data?.data?.cuotas || [];
      setCuotasModal(cuotas);
    } catch {
      alert('Error al cargar cuotas');
    }
  };

  const estadoBadge = (e) => e === 'aprobado' ? 'green' : e === 'rechazado' ? 'red' : 'blue';

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Gestión de Créditos</h2>
          <p className="page-subtitle">Solicitudes de financiamiento y cronogramas de amortización (método francés)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '➕ Nueva Solicitud'}
        </button>
      </div>

      {msg && <div className={`alert ${msg.includes('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Nueva Solicitud de Crédito</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Cliente Solicitante *</label>
                <div className="search-select-container">
                  <input 
                    type="text" 
                    placeholder="🔍 Buscar cliente..."
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
                        <li className="search-select-no-results">No hay coincidencias</li>
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
                <label>Monto Solicitado (S/.)*</label>
                <input type="number" step="0.01" min="100" value={form.monto_solicitado}
                  onChange={e => setForm({ ...form, monto_solicitado: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Tasa de Interés Anual (ej: 0.15 = 15%)</label>
                <input type="number" step="0.01" min="0.01" max="1" value={form.tasa_interes}
                  onChange={e => setForm({ ...form, tasa_interes: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Plazo (meses)</label>
                <select value={form.plazo_meses} onChange={e => setForm({ ...form, plazo_meses: e.target.value })}>
                  {[6,12,18,24,36,48,60].map(m => <option key={m} value={m}>{m} meses</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--info-light)', borderRadius: 8, fontSize: 12, color: 'var(--info)' }}>
              💡 La cuota mensual se calculará automáticamente con el método de amortización francés (cuota fija).
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }}>Enviar Solicitud</button>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <div className="card-title" style={{ margin: 0 }}>Historial de Solicitudes ({totalItems})</div>
          <div className="search-box">
            <input 
              type="text" 
              placeholder="🔍 Buscar por cliente o estado..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '300px' }}
            />
          </div>
        </div>

        {loading ? <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div> : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Cliente</th><th>Monto Solicitado</th>
                    <th>Tasa Anual</th><th>Plazo</th><th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCreditos.length === 0
                    ? <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Sin solicitudes de crédito</td></tr>
                    : paginatedCreditos.map(c => (
                    <tr key={c.id}>
                      <td><span className="badge badge-gray">#{c.id}</span></td>
                      <td><strong>{c.nombre} {c.apellido}</strong><br /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.dni}</span></td>
                      <td><strong>S/. {parseFloat(c.monto_solicitado).toFixed(2)}</strong>
                        {c.monto_aprobado && <div style={{ fontSize: 11, color: 'var(--primary)' }}>Aprobado: S/. {parseFloat(c.monto_aprobado).toFixed(2)}</div>}
                      </td>
                      <td>{(parseFloat(c.tasa_interes) * 100).toFixed(1)}%</td>
                      <td>{c.plazo_meses} meses</td>
                      <td><span className={`badge badge-${estadoBadge(c.estado)}`}>{c.estado.toUpperCase()}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {c.estado === 'solicitado' && (<>
                            <button onClick={() => openApproval(c)} className="btn btn-sm btn-success" title="Aprobar">✅ Aprobar</button>
                            <button onClick={() => handleReject(c.id)} className="btn btn-sm btn-danger" title="Rechazar">❌</button>
                          </>)}
                          {c.estado === 'aprobado' && (
                            <button onClick={() => viewCuotas(c.id)} className="btn btn-sm btn-secondary" title="Ver cuotas">📋 Cuotas</button>
                          )}
                        </div>
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

      {/* Approval Modal */}
      {approvalModal && (
        <div className="modal-overlay" onClick={() => setApprovalModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">✅ Aprobar Crédito #{approvalModal.id}</div>
              <button className="modal-close" onClick={() => setApprovalModal(null)}>✕</button>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
                Cliente: <strong>{approvalModal.nombre} {approvalModal.apellido}</strong><br />
                Monto solicitado: <strong>S/. {parseFloat(approvalModal.monto_solicitado).toFixed(2)}</strong>
              </p>
              <div className="form-group">
                <label>Monto a Aprobar (S/.) *</label>
                <input type="number" step="0.01" value={montoAprobado}
                  onChange={e => setMontoAprobado(e.target.value)} autoFocus />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="btn btn-primary" onClick={handleApprove}>Confirmar Aprobación</button>
                <button className="btn btn-secondary" onClick={() => setApprovalModal(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cuotas Modal */}
      {cuotasModal && (
        <div className="modal-overlay" onClick={() => setCuotasModal(null)}>
          <div className="modal-box" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📋 Cronograma de Amortización</div>
              <button className="modal-close" onClick={() => setCuotasModal(null)}>✕</button>
            </div>
            <div style={{ padding: '0 24px 24px', maxHeight: 480, overflowY: 'auto' }}>
              {cuotasModal.length === 0
                ? <p style={{ color: 'var(--text-muted)' }}>Sin cuotas registradas.</p>
                : (
                <table>
                  <thead>
                    <tr><th>#</th><th>Cuota</th><th>Capital</th><th>Interés</th><th>Vencimiento</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {cuotasModal.map(q => (
                      <tr key={q.numero_cuota}>
                        <td>{q.numero_cuota}</td>
                        <td>S/. {parseFloat(q.monto_cuota).toFixed(2)}</td>
                        <td>S/. {parseFloat(q.monto_capital).toFixed(2)}</td>
                        <td>S/. {parseFloat(q.monto_interes).toFixed(2)}</td>
                        <td>{new Date(q.fecha_vencimiento).toLocaleDateString('es-PE')}</td>
                        <td><span className={`badge badge-${q.estado === 'pagado' ? 'green' : q.estado === 'vencido' ? 'red' : 'blue'}`}>{q.estado?.toUpperCase()}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
