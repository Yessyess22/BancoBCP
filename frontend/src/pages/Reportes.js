import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TABS = ['Resumen', 'Cuentas', 'Transacciones', 'Créditos'];

export default function ReportesPage() {
  const [stats, setStats]         = useState(null);
  const [recentTx, setRecentTx]   = useState([]);
  const [consolidated, setConsolidated] = useState({ cuentas: [], transacciones: [], creditos: [] });
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('Resumen');
  const [pdfLoading, setPdfLoading] = useState(false);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [resDash, resCons] = await Promise.all([
        axios.get(`${API}/reportes/dashboard`),
        axios.get(`${API}/reportes/consolidado`),
      ]);
      setStats(resDash.data?.data?.stats || resDash.data?.data || {});
      setRecentTx(resDash.data?.data?.recent || []);
      setConsolidated(resCons.data?.data || { cuentas: [], transacciones: [], creditos: [] });
    } catch (err) {
      console.error('Reportes fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Resetear página al cambiar de pestaña
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const generatePDF = async () => {
    setPdfLoading(true);
    try {
      const { cuentas, transacciones, creditos } = consolidated;
      const doc = new jsPDF();

      // ── Header
      doc.setFillColor(0, 123, 255);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('BancoBCP — Reporte Consolidado MIS', 14, 18);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 14, 26);
      doc.setTextColor(0, 0, 0);

      // ── KPIs
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Indicadores Clave', 14, 40);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.text(`Total Clientes: ${stats?.total_clientes || 0}`, 14, 48);
      doc.text(`Saldo Total (Ref. Bs.): ${parseFloat(stats?.saldo_total || 0).toFixed(2)}`, 80, 48);
      doc.text(`Créditos Aprobados: ${stats?.creditos_activos || 0}`, 14, 55);
      doc.text(`Cartera Créditos (Ref. Bs.): ${parseFloat(stats?.cartera_creditos || 0).toFixed(2)}`, 80, 55);

      // ── Cuentas
      doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text('Cuentas Bancarias', 14, 68);
      autoTable(doc, {
        startY: 70,
        head: [['Número Cuenta', 'Titular', 'Tipo', 'Saldo', 'Moneda', 'Estado']],
        body: (cuentas || []).map(c => [
          c.numero_cuenta,
          `${c.nombre} ${c.apellido}`,
          c.tipo?.toUpperCase(),
          `${c.simbolo || 'Bs.'} ${parseFloat(c.saldo).toFixed(2)}`,
          c.moneda,
          c.activa ? 'ACTIVA' : 'SUSPENDIDA',
        ]),
        headStyles: { fillColor: [0, 123, 255], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 250, 255] },
      });

      // ── Transacciones
      const y1 = (doc.lastAutoTable?.finalY || 70) + 10;
      doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text('Historial de Transacciones', 14, y1);
      autoTable(doc, {
        startY: y1 + 2,
        head: [['ID', 'Tipo', 'Origen', 'Destino', 'Monto', 'Fecha']],
        body: (transacciones || []).slice(0, 100).map(t => [
          `#${t.id}`,
          t.tipo?.toUpperCase(),
          t.origen || 'Efectivo',
          t.destino || 'Efectivo',
          `${t.simbolo || 'Bs.'} ${parseFloat(t.monto).toFixed(2)}`,
          new Date(t.created_at).toLocaleDateString('es-PE'),
        ]),
        headStyles: { fillColor: [74, 144, 217], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [240, 247, 255] },
      });

      // ── Creditos (nueva página)
      doc.addPage();
      doc.setFillColor(0, 123, 255);
      doc.rect(0, 0, 210, 14, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text('BancoBCP · Créditos y Financiamientos', 14, 10);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text('Estado de Créditos', 14, 26);
      autoTable(doc, {
        startY: 28,
        head: [['Cliente', 'DNI', 'Monto Solicitado', 'Monto Aprobado', 'Plazo', 'Tasa', 'Estado']],
        body: (creditos || []).map(c => [
          `${c.nombre} ${c.apellido}`,
          c.dni || '—',
          `Bs. ${parseFloat(c.monto_solicitado).toFixed(2)}`,
          c.monto_aprobado ? `Bs. ${parseFloat(c.monto_aprobado).toFixed(2)}` : '—',
          `${c.plazo_meses} meses`,
          `${(parseFloat(c.tasa_interes) * 100).toFixed(1)}%`,
          c.estado?.toUpperCase(),
        ]),
        headStyles: { fillColor: [245, 166, 35], textColor: [255, 255, 255], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [255, 251, 240] },
      });

      doc.save('BCP_Reporte_General.pdf');
    } catch (err) {
      alert('Error generando PDF: ' + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  // Lógica de paginación por pestaña
  const getPaginatedData = (data) => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginated = data.slice(startIndex, startIndex + pageSize);
    return { paginated, totalItems, totalPages };
  };

  const renderPagination = (totalItems, totalPages) => {
    if (totalPages <= 1) return null;
    return (
      <div className="pagination-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, padding: '0 10px' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({totalItems} resultados)
        </div>
        <div className="pagination-buttons" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm btn-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>⬅️ Anterior</button>
          <button className="btn btn-sm btn-secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Siguiente ➡️</button>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 12px' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando datos del sistema...</p>
      </div>
    </div>
  );

  const { cuentas, transacciones, creditos } = consolidated;
  const estadoBadge = (e) => e === 'aprobado' ? 'green' : e === 'rechazado' ? 'red' : 'blue';

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h2>Panel de Reportes MIS</h2>
          <p className="page-subtitle">Información consolidada en tiempo real — {new Date().toLocaleString('es-PE')}</p>
        </div>
        <button className="btn btn-primary" onClick={generatePDF} disabled={pdfLoading}>
          {pdfLoading ? '⏳ Generando...' : '📄 Descargar PDF'}
        </button>
      </div>

      <div className="stats-row" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-primary">👥</div>
          <div><div className="stat-num">{stats?.total_clientes || 0}</div><div className="stat-label">Total Clientes</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-blue">💰</div>
          <div>
            <div className="stat-num" style={{ fontSize: 16 }}>
              Bs. {parseFloat(stats?.saldo_total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </div>
            <div className="stat-label">Saldos en Custodia</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-yellow">📈</div>
          <div>
            <div className="stat-num" style={{ fontSize: 16 }}>
              Bs. {parseFloat(stats?.cartera_creditos || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </div>
            <div className="stat-label">Cartera Créditos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap stat-icon-primary">✅</div>
          <div><div className="stat-num">{stats?.creditos_activos || 0}</div><div className="stat-label">Créditos Aprobados</div></div>
        </div>
      </div>

      <div className="type-toggle-group" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t} className={`type-toggle-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'Resumen' ? '📊' : t === 'Cuentas' ? '💳' : t === 'Transacciones' ? '💸' : '🏦'} {t}
          </button>
        ))}
      </div>

      {activeTab === 'Resumen' && (() => {
        const { paginated, totalItems, totalPages } = getPaginatedData(recentTx);
        return (
          <div className="card">
            <div className="card-title">Últimas Transacciones del Sistema</div>
            <div className="table-container">
              <table>
                <thead><tr><th>Tipo</th><th>Cuenta Origen</th><th>Cuenta Destino</th><th>Monto</th><th>Fecha</th></tr></thead>
                <tbody>
                  {paginated.length === 0
                    ? <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Sin transacciones recientes</td></tr>
                    : paginated.map(t => (
                    <tr key={t.id}>
                      <td><span className={`badge badge-${t.tipo === 'deposito' ? 'green' : t.tipo === 'retiro' ? 'red' : 'blue'}`}>{t.tipo?.toUpperCase()}</span></td>
                      <td>{t.origen || <em style={{ color: 'var(--text-muted)' }}>Efectivo</em>}</td>
                      <td>{t.destino || <em style={{ color: 'var(--text-muted)' }}>Efectivo</em>}</td>
                      <td><strong>{t.simbolo || 'Bs.'} {parseFloat(t.monto).toFixed(2)}</strong></td>
                      <td>{new Date(t.created_at).toLocaleString('es-PE')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination(totalItems, totalPages)}
          </div>
        );
      })()}

      {activeTab === 'Cuentas' && (() => {
        const { paginated, totalItems, totalPages } = getPaginatedData(cuentas);
        return (
          <div className="card">
            <div className="card-title">Cuentas Bancarias ({totalItems})</div>
            <div className="table-container">
              <table>
                <thead><tr><th>Número</th><th>Titular</th><th>Tipo</th><th>Saldo</th><th>Moneda</th><th>Estado</th></tr></thead>
                <tbody>
                  {paginated.length === 0
                    ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Sin cuentas</td></tr>
                    : paginated.map(c => (
                    <tr key={c.id}>
                      <td><code>{c.numero_cuenta}</code></td>
                      <td>{c.nombre} {c.apellido}</td>
                      <td><span className={`badge badge-${c.tipo === 'ahorros' ? 'green' : c.tipo === 'corriente' ? 'blue' : 'yellow'}`}>{c.tipo?.toUpperCase()}</span></td>
                      <td><strong>{c.simbolo || 'Bs.'} {parseFloat(c.saldo).toFixed(2)}</strong></td>
                      <td>{c.moneda}</td>
                      <td><span className={`badge badge-${c.activa ? 'green' : 'red'}`}>{c.activa ? 'ACTIVA' : 'SUSPENDIDA'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination(totalItems, totalPages)}
          </div>
        );
      })()}

      {activeTab === 'Transacciones' && (() => {
        const { paginated, totalItems, totalPages } = getPaginatedData(transacciones);
        return (
          <div className="card">
            <div className="card-title">Historial Completo de Transacciones ({totalItems})</div>
            <div className="table-container">
              <table>
                <thead><tr><th>ID</th><th>Tipo</th><th>Origen</th><th>Destino</th><th>Monto</th><th>Fecha</th></tr></thead>
                <tbody>
                  {paginated.length === 0
                    ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Sin transacciones</td></tr>
                    : paginated.map(t => (
                    <tr key={t.id}>
                      <td><span className="badge badge-gray">#{t.id}</span></td>
                      <td><span className={`badge badge-${t.tipo === 'deposito' ? 'green' : t.tipo === 'retiro' ? 'red' : 'blue'}`}>{t.tipo?.toUpperCase()}</span></td>
                      <td>{t.origen || <em style={{ color: 'var(--text-muted)' }}>Efectivo</em>}</td>
                      <td>{t.destino || <em style={{ color: 'var(--text-muted)' }}>Efectivo</em>}</td>
                      <td><strong>{t.simbolo || 'Bs.'} {parseFloat(t.monto).toFixed(2)}</strong></td>
                      <td>{new Date(t.created_at).toLocaleString('es-PE')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination(totalItems, totalPages)}
          </div>
        );
      })()}

      {activeTab === 'Créditos' && (() => {
        const { paginated, totalItems, totalPages } = getPaginatedData(creditos);
        return (
          <div className="card">
            <div className="card-title">Estado de Créditos y Financiamientos ({totalItems})</div>
            <div className="table-container">
              <table>
                <thead><tr><th>ID</th><th>Cliente</th><th>Solicitado</th><th>Aprobado</th><th>Plazo</th><th>Tasa</th><th>Estado</th></tr></thead>
                <tbody>
                  {paginated.length === 0
                    ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Sin créditos</td></tr>
                    : paginated.map(c => (
                    <tr key={c.id}>
                      <td><span className="badge badge-gray">#{c.id}</span></td>
                      <td>{c.nombre} {c.apellido}</td>
                      <td>Bs. {parseFloat(c.monto_solicitado).toFixed(2)}</td>
                      <td>{c.monto_aprobado ? <strong style={{ color: 'var(--primary)' }}>Bs. {parseFloat(c.monto_aprobado).toFixed(2)}</strong> : <em style={{ color: 'var(--text-muted)' }}>—</em>}</td>
                      <td>{c.plazo_meses} meses</td>
                      <td>{(parseFloat(c.tasa_interes) * 100).toFixed(1)}%</td>
                      <td><span className={`badge badge-${estadoBadge(c.estado)}`}>{c.estado?.toUpperCase()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination(totalItems, totalPages)}
          </div>
        );
      })()}
    </div>
  );
}
