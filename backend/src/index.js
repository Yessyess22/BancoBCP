require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const { verifyToken, errorHandler } = require('./middlewares');

const authRoutes       = require('./routes/auth.routes');
const clienteRoutes    = require('./routes/cliente.routes');
const cuentaRoutes     = require('./routes/cuenta.routes');
const transaccionRoutes = require('./routes/transaccion.routes');
const creditoRoutes     = require('./routes/credito.routes');
const reporteRoutes     = require('./routes/reporte.routes');
const parametroRoutes   = require('./routes/parametro.routes');
const beneficiarioRoutes = require('./routes/beneficiarios.routes');
const tarjetaRoutes      = require('./routes/tarjeta.routes');
const reclamoRoutes      = require('./routes/reclamo.routes');
const usuarioRoutes      = require('./routes/usuario.routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Logger manual
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ success: true, data: { database: 'connected', timestamp: new Date().toISOString() } });
  } catch (err) {
    res.status(500).json({ success: false, data: { database: 'disconnected' }, message: err.message });
  }
});

app.use('/api/auth',          authRoutes);
app.use('/api/parametros',    parametroRoutes); // Público para estabilidad de UI
app.use('/api/clientes',      verifyToken, clienteRoutes);
app.use('/api/cuentas',       verifyToken, cuentaRoutes);
app.use('/api/transacciones', verifyToken, transaccionRoutes);
app.use('/api/creditos',      verifyToken, creditoRoutes);
app.use('/api/reportes',      verifyToken, reporteRoutes);
app.use('/api/beneficiarios', verifyToken, beneficiarioRoutes);
app.use('/api/tarjetas',      verifyToken, tarjetaRoutes);
app.use('/api/reclamos',      verifyToken, reclamoRoutes);
app.use('/api/usuarios',      verifyToken, usuarioRoutes);

app.use((req, res) => res.status(404).json({ success: false, data: null, message: 'Ruta no encontrada' }));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`BancoBCP Backend en http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});
