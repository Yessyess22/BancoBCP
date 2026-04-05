require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const { errorHandler } = require('./middlewares/error.middleware');

const authRoutes       = require('./routes/auth.routes');
const clienteRoutes    = require('./routes/cliente.routes');
const cuentaRoutes     = require('./routes/cuenta.routes');
const transaccionRoutes = require('./routes/transaccion.routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ success: true, data: { database: 'connected', timestamp: new Date().toISOString() } });
  } catch (err) {
    res.status(500).json({ success: false, data: { database: 'disconnected' }, message: err.message });
  }
});

app.use('/api/auth',          authRoutes);
app.use('/api/clientes',      clienteRoutes);
app.use('/api/cuentas',       cuentaRoutes);
app.use('/api/transacciones', transaccionRoutes);

app.use((req, res) => res.status(404).json({ success: false, data: null, message: 'Ruta no encontrada' }));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`BancoBCP Backend en http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});
