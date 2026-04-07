import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ user, onLogout }) {
  const location = useLocation();

  const menuItems = [
    { to: '/', label: 'Resumen', icon: '📊', group: 'PRINCIPAL' },
    { to: '/clientes', label: 'Clientes', icon: '👥', group: 'GESTIÓN' },
    { to: '/cuentas', label: 'Cuentas', icon: '💳', group: 'GESTIÓN' },
    { to: '/transacciones', label: 'Transacciones', icon: '💸', group: 'GESTIÓN' },
    { to: '/beneficiarios', label: 'Beneficiarios', icon: '📒', group: 'GESTIÓN' },
    { to: '/creditos', label: 'Créditos', icon: '🏦', group: 'MÓDULOS' },
    { to: '/reportes', label: 'Reportes', icon: '📈', group: 'SISTEMA' },
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
                to={item.to} 
                className={`nav-item ${location.pathname === item.to ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
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
            <div className="user-role">{
              user?.rol === 'admin' ? 'Administrador' :
              user?.rol === 'gerente' ? 'Gerente' :
              user?.rol === 'cajero' ? 'Cajero' : 
              user?.rol || 'Usuario'
            }</div>
          </div>
          <button className="btn-logout" onClick={onLogout} title="Cerrar sesión">🚪</button>
        </div>
      </div>
    </aside>
  );
}
