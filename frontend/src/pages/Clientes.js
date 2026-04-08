import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams as useParamStore } from '../App';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const emptyForm = { dni: '', nombre: '', apellido: '', email: '', telefono: '', direccion: '', fecha_nacimiento: '', ubicacion_id: '' };

export default function ClientesPage() {
  const { ubicaciones }             = useParamStore();
  const [clientes, setClientes]     = useState([]);
  const [showForm, setShowForm]         = useState(false);
  const [loading, setLoading]           = useState(true);
  const [msg, setMsg]                   = useState('');
  const [editTarget, setEditTarget]     = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [credenciales, setCredenciales] = useState(null);

  // Estados para búsqueda y paginación
  const [searchTerm, setSearchTerm]   = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/clientes`);
      setClientes(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => { fetchClientes(); }, []);

  // Resetear página al buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Lógica de filtrado
  const filteredClientes = clientes.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.dni?.toLowerCase().includes(term) ||
      c.nombre?.toLowerCase().includes(term) ||
      c.apellido?.toLowerCase().includes(term)
    );
  });

  // Lógica de paginación
  const totalItems = filteredClientes.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedClientes = filteredClientes.slice(startIndex, startIndex + pageSize);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 4000); };
  
  // ... rest of handers ...
  const handleNew = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleEdit = (c) => {
    setEditTarget(c);
    setForm({
      dni: c.dni || '', nombre: c.nombre || '', apellido: c.apellido || '',
      email: c.email || '', telefono: c.telefono || '',
      direccion: c.direccion || '',
      fecha_nacimiento: c.fecha_nacimiento ? c.fecha_nacimiento.split('T')[0] : '',
      ubicacion_id: c.ubicacion_id || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editTarget) {
        await axios.put(`${API}/clientes/${editTarget.id}`, form);
        flash('✅ Cliente actualizado exitosamente');
      } else {
        const res = await axios.post(`${API}/clientes`, form);
        setCredenciales(res.data.usuarioGenerado);
        flash('✅ Cliente registrado. Se generó acceso al sistema.');
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditTarget(null);
      fetchClientes();
    } catch (err) {
      flash('❌ ' + (err.response?.data?.message || err.response?.data?.error || 'Error al guardar'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar este cliente?')) return;
    try {
      await axios.delete(`${API}/clientes/${id}`);
      flash('✅ Cliente desactivado');
      fetchClientes();
    } catch (err) {
      flash('❌ ' + (err.response?.data?.message || err.response?.data?.error || 'Permiso Denegado'));
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Gestión de Clientes</h2>
          <p className="page-subtitle">Módulo de Identidad · Registro vinculado a Ubicación Geográfica</p>
        </div>
        <button className="btn btn-primary" onClick={showForm ? () => setShowForm(false) : handleNew}>
          {showForm ? '✕ Cancelar' : '➕ Nuevo Cliente'}
        </button>
      </div>

      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">{editTarget ? `✏️ Editar Cliente` : 'Registrar Nuevo Cliente'}</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>DNI *</label>
                <input 
                  type="text"
                  pattern="[0-9]{7,20}" 
                  inputMode="numeric"
                  title="DNI debe contener solo entre 7 y 20 números"
                  value={form.dni} 
                  onChange={e => setForm({ ...form, dni: e.target.value.replace(/\D/g, '') })} 
                  required 
                  disabled={!!editTarget} 
                />
              </div>
              <div className="form-group">
                <label>Nombres *</label>
                <input 
                  type="text"
                  pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+"
                  title="Solo se permiten letras y espacios"
                  value={form.nombre} 
                  onChange={e => setForm({ ...form, nombre: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Apellidos *</label>
                <input 
                  type="text"
                  pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+"
                  title="Solo se permiten letras y espacios"
                  value={form.apellido} 
                  onChange={e => setForm({ ...form, apellido: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ejemplo@bcp.com.bo" />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input 
                  type="text"
                  pattern="[0-9]{8,15}"
                  inputMode="numeric"
                  title="Teléfono debe tener entre 8 y 15 dígitos numéricos"
                  value={form.telefono} 
                  onChange={e => setForm({ ...form, telefono: e.target.value.replace(/\D/g, '') })} 
                />
              </div>
              <div className="form-group">
                <label>Ubicación / Región</label>
                <select value={form.ubicacion_id} onChange={e => setForm({ ...form, ubicacion_id: e.target.value })}>
                  <option value="">-- Seleccionar ubicación --</option>
                  {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.nivel})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Fecha de Nacimiento</label>
                <input type="date" value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Dirección Domiciliaria</label>
                <input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary">{editTarget ? '💾 Guardar Cambios' : '✅ Registrar Cliente'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <div className="card-title" style={{ margin: 0 }}>Lista de Clientes ({totalItems})</div>
          <div className="search-box">
            <input 
              type="text" 
              placeholder="🔍 Buscar por nombre, apellido o DNI..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '300px' }}
            />
          </div>
        </div>

        {loading ? <div className="spinner" style={{ margin: '40px auto' }}></div> : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>DNI</th>
                    <th>Nombre Completo</th>
                    <th>Ubicación</th>
                    <th>Email / Teléfono</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClientes.length > 0 ? paginatedClientes.map(c => (
                    <tr key={c.id}>
                      <td><span className="badge badge-blue">{c.dni}</span></td>
                      <td><strong>{c.nombre} {c.apellido}</strong><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.direccion}</div></td>
                      <td>{c.ubicacion_nombre || <em style={{ color: 'var(--text-muted)' }}>No asignada</em>}</td>
                      <td>{c.email}<br /><small>{c.telefono}</small></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(c)}>✏️</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No se encontraron clientes que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
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

      {/* Modal credenciales generadas */}
      {credenciales && (
        <div className="modal-overlay" onClick={() => setCredenciales(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">🔑 Acceso generado para el cliente</div>
              <button className="modal-close" onClick={() => setCredenciales(null)}>✕</button>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Se creó automáticamente un usuario de acceso al sistema. Entrega estas credenciales al cliente:
              </p>
              <div style={{ background: 'var(--info-light)', border: '1px solid rgba(74,144,217,0.3)', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Usuario</span>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)', marginTop: 2 }}>
                    {credenciales.username}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Contraseña inicial</span>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)', marginTop: 2 }}>
                    {credenciales.password}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                ⚠️ La contraseña inicial es el DNI del cliente. Se recomienda cambiarla en el primer ingreso.
              </p>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setCredenciales(null)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

