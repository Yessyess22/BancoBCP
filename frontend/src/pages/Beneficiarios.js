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
    <div className="page-container" style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '30px', color: '#1a365d', fontSize: '2em' }}>Agenda de Beneficiarios</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) minmax(400px, 1fr)', gap: '40px' }}>
        {/* Formulario */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#2d3748', fontSize: '1.5em' }}>Nuevo Contacto</h3>
            {mensaje && (
                <div style={{ padding: '15px', marginBottom: '20px', borderRadius: '6px', backgroundColor: mensaje.tipo === 'error' ? '#fee2e2' : '#dcfce7', color: mensaje.tipo === 'error' ? '#991b1b' : '#166534', fontSize: '1.05em' }}>
                    {mensaje.texto}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '1.1em', fontWeight: 'bold', color: '#4a5568' }}>Entidad Financiera</label>
                    <select 
                       name="entidad_id" 
                       value={formData.entidad_id} 
                       onChange={handleChange}
                       style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1.05em' }}
                       required
                    >
                        {entidades.map(ent => <option key={ent.id} value={ent.id}>{ent.nombre}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '1.1em', fontWeight: 'bold', color: '#4a5568' }}>Alias (Ej. Mamá)</label>
                    <input 
                       type="text" 
                       name="alias" 
                       pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+"
                       title="Solo se permiten letras y espacios"
                       value={formData.alias} 
                       onChange={handleChange}
                       placeholder="Nombre corto de referencia"
                       style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box', fontSize: '1.05em' }}
                       required
                       maxLength={50}
                    />
                </div>
                <div className="form-group" style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '1.1em', fontWeight: 'bold', color: '#4a5568' }}>Número de Cuenta</label>
                    <input 
                       type="text" 
                       name="cuenta" 
                       pattern="[0-9]+"
                       title="Solo se permiten números"
                       inputMode="numeric"
                       value={formData.cuenta} 
                       onChange={e => setFormData({ ...formData, cuenta: e.target.value.replace(/\D/g, '') })}
                       placeholder="Ej. 4500123984"
                       style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box', fontSize: '1.05em' }}
                       required
                       maxLength={20}
                    />
                </div>
                <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.15em', transition: 'background 0.2s' }} 
                  onMouseOver={(e) => e.target.style.backgroundColor = 'var(--primary-dark)'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'var(--primary)'}>
                    Guardar Contacto
                </button>
            </form>
        </div>

        {/* Lista */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#2d3748', fontSize: '1.5em' }}>Contactos Guardados</h3>
            {beneficiarios.length === 0 ? (
                <p style={{ color: '#718096', fontStyle: 'italic', textAlign: 'center', marginTop: '40px', fontSize: '1.1em' }}>No hay contactos registrados para este cliente.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '450px', overflowY: 'auto' }}>
                    {beneficiarios.map(b => (
                        <li key={b.id} style={{ padding: '16px', borderBottom: '1px solid #edf2f7', display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ fontSize: '1.25em', color: '#3182ce' }}>#{b.id} - {b.alias_contacto}</strong>
                            <span style={{ fontSize: '1em', color: '#718096', marginTop: '6px' }}>🏦 {b.entidad_nombre}</span>
                            <span style={{ fontSize: '1.05em', color: '#4a5568', marginTop: '4px', fontWeight: '500' }}>💳 {b.numero_cuenta}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
      </div>
    </div>
  );
}
