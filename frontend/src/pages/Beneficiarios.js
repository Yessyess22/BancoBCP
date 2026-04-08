import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const emptyForm = { entidad_id: '', alias_contacto: '', numero_cuenta: '' };

export default function BeneficiariosPage() {
  const [clientes, setClientes]         = useState([]);
  const [entidades, setEntidades]       = useState([]);
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clienteSearch, setClienteSearch] = useState('');
  const [showDropdown, setShowDropdown]  = useState(false);
  const [formData, setFormData]          = useState(emptyForm);
  const [showForm, setShowForm]          = useState(false);
  const [msg, setMsg]                    = useState('');
  const [loading, setLoading]            = useState(false);

  useEffect(() => {
    cargarEntidades();
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const res = await axios.get(`${API}/clientes`);
      setClientes(res.data?.data || []);
    } catch (e) {
      console.error('Error al cargar clientes', e);
    }
  };

  const cargarEntidades = async () => {
    try {
      const res = await axios.get(`${API}/beneficiarios/entidades`);
      if (res.data.success) {
        setEntidades(res.data.data);
        if (res.data.data.length > 0) {
          setFormData(prev => ({ ...prev, entidad_id: res.data.data[0].id }));
        }
      }
    } catch (e) {
      console.error('Error al cargar entidades', e);
    }
  };

  const cargarBeneficiarios = async (clienteId) => {
    if (!clienteId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/beneficiarios?cliente_id=${clienteId}`);
      if (res.data.success) setBeneficiarios(res.data.data);
    } catch (e) {
      flash('❌ Error al cargar beneficiarios');
    }
    setLoading(false);
  };

  const seleccionarCliente = (c) => {
    setClienteSeleccionado(c);
    setClienteSearch(`${c.nombre} ${c.apellido} (${c.dni})`);
    setShowDropdown(false);
    cargarBeneficiarios(c.id);
    setBeneficiarios([]);
  };

  const clientesFiltrados = clientes.filter(c => {
    const t = clienteSearch.toLowerCase();
    return c.nombre?.toLowerCase().includes(t) ||
           c.apellido?.toLowerCase().includes(t) ||
           c.dni?.includes(t);
  }).slice(0, 8);

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 4000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clienteSeleccionado) {
      flash('❌ Selecciona un cliente primero');
      return;
    }
    try {
      await axios.post(`${API}/beneficiarios`, {
        cliente_id: clienteSeleccionado.id,
        entidad_id: formData.entidad_id,
        alias_contacto: formData.alias_contacto,
        numero_cuenta: formData.numero_cuenta,
      });
      flash('✅ Beneficiario guardado correctamente');
      setFormData({ ...emptyForm, entidad_id: entidades[0]?.id || '' });
      setShowForm(false);
      cargarBeneficiarios(clienteSeleccionado.id);
    } catch (err) {
      flash('❌ ' + (err.response?.data?.message || 'Error al guardar'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este beneficiario de la agenda?')) return;
    try {
      await axios.delete(`${API}/beneficiarios/${id}`);
      flash('✅ Beneficiario eliminado');
      cargarBeneficiarios(clienteSeleccionado.id);
    } catch (err) {
      flash('❌ ' + (err.response?.data?.message || 'Error al eliminar'));
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Agenda de Beneficiarios</h2>
          <p className="page-subtitle">Gestiona los contactos frecuentes de transferencia por cliente</p>
        </div>
        {clienteSeleccionado && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancelar' : '➕ Nuevo Beneficiario'}
          </button>
        )}
      </div>

      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

      {/* Selector de cliente */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Seleccionar Cliente</div>
        <div style={{ position: 'relative', maxWidth: 480 }}>
          <input
            type="text"
            placeholder="🔍 Buscar cliente por nombre, apellido o DNI..."
            value={clienteSearch}
            onChange={e => {
              setClienteSearch(e.target.value);
              setShowDropdown(true);
              if (clienteSeleccionado) {
                setClienteSeleccionado(null);
                setBeneficiarios([]);
              }
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}
          />
          {showDropdown && clienteSearch.length > 0 && !clienteSeleccionado && (
            <ul className="search-select-results" style={{ top: '100%', left: 0, right: 0, zIndex: 10 }}>
              {clientesFiltrados.length === 0 ? (
                <li className="search-select-no-results">Sin resultados</li>
              ) : clientesFiltrados.map(c => (
                <li key={c.id} className="search-select-item"
                  onMouseDown={() => seleccionarCliente(c)}>
                  <strong>{c.nombre} {c.apellido}</strong>
                  <span>DNI: {c.dni}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {clienteSeleccionado && (
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>
            Cliente seleccionado: <strong>{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</strong> · DNI: {clienteSeleccionado.dni}
          </div>
        )}
      </div>

      {/* Formulario nuevo beneficiario */}
      {showForm && clienteSeleccionado && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">➕ Nuevo Beneficiario para {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Entidad Financiera *</label>
                <select
                  value={formData.entidad_id}
                  onChange={e => setFormData({ ...formData, entidad_id: e.target.value })}
                  required
                >
                  <option value="" disabled>Seleccione un banco...</option>
                  {entidades.map(ent => (
                    <option key={ent.id} value={ent.id}>{ent.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Alias / Nombre del contacto *</label>
                <input
                  type="text"
                  value={formData.alias_contacto}
                  onChange={e => setFormData({ ...formData, alias_contacto: e.target.value })}
                  placeholder="Ej: Mamá, Juan Pérez..."
                  required
                  maxLength={50}
                />
              </div>
              <div className="form-group">
                <label>Número de Cuenta *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.numero_cuenta}
                  onChange={e => setFormData({ ...formData, numero_cuenta: e.target.value.replace(/\D/g, '') })}
                  placeholder="Solo dígitos"
                  required
                  maxLength={20}
                />
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary">✅ Guardar en Agenda</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de beneficiarios */}
      {clienteSeleccionado && (
        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Beneficiarios de {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</span>
            <span className="badge badge-gray">{beneficiarios.length}</span>
          </div>

          {loading ? <div className="spinner" style={{ margin: '30px auto' }}></div> : (
            beneficiarios.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>📇</div>
                <p style={{ fontSize: 13 }}>Este cliente no tiene beneficiarios registrados.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Alias</th>
                      <th>Entidad</th>
                      <th>Número de Cuenta</th>
                      <th>Fecha Registro</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beneficiarios.map(b => (
                      <tr key={b.id}>
                        <td><strong>👤 {b.alias_contacto}</strong></td>
                        <td>{b.entidad_nombre} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({b.codigo_sie})</span></td>
                        <td><span className="badge badge-blue">💳 {b.numero_cuenta}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {new Date(b.created_at).toLocaleDateString('es-PE')}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b.id)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {!clienteSeleccionado && (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📒</div>
          <p>Busca y selecciona un cliente para ver su agenda de beneficiarios.</p>
        </div>
      )}
    </div>
  );
}
