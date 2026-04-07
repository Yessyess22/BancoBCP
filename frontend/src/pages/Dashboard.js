import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Line as LineChart } from 'react-chartjs-2';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function Dashboard() {
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
        // clientes → plain array; cuentas → plain array; transacciones → {success, data}
        const clientesData  = Array.isArray(resClientes.data) ? resClientes.data : (resClientes.data?.data || []);
        const cuentasData   = Array.isArray(resCuentas.data)  ? resCuentas.data  : (resCuentas.data?.data  || []);
        const transData     = Array.isArray(resTrans.data)     ? resTrans.data    : (resTrans.data?.data    || []);
        const total = cuentasData.reduce((acc, c) => acc + parseFloat(c.saldo || 0), 0);
        const dbOk  = resHealth.data?.data?.database === 'connected' || resHealth.data?.status === 'ok';
        setStats({
          clientes:       clientesData.length,
          cuentas:        cuentasData.length,
          transacciones:  transData.length,
          totalSaldo:     total,
          dbStatus:       dbOk ? 'Conectada ✅' : 'Error ⚠️',
        });
        setRecentTx(transData.slice(0, 5));
        setCuentas(cuentasData.slice(0, 3));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const chartData = useMemo(() => ({
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7'],
    datasets: [
      {
        label: 'Depósitos',
        data: [1200, 1900, 1500, 2100, 1800, 2400, 2123],
        borderColor: '#1A237E',
        backgroundColor: 'rgba(26, 35, 126, 0.1)',
        fill: true, tension: 0.4, pointRadius: 4,
        pointBackgroundColor: '#fff', pointBorderColor: '#1A237E', pointBorderWidth: 2,
      },
      {
        label: 'Retiros',
        data: [800, 1100, 950, 1400, 1200, 1600, 1500],
        borderColor: '#F57C00',
        backgroundColor: 'transparent',
        fill: false, tension: 0.4, pointRadius: 0,
      }
    ],
  }), []);

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12 } } },
    scales: {
      y: { grid: { color: '#f0f0f0' }, ticks: { font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}><div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 12px' }}></div><p style={{ color: 'var(--text-secondary)' }}>Cargando panel...</p></div>
    </div>
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Resumen General</h2>
          <p className="page-subtitle">Panel principal del Sistema BancoBCP · BD: {stats.dbStatus}</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-primary">👥</div>
          <div><div className="stat-num">{stats.clientes}</div><div className="stat-label">Clientes Activos</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-blue">💳</div>
          <div><div className="stat-num">{stats.cuentas}</div><div className="stat-label">Cuentas Abiertas</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-yellow">💸</div>
          <div><div className="stat-num">{stats.transacciones}</div><div className="stat-label">Operaciones</div></div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon-wrap stat-icon-primary">💰</div>
          <div>
            <div className="stat-num" style={{ fontSize: 24, letterSpacing: -1 }}>
              Bs. {parseFloat(stats?.totalSaldo || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </div>
            <div className="stat-label">Saldo Total en Custodia</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-left">
          {/* Virtual Card */}
          <div className="card">
            <div className="card-title">Cuenta Virtual BCP</div>
            <div className="bank-card-wrap">
              <div className="bank-card">
                <div className="bank-card-top">
                  <div></div>
                  <div className="bank-card-date">{new Date().toLocaleDateString('es-PE', { month: '2-digit', year: '2-digit' })}</div>
                </div>
                <div className="bank-card-middle">
                   <div className="bank-card-number">**** **** **** 2431</div>
                </div>
                <div className="bank-card-bottom">
                   <div className="bank-card-info">
                     <div className="bank-card-holder">BancoBCP Sistema MIS</div>
                     <div className="bank-card-balance-label">Saldo Total en Custodia</div>
                     <div className="bank-card-balance">Bs. {stats.totalSaldo.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                   </div>
                   <div className="visa-logo">VISA</div>
                </div>
              </div>
              <div className="card-quick-actions">
                <Link to="/transacciones" className="quick-action-btn"><span className="quick-action-icon">💸</span>Transacciones</Link>
                <Link to="/cuentas"       className="quick-action-btn"><span className="quick-action-icon">💳</span>Abrir Cuenta</Link>
                <Link to="/creditos"      className="quick-action-btn"><span className="quick-action-icon">🏦</span>Solicitar Crédito</Link>
                <Link to="/reportes"      className="quick-action-btn"><span className="quick-action-icon">📈</span>Ver Reportes</Link>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card">
            <div className="card-title">
              Transacciones Recientes
              <Link to="/transacciones" className="card-title-action">Ver todas →</Link>
            </div>
            <div className="tx-list">
              {recentTx.length === 0 && <div className="empty-state"><div className="empty-state-icon">💸</div><p>Sin operaciones aún</p></div>}
              {recentTx.map(tx => (
                <div key={tx.id} className="tx-item">
                  <div className="tx-icon" style={{ background: tx.tipo === 'deposito' ? 'var(--primary-light)' : tx.tipo === 'retiro' ? 'var(--danger-light)' : 'var(--info-light)' }}>
                    {tx.tipo === 'deposito' ? '⬆️' : tx.tipo === 'retiro' ? '⬇️' : '↔️'}
                  </div>
                  <div className="tx-info">
                    <div className="tx-name">{tx.tipo.toUpperCase()}</div>
                    <div className="tx-desc">{new Date(tx.created_at).toLocaleString('es-PE')}</div>
                  </div>
                  <div className={`tx-amount ${tx.tipo === 'deposito' ? 'income' : 'expense'}`}>
                    {tx.tipo === 'deposito' ? '+' : '-'}Bs. {parseFloat(tx.monto).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-right">
          {/* Chart */}
          <div className="card" style={{ height: 280 }}>
            <div className="card-title">Actividad Financiera (estimada)</div>
            <div style={{ height: 210 }}>
              <LineChart data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Top Accounts */}
          <div className="card">
            <div className="card-title">
              Cuentas Activas
              <Link to="/cuentas" className="card-title-action">Ver todas →</Link>
            </div>
            {cuentas.length === 0 && <div className="empty-state"><div className="empty-state-icon">💳</div><p>Sin cuentas aún</p></div>}
            {cuentas.map(c => (
              <div key={c.id} className="account-mini" style={{ marginBottom: 10 }}>
                <div className="account-mini-left">
                  <div className="account-mini-name">{c.nombre} {c.apellido}</div>
                  <div className="account-mini-num">{c.numero_cuenta}</div>
                  <div style={{ marginTop: 4 }}>
                    <span className={`badge badge-${c.tipo === 'ahorros' ? 'green' : c.tipo === 'corriente' ? 'blue' : 'yellow'}`} style={{ fontSize: 10 }}>
                      {c.tipo?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="account-mini-balance">Bs. {parseFloat(c.saldo).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
