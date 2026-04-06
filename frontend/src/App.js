import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import 'chart.js/auto';

// Componentes y Páginas
import Sidebar from './components/Sidebar';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientesPage from './pages/Clientes';
import CuentasPage from './pages/Cuentas';
import TransaccionesPage from './pages/Transacciones';
import CreditosPage from './pages/Creditos';
import ReportesPage from './pages/Reportes';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// --- Auth Context ---
const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('bcp_user');
    const token = localStorage.getItem('bcp_token');
    if (token) {
      console.log('Token encontrado en init:', token.substring(0, 15) + '...');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    try { return savedUser ? JSON.parse(savedUser) : null; } catch { return null; }
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

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

// --- Parameter Context ---
const ParamContext = createContext({ ubicaciones: [], tiposCuenta: [], monedas: [], refresh: () => {} });
export function useParams() { return useContext(ParamContext); }

function ParamProvider({ children }) {
  const { user } = useAuth();
  const [params, setParams] = useState({ ubicaciones: [], tiposCuenta: [], monedas: [] });

  const fetchParams = async () => {
    // Si la ruta es pública, no necesitamos esperar al usuario para la estabilidad de la UI
    console.log('[DEBUG] Intentando cargar parámetros desde:', `${API}/parametros/`);
    try {
      const [u, t, m] = await Promise.all([
        axios.get(`${API}/parametros/ubicaciones`),
        axios.get(`${API}/parametros/tipos-cuenta`),
        axios.get(`${API}/parametros/monedas`),
      ]);
      console.log('[DEBUG] Parámetros cargados con éxito:', {
        ubicaciones: u.data.length,
        tiposCuenta: t.data.length,
        monedas: m.data.length
      });
      setParams({ ubicaciones: u.data, tiposCuenta: t.data, monedas: m.data });
    } catch (err) {
      console.error('[ERROR] Fallo crítico al cargar parámetros:', {
        url: API,
        status: err.response?.status,
        text: err.response?.statusText,
        msg: err.message
      });
    }
  };

  useEffect(() => { 
    fetchParams(); 
  }, [user]); // Re-intentar si el usuario cambia (por si acaso), pero corre siempre al inicio.

  return <ParamContext.Provider value={{ ...params, refresh: fetchParams }}>{children}</ParamContext.Provider>;
}


function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={login} />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <div className="app-layout">
            <Sidebar user={user} onLogout={handleLogout} />
            <main className="main-area">
              <header className="topbar">
                <div className="topbar-title">
                  <b>Banco de Crédito BCP</b>
                  <span>SISTEMA INTEGRADO V3.0</span>
                </div>
                <div className="topbar-right">
                  <div className="topbar-date">{new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
              </header>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/clientes" element={<ClientesPage />} />
                <Route path="/cuentas" element={<CuentasPage />} />
                <Route path="/transacciones" element={<TransaccionesPage />} />
                <Route path="/creditos" element={<CreditosPage />} />
                <Route path="/reportes" element={<ReportesPage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ParamProvider>
        <Router>
          <AppContent />
        </Router>
      </ParamProvider>
    </AuthProvider>
  );
}
