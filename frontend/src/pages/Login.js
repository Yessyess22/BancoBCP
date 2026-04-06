import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API}/auth/login`, form);
      onLogin(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error de autenticación. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-blob-1"></div>
      <div className="login-blob-2"></div>
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🏦</div>
          <h1>Banco<span>BCP</span></h1>
          <p>Portal Interno de Gestión</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre de Usuario</label>
            <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="admin" required />
          </div>
          <div className="form-group" style={{ marginTop: '14px' }}>
            <label>Contraseña</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? 'Validando...' : 'Ingresar al Sistema'}
          </button>
        </form>
        <div className="login-hint">Demo: admin / admin123</div>
      </div>
    </div>
  );
}
