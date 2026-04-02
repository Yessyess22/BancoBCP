import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ─── Auth Context ─────────────────────────────────────────────────────────────
const AuthContext = React.createContext(null);
function useAuth() { return React.useContext(AuthContext); }

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bcp_user')); } catch { return null; }
  });

  const login = (userData, token) => {
    localStorage.setItem('bcp_token', token);
    localStorage.setItem('bcp_user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('bcp_token');
    localStorage.removeItem('bcp_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('bcp_token');
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

// ─── Protected Route ──────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const menuItems = [
    { to: '/', label: 'Resumen', icon: '📊', group: 'PRINCIPAL' },
    { to: '/clientes', label: 'Clientes', icon: '👥', group: 'GESTIÓN' },
    { to: '/cuentas', label: 'Cuentas', icon: '💳', group: 'GESTIÓN' },
    { to: '/transacciones', label: 'Transacciones', icon: '💸', group: 'GESTIÓN' },
    { to: '/creditos', label: 'Créditos', icon: '🏦', group: 'MÓDULOS', disabled: true },
    { to: '/tarjetas', label: 'Tarjetas', icon: '💰', group: 'MÓDULOS', disabled: true },
    { to: '/reclamos', label: 'Reclamos', icon: '📋', group: 'MÓDULOS', disabled: true },
    { to: '/reportes', label: 'Reportes', icon: '📈', group: 'SISTEMA', disabled: true },
  ];

  const groupedMenu = menuItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-logo">
        <div className="sidebar-logo-icon">🏦</div>
        <div className="sidebar-logo-text"><span>Banco</span>BCP</div>
      </Link>

      <nav className="sidebar-nav">
        {Object.entries(groupedMenu).map(([group, items]) => (
          <div key={group} className="sidebar-section">
            <div className="sidebar-section-label">{group}</div>
            {items.map(item => (
              <Link 
                key={item.to} 
                to={item.disabled ? '#' : item.to} 
                className={`nav-item ${location.pathname === item.to ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.disabled && <span className="nav-badge">Próximo</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="user-avatar">{user?.nombre?.charAt(0) || 'A'}</div>
          <div className="user-info">
            <div className="user-name">{user?.nombre}</div>
            <div className="user-role">{user?.rol === 'admin' ? 'Administrador' : 'Empleado'}</div>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Cerrar sesión">
            🚪
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats] = useState({ clientes: 0, cuentas: 0, transacciones: 0, totalSaldo: 0, dbStatus: '...' });
  const [recentTx, setRecentTx] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [resClientes, resCuentas, resTrans, resHealth] = await Promise.all([
          axios.get(`${API}/clientes`),
          axios.get(`${API}/cuentas`),
          axios.get(`${API}/transacciones`),
          axios.get(`${API}/health`),
        ]);
        
        const total = resCuentas.data.reduce((acc, c) => acc + parseFloat(c.saldo), 0);
        
        setStats({
          clientes: resClientes.data.length,
          cuentas: resCuentas.data.length,
          transacciones: resTrans.data.length,
          totalSaldo: total,
          dbStatus: resHealth.data.status === 'ok' ? 'Conectada' : 'Error',
        });
        
        setRecentTx(resTrans.data.slice(0, 5));
        setCuentas(resCuentas.data.slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const chartData = useMemo(() => ({
    labels: ['1 Mar', '5 Mar', '10 Mar', '15 Mar', '20 Mar', '25 Mar', '31 Mar'],
    datasets: [
      {
        label: 'Ingresos',
        data: [1200, 1900, 1500, 2100, 1800, 2400, 2123],
        borderColor: '#1DB584',
        backgroundColor: 'rgba(29, 181, 132, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#1DB584',
        pointBorderWidth: 2,
      },
      {
        label: 'Gastos',
        data: [800, 1100, 950, 1400, 1200, 1600, 1500],
        borderColor: '#F5A623',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      }
    ],
  }), []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1A2332',
        padding: 10,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
        displayColors: false,
      }
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#9FADBF', font: { size: 10 } } },
      y: { grid: { color: '#E8EDF2', drawBorder: false }, border: { display: false }, ticks: { color: '#9FADBF', font: { size: 10 }, callback: value => '$' + value } }
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><span>Cargando dashboard...</span></div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Resumen General</h2>
          <p className="page-subtitle">Bienvenido al sistema de gestión BancoBCP</p>
        </div>
        <div className="db-status">
          <div className="db-dot"></div>
          Base de datos: {stats.dbStatus}
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-green">👥</div>
          <div>
            <div className="stat-num">{stats.clientes}</div>
            <div className="stat-label">Clientes Activos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-blue">💳</div>
          <div>
            <div className="stat-num">{stats.cuentas}</div>
            <div className="stat-label">Cuentas Abiertas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-yellow">💸</div>
          <div>
            <div className="stat-num">{stats.transacciones}</div>
            <div className="stat-label">Operaciones</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-green">🏦</div>
          <div>
            <div className="stat-num">BCP</div>
            <div className="stat-label">Sistema MIS</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-left">
          <div className="card">
            <div className="card-title">
              Mi Cuenta
              <Link to="/cuentas" className="card-title-action">Ver todas</Link>
            </div>
            <div className="bank-card-wrap">
              <div className="bank-card">
                <div className="bank-card-date">12/26</div>
                <div className="bank-card-number">**** **** **** 2431</div>
                <div className="bank-card-holder">BCP PREMIUM USER</div>
                <div className="bank-card-balance-label">Saldo Disponible</div>
                <div className="bank-card-balance">S/. {stats.totalSaldo?.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
                <div className="visa-logo">VISA</div>
              </div>
              <div className="card-quick-actions">
                <Link to="/transacciones" className="quick-action-btn">
                  <div className="quick-action-icon">💸</div>
                  Transferir
                </Link>
                <Link to="/transacciones" className="quick-action-btn">
                  <div className="quick-action-icon">🧾</div>
                  Pagar Servicio
                </Link>
              </div>
            </div>
          </div>

          <div className="card" style={{ flex: 1 }}>
            <div className="card-title">
              Transacciones Recientes
              <Link to="/transacciones" className="card-title-action">Ver Todo</Link>
            </div>
            <div className="tx-list">
              {recentTx.length === 0 ? (
                <div className="empty-state"><p>No hay movimientos recientes</p></div>
              ) : recentTx.map(tx => (
                <div key={tx.id} className="tx-item">
                  <div className={`tx-icon ${tx.tipo === 'deposito' ? 'stat-icon-green' : tx.tipo === 'retiro' ? 'stat-icon-red' : 'stat-icon-blue'}`}>
                    {tx.tipo === 'deposito' ? '📥' : tx.tipo === 'retiro' ? '📤' : '🔄'}
                  </div>
                  <div className="tx-info">
                    <div className="tx-name">{tx.descripcion || tx.tipo.toUpperCase()}</div>
                    <div className="tx-desc">{new Date(tx.created_at).toLocaleDateString('es-PE')} • {tx.cuenta_origen || 'Efectivo'}</div>
                  </div>
                  <div className={`tx-amount ${tx.tipo === 'deposito' ? 'income' : 'expense'}`}>
                    {tx.tipo === 'deposito' ? '+' : '-'} S/. {parseFloat(tx.monto).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-right">
          <div className="card" style={{ minHeight: '300px' }}>
            <div className="chart-header">
              <div className="chart-title">Movimiento Mensual</div>
              <div className="chart-period">1 Mar - 31 Mar 21</div>
            </div>
            <div style={{ height: '200px', position: 'relative' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
            <div className="summary-row" style={{ marginTop: '20px' }}>
              <div className="summary-card stat-icon-green" style={{ border: 'none' }}>
                <div className="summary-card-icon">📈</div>
                <div className="summary-card-label">Ingresos del Mes</div>
                <div className="summary-card-amount">S/. 2,123.00</div>
              </div>
              <div className="summary-card stat-icon-yellow" style={{ border: 'none' }}>
                <div className="summary-card-icon">📉</div>
                <div className="summary-card-label">Gastos del Mes</div>
                <div className="summary-card-amount">S/. 1,500.00</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Mis Cuentas</div>
            <div className="spend-list">
              {cuentas.map(c => (
                <div key={c.id} className="account-mini">
                  <div className="account-mini-left">
                    <div className="account-mini-name">{c.tipo === 'ahorros' ? 'Cuenta Ahorros' : 'Cuenta Corriente'}</div>
                    <div className="account-mini-num">{c.numero_cuenta}</div>
                    <div className="account-progress">
                      <div className="account-progress-bar">
                        <div className="account-progress-fill" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="account-mini-balance">S/. {parseFloat(c.saldo).toLocaleString('es-PE')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Clientes Page ────────────────────────────────────────────────────────────
function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ dni: '', nombre: '', apellido: '', email: '', telefono: '', direccion: '', fecha_nacimiento: '' });

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/clientes`);
      setClientes(res.data);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => { fetchClientes(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/clientes`, form);
      setMsg('✅ Cliente registrado exitosamente');
      setShowForm(false);
      setForm({ dni: '', nombre: '', apellido: '', email: '', telefono: '', direccion: '', fecha_nacimiento: '' });
      fetchClientes();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'Error al registrar'));
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este cliente?')) return;
    try {
      await axios.delete(`${API}/clientes/${id}`);
      fetchClientes();
    } catch(err) {
      alert('Error: ' + (err.response?.data?.error || 'No se pudo eliminar'));
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Gestión de Clientes</h2>
          <p className="page-subtitle">Administra la base de datos de clientes del banco</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '➕ Nuevo Cliente'}
        </button>
      </div>

      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-title">Registrar nuevo cliente</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group"><label>DNI *</label><input value={form.dni} onChange={e => setForm({...form, dni: e.target.value})} placeholder="Ej: 70123456" required /></div>
              <div className="form-group"><label>Nombres *</label><input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Juan" required /></div>
              <div className="form-group"><label>Apellidos *</label><input value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} placeholder="Ej: Pérez" required /></div>
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="juan@gmail.com" /></div>
              <div className="form-group"><label>Teléfono</label><input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="Ej: 999123456" /></div>
              <div className="form-group"><label>Fecha de Nacimiento</label><input type="date" value={form.fecha_nacimiento} onChange={e => setForm({...form, fecha_nacimiento: e.target.value})} /></div>
            </div>
            <div className="form-group" style={{ marginTop: '14px' }}><label>Dirección</label><input value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} placeholder="Dirección completa" /></div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">Guardar Cliente</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-title">Lista de Clientes ({clientes.length})</div>
        {loading ? <div className="loading-container"><div className="spinner"></div></div> : (
          <div className="table-container">
            <table>
              <thead><tr><th>DNI</th><th>Nombre completo</th><th>Contacto</th><th>Registro</th><th style={{ textAlign: 'right' }}>Acciones</th></tr></thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#9FADBF' }}>No hay clientes registrados en el sistema</td></tr>
                ) : clientes.map(c => (
                  <tr key={c.id}>
                    <td><span className="badge badge-blue">{c.dni}</span></td>
                    <td><div style={{ fontWeight: 600 }}>{c.nombre} {c.apellido}</div><div style={{ fontSize: '11px', color: '#6B7A8D' }}>{c.email || 'Sin email'}</div></td>
                    <td>{c.telefono || '—'}</td>
                    <td>{new Date(c.created_at).toLocaleDateString('es-PE')}</td>
                    <td style={{ textAlign: 'right' }}><button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>🗑️</button></td>
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

// ─── Cuentas Page ─────────────────────────────────────────────────────────────
function CuentasPage() {
  const [cuentas, setCuentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ cliente_id: '', tipo: 'ahorros', saldo_inicial: '', moneda: 'PEN' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resCuentas, resClientes] = await Promise.all([axios.get(`${API}/cuentas`), axios.get(`${API}/clientes`)]);
      setCuentas(resCuentas.data); setClientes(resClientes.data);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/cuentas`, form);
      setMsg('✅ Cuenta creada exitosamente');
      setShowForm(false);
      setForm({ cliente_id: '', tipo: 'ahorros', saldo_inicial: '', moneda: 'PEN' });
      fetchData();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'Error al crear cuenta'));
    }
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Cuentas Bancarias</h2>
          <p className="page-subtitle">Apertura y gestión de cuentas de clientes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '➕ Nueva Cuenta'}
        </button>
      </div>

      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-title">Abrir nueva cuenta</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Cliente Titular *</label>
                <select value={form.cliente_id} onChange={e => setForm({...form, cliente_id: e.target.value})} required>
                  <option value="">-- Seleccionar cliente --</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido} ({c.dni})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo de Cuenta</label>
                <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
                  <option value="ahorros">Cuenta de Ahorros</option>
                  <option value="corriente">Cuenta Corriente</option>
                </select>
              </div>
              <div className="form-group"><label>Saldo Inicial (S/.)</label><input type="number" min="0" step="0.01" value={form.saldo_inicial} onChange={e => setForm({...form, saldo_inicial: e.target.value})} placeholder="0.00" /></div>
              <div className="form-group">
                <label>Moneda</label>
                <select value={form.moneda} onChange={e => setForm({...form, moneda: e.target.value})}>
                  <option value="PEN">PEN (Soles)</option>
                  <option value="USD">USD (Dólares)</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary">Aperturar Cuenta</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-title">Cuentas Activas ({cuentas.length})</div>
        {loading ? <div className="loading-container"><div className="spinner"></div></div> : (
          <div className="table-container">
            <table>
              <thead><tr><th>Número de Cuenta</th><th>Cliente</th><th>Tipo</th><th>Moneda</th><th>Saldo</th><th>Apertura</th></tr></thead>
              <tbody>
                {cuentas.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#9FADBF' }}>No hay cuentas registradas</td></tr>
                ) : cuentas.map(c => (
                  <tr key={c.id}>
                    <td><code style={{ color: '#E84142', fontWeight: 600 }}>{c.numero_cuenta}</code></td>
                    <td>{c.nombre} {c.apellido}</td>
                    <td><span className={`badge ${c.tipo === 'ahorros' ? 'badge-green' : 'badge-blue'}`}>{c.tipo.toUpperCase()}</span></td>
                    <td>{c.moneda}</td>
                    <td><strong style={{ fontSize: '14px' }}>{parseFloat(c.saldo).toFixed(2)}</strong></td>
                    <td>{new Date(c.created_at).toLocaleDateString('es-PE')}</td>
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

// ─── Transacciones Page ───────────────────────────────────────────────────────
function TransaccionesPage() {
  const [transacciones, setTransacciones] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState('deposito');
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ cuenta_origen_id: '', cuenta_destino_id: '', monto: '', descripcion: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resTrans, resCuentas] = await Promise.all([axios.get(`${API}/transacciones`), axios.get(`${API}/cuentas`)]);
      setTransacciones(resTrans.data); setCuentas(resCuentas.data);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/transacciones/${tipo}`, form);
      setMsg(`✅ ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrado exitosamente`);
      setShowForm(false);
      setForm({ cuenta_origen_id: '', cuenta_destino_id: '', monto: '', descripcion: '' });
      fetchData();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'Error en la operación'));
    }
    setTimeout(() => setMsg(''), 4000);
  };

  const tipoLabel = { deposito: '📥 Depósito', retiro: '📤 Retiro', transferencia: '🔄 Transferencia' };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Transacciones</h2>
          <p className="page-subtitle">Registro de movimientos y transferencias</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '➕ Nueva Transacción'}
        </button>
      </div>

      {msg && <div className={`alert ${msg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-title">Nueva Operación Bancaria</div>
          <div className="type-toggle-group">
            {['deposito', 'retiro', 'transferencia'].map(t => (
              <button key={t} type="button" className={`type-toggle-btn ${tipo === t ? 'active' : ''}`} onClick={() => setTipo(t)}>{tipoLabel[t]}</button>
            ))}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {(tipo === 'retiro' || tipo === 'transferencia') && (
                <div className="form-group">
                  <label>Cuenta de Origen *</label>
                  <select value={form.cuenta_origen_id} onChange={e => setForm({...form, cuenta_origen_id: e.target.value})} required>
                    <option value="">-- Seleccionar cuenta --</option>
                    {cuentas.map(c => <option key={c.id} value={c.id}>{c.numero_cuenta} ({c.nombre}) - S/. {parseFloat(c.saldo).toFixed(2)}</option>)}
                  </select>
                </div>
              )}
              {(tipo === 'deposito' || tipo === 'transferencia') && (
                <div className="form-group">
                  <label>Cuenta de Destino *</label>
                  <select value={form.cuenta_destino_id} onChange={e => setForm({...form, cuenta_destino_id: e.target.value})} required>
                    <option value="">-- Seleccionar cuenta --</option>
                    {cuentas.map(c => <option key={c.id} value={c.id}>{c.numero_cuenta} ({c.nombre})</option>)}
                  </select>
                </div>
              )}
              <div className="form-group"><label>Monto de la Operación *</label><input type="number" min="0.01" step="0.01" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} placeholder="S/. 0.00" required /></div>
              <div className="form-group"><label>Concepto / Glosa</label><input value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Ej: Pago de haberes" /></div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary">Procesar Transacción</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-title">Historial de Operaciones ({transacciones.length})</div>
        {loading ? <div className="loading-container"><div className="spinner"></div></div> : (
          <div className="table-container">
            <table>
              <thead><tr><th>ID</th><th>Tipo</th><th>Origen</th><th>Destino</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr></thead>
              <tbody>
                {transacciones.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#9FADBF' }}>No hay transacciones registradas</td></tr>
                ) : transacciones.map(t => (
                  <tr key={t.id}>
                    <td><span style={{ color: '#9FADBF', fontSize: '11px' }}>#{t.id}</span></td>
                    <td><span className={`badge ${t.tipo === 'deposito' ? 'badge-green' : t.tipo === 'retiro' ? 'badge-red' : 'badge-blue'}`}>{t.tipo.toUpperCase()}</span></td>
                    <td>{t.cuenta_origen || <em style={{ color: '#9FADBF' }}>Efectivo</em>}</td>
                    <td>{t.cuenta_destino || <em style={{ color: '#9FADBF' }}>Efectivo</em>}</td>
                    <td><strong style={{ fontSize: '14px' }}>S/. {parseFloat(t.monto).toFixed(2)}</strong></td>
                    <td><span className="badge badge-green">COMPLETADO</span></td>
                    <td>{new Date(t.created_at).toLocaleString('es-PE')}</td>
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

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API}/auth/login`, form);
      login(res.data.user, res.data.token);
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
            <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="Ej: admin" required />
          </div>
          <div className="form-group" style={{ marginTop: '14px' }}>
            <label>Contraseña</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? 'Validando...' : 'Ingresar al Sistema'}
          </button>
        </form>
        <div className="login-hint">
          Demo: admin / admin123
        </div>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="app-layout">
                <Sidebar />
                <main className="main-area">
                  <header className="topbar">
                    <div className="topbar-title">Banco de Crédito BCP <span style={{ color: '#1DB584', marginLeft: '8px', fontSize: '10px', fontWeight: 800 }}>V2.1</span></div>
                    <div className="topbar-right">
                      <div className="topbar-date">{new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                  </header>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/clientes" element={<ClientesPage />} />
                    <Route path="/cuentas" element={<CuentasPage />} />
                    <Route path="/transacciones" element={<TransaccionesPage />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
