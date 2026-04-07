import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export default function BeneficiariosPage() {
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [entidades, setEntidades] = useState([]);
  
  // Forma simple: pedimos el ID del cliente para listar o guardar (simulando que el cliente 1 está logueado)
  const [clienteId, setClienteId] = useState('1'); 
  
  const [formData, setFormData] = useState({
    entidad_id: '',
    alias: '',
    cuenta: ''
  });
  
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    cargarEntidades();
    cargarBeneficiarios(clienteId);
  }, []);

  const cargarEntidades = async () => {
    try {
        const res = await axios.get(`${API}/beneficiarios/entidades`);
        if (res.data.success) {
            setEntidades(res.data.data);
            if(res.data.data.length > 0) {
               setFormData(prev => ({...prev, entidad_id: res.data.data[0].id}));
            }
        }
    } catch (e) {
        console.error("Error al cargar entidades", e);
    }
  };

  const cargarBeneficiarios = async (id) => {
    if (!id) return;
    try {
        const res = await axios.get(`${API}/beneficiarios?cliente_id=${id}`);
        if(res.data.success) setBeneficiarios(res.data.data);
    } catch(e) {
        console.error("Error al cargar beneficiarios", e);
    }
  };

  const handleClienteChange = (e) => {
    setClienteId(e.target.value);
  };

  const handleBuscar = () => {
    cargarBeneficiarios(clienteId);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);
    try {
      const payload = {
        cliente_id: clienteId,
        entidad_id: formData.entidad_id,
        alias_contacto: formData.alias,
        numero_cuenta: formData.cuenta
      };
      const res = await axios.post(`${API}/beneficiarios`, payload);
      if (res.data.success) {
        setMensaje({ tipo: 'exito', texto: 'Guardado correctamente.' });
        setFormData({ ...formData, alias: '', cuenta: '' });
        cargarBeneficiarios(clienteId);
      }
    } catch (err) {
      setMensaje({ 
        tipo: 'error', 
        texto: err.response?.data?.message || err.response?.data?.error || 'Error al guardar. Verifica la cuenta.'
      });
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Agenda de Beneficiarios</h2>
          <p className="page-subtitle">Gestiona tus contactos frecuentes para transferencias inmediatas</p>
        </div>
      </div>

      {mensaje && (
        <div className={`alert ${mensaje.tipo === 'error' ? 'alert-error' : 'alert-success'}`}>
          {mensaje.tipo === 'error' ? '❌' : '✅'} {mensaje.texto}
        </div>
      )}

      <div className="dashboard-grid">
        <div className="dashboard-left">
          <div className="card">
            <div className="card-title">Nuevo Contacto</div>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Entidad Financiera</label>
                <select 
                  name="entidad_id" 
                  value={formData.entidad_id} 
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Seleccione un banco...</option>
                  {entidades.map(ent => (
                    <option key={ent.id} value={ent.id}>{ent.nombre}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Alias / Nombre</label>
                  <input 
                    type="text" 
                    name="alias" 
                    pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+"
                    title="Solo se permiten letras y espacios"
                    value={formData.alias} 
                    onChange={handleChange}
                    placeholder="Ej. Mamá, Juan Pérez..."
                    required
                    maxLength={50}
                  />
                </div>
                <div className="form-group">
                  <label>Número de Cuenta</label>
                  <input 
                    type="text" 
                    name="cuenta" 
                    pattern="[0-9]+"
                    title="Solo se permiten números"
                    inputMode="numeric"
                    value={formData.cuenta} 
                    onChange={e => setFormData({ ...formData, cuenta: e.target.value.replace(/\D/g, '') })}
                    placeholder="Solo dígitos"
                    required
                    maxLength={20}
                  />
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  ➕ Guardar en Agenda
                </button>
              </div>
            </form>
          </div>

          <div className="card" style={{ background: 'var(--info-light)', borderColor: 'rgba(74,144,217,0.2)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ fontSize: 24 }}>💡</div>
              <div style={{ fontSize: 13, color: 'var(--info)', lineHeight: 1.4 }}>
                <strong>Tip de seguridad:</strong> Verifica siempre el número de cuenta antes de guardar. 
                Los contactos de la agenda aparecerán automáticamente al realizar transferencias.
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-right">
          <div className="card">
            <div className="card-title">
              Contactos Guardados
              <span className="badge badge-gray">{beneficiarios.length}</span>
            </div>
            
            {beneficiarios.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>📇</div>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Tu agenda está vacía.</p>
              </div>
            ) : (
              <div className="tx-list">
                {beneficiarios.map(b => (
                  <div key={b.id} className="tx-item" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 4 }}>
                    <div className="tx-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                      👤
                    </div>
                    <div className="tx-info">
                      <div className="tx-name">{b.alias_contacto}</div>
                      <div className="tx-desc">🏦 {b.entidad_nombre}</div>
                      <div style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', marginTop: 2, color: 'var(--text-primary)', fontWeight: 600 }}>
                        💳 {b.numero_cuenta}
                      </div>
                    </div>
                    <div className="badge badge-gray" style={{ alignSelf: 'flex-start', fontSize: 9 }}>
                      ID: {b.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
