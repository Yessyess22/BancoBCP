import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const emptyForm = { username: '', nombre: '', email: '', password: '', rol: 'empleado', activo: true };

export default function UsuariosPage() {
  const [usuarios, setUsuarios]     = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [loading, setLoading]       = useState(true);
  const [msg, setMsg]               = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/usuarios`);
      setUsuarios(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      flash('❌ ' + (err.response?.data?.message || 'Error al cargar usuarios'));
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsuarios(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const filteredUsuarios = usuarios.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      u.username?.toLowerCase().includes(term) ||
      u.nombre?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.rol?.toLowerCase().includes(term)
    );
  });

  const totalItems  = filteredUsuarios.length;
  const totalPages  = Math.ceil(totalItems / pageSize);
  const startIndex  = (currentPage - 1) * pageSize;
  const paginated   = filteredUsuarios.slice(startIndex, startIndex + pageSize);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 4000); };

  const handleNew = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleEdit = (u) => {
    setEditTarget(u);
    setForm({ username: u.username, nombre: u.nombre, email: u.email, password: '', rol: u.rol, activo: u.activo });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editTarget) {
        await axios.put(`${API}/usuarios/${editTarget.id}`, form);
        flash('✅ Usuario actualizado exitosamente');
      } else {
        await axios.post(`${API}/usuarios`, form);
        flash('✅ Usuario creado exitosamente');
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditTarget(null);
      fetchUsuarios();
    } catch (err) {
      flash('❌ ' + (err.response?.data?.message || 'Error al guardar'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar este usuario?')) return;
    try {
      await axios.delete(`${API}/usuarios/${id}`);
      flash('✅ Usuario desactivado');
      fetchUsuarios();
    } catch (err) {
      flash('❌ ' + (err.response?.data?.message || 'Error al desactivar'));
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Gestión de Usuarios</h2>
          <p className="page-subtitle">Módulo de Administración · Control de acceso y roles del sistema</p>
        </div>
        <button className="btn btn-primary" onClick={showForm ? () => setShowForm(false) : handleNew}>
          {showForm ? '✕ Cancelar' : '➕ Nuevo Usuario'}
        </button>
      </div>

      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">{editTarget ? '✏️ Editar Usuario' : 'Crear Nuevo Usuario'}</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  required
                  disabled={!!editTarget}
                  placeholder="ej: jperez"
                />
              </div>
              <div className="form-group">
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  required
                  placeholder="ej: Juan Pérez"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="ej: jperez@banco.com"
                />
              </div>
              <div className="form-group">
                <label>{editTarget ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required={!editTarget}
                  placeholder={editTarget ? '••••••' : 'Mínimo 6 caracteres'}
                  minLength={form.password ? 6 : undefined}
                />
              </div>
              <div className="form-group">
                <label>Rol *</label>
                <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
                  <option value="empleado">Empleado</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {editTarget && (
                <div className="form-group">
                  <label>Estado</label>
                  <select value={form.activo} onChange={e => setForm({ ...form, activo: e.target.value === 'true' })}>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              )}
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary">
                {editTarget ? '💾 Guardar Cambios' : '✅ Crear Usuario'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <div className="card-title" style={{ margin: 0 }}>Lista de Usuarios ({totalItems})</div>
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, username, email o rol..."
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
                    <th>Username</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Creado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? paginated.map(u => (
                    <tr key={u.id}>
                      <td><span className="badge badge-blue">@{u.username}</span></td>
                      <td><strong>{u.nombre}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.rol === 'admin' ? 'badge-red' : 'badge-green'}`}>
                          {u.rol === 'admin' ? 'Administrador' : 'Empleado'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.activo ? 'badge-green' : 'badge-gray'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(u.created_at).toLocaleDateString('es-PE')}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(u)}>✏️</button>
                          {u.activo && (
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No se encontraron usuarios que coincidan con la búsqueda.
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
    </div>
  );
}
