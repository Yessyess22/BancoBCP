-- ============================================
-- BancoBCP - Inicialización de Base de Datos
-- ============================================

-- Tabla de usuarios del sistema (empleados/admins)
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(20) DEFAULT 'empleado' CHECK (rol IN ('admin', 'empleado')),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de clientes del banco
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  dni VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE,
  telefono VARCHAR(20),
  direccion TEXT,
  fecha_nacimiento DATE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de cuentas bancarias
CREATE TABLE IF NOT EXISTS cuentas (
  id SERIAL PRIMARY KEY,
  numero_cuenta VARCHAR(20) UNIQUE NOT NULL,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  tipo VARCHAR(20) DEFAULT 'ahorros' CHECK (tipo IN ('ahorros', 'corriente')),
  saldo DECIMAL(15, 2) DEFAULT 0.00,
  moneda VARCHAR(5) DEFAULT 'PEN',
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de transacciones
CREATE TABLE IF NOT EXISTS transacciones (
  id SERIAL PRIMARY KEY,
  cuenta_origen_id INTEGER REFERENCES cuentas(id),
  cuenta_destino_id INTEGER REFERENCES cuentas(id),
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('deposito', 'retiro', 'transferencia')),
  monto DECIMAL(15, 2) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(20) DEFAULT 'completado' CHECK (estado IN ('pendiente', 'completado', 'fallido')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usuario admin por defecto (password: admin123)
INSERT INTO usuarios (username, nombre, email, password, rol)
VALUES ('admin', 'Administrador', 'admin@bancocbp.pe', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (email) DO NOTHING;
