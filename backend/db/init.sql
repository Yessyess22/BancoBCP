-- BancoBCP - Esquema 3FN (18 tablas)
-- Extensiones
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ENUMs
CREATE TYPE nivel_ubicacion   AS ENUM ('pais', 'departamento', 'ciudad');
CREATE TYPE tipo_tarjeta       AS ENUM ('debito', 'credito');
CREATE TYPE estado_tarjeta     AS ENUM ('activa', 'bloqueada', 'cancelada', 'vencida');
CREATE TYPE estado_credito     AS ENUM ('solicitado', 'aprobado', 'rechazado', 'activo', 'pagado', 'mora');
CREATE TYPE estado_cuota       AS ENUM ('pendiente', 'pagado', 'vencido');
CREATE TYPE estado_reclamo     AS ENUM ('abierto', 'en_proceso', 'resuelto', 'cerrado');
CREATE TYPE tipo_movimiento_tj AS ENUM ('compra', 'retiro', 'pago', 'devolucion', 'cargo');
CREATE TYPE tipo_transaccion   AS ENUM ('deposito', 'retiro', 'transferencia');
CREATE TYPE estado_transaccion AS ENUM ('pendiente', 'completado', 'fallido');
CREATE TYPE nivel_auditoria    AS ENUM ('info', 'warn', 'error');

-- 1. ubicacion
CREATE TABLE IF NOT EXISTS ubicacion (
  id       SERIAL PRIMARY KEY,
  nombre   VARCHAR(100) NOT NULL,
  nivel    nivel_ubicacion NOT NULL,
  padre_id INTEGER REFERENCES ubicacion(id),
  codigo   VARCHAR(10),
  activo   BOOLEAN DEFAULT TRUE
);

-- 2. tipos_cuenta
CREATE TABLE IF NOT EXISTS tipos_cuenta (
  id          SERIAL PRIMARY KEY,
  codigo      VARCHAR(20) UNIQUE NOT NULL,
  descripcion VARCHAR(100) NOT NULL,
  activo      BOOLEAN DEFAULT TRUE
);

-- 3. monedas
CREATE TABLE IF NOT EXISTS monedas (
  id       SERIAL PRIMARY KEY,
  codigo   VARCHAR(5) UNIQUE NOT NULL,
  nombre   VARCHAR(50) NOT NULL,
  simbolo  VARCHAR(5) NOT NULL,
  activo   BOOLEAN DEFAULT TRUE
);

-- 4. roles
CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(50) UNIQUE NOT NULL,
  descripcion VARCHAR(200),
  activo      BOOLEAN DEFAULT TRUE
);

-- 5. permisos
CREATE TABLE IF NOT EXISTS permisos (
  id          SERIAL PRIMARY KEY,
  codigo      VARCHAR(80) UNIQUE NOT NULL,
  descripcion VARCHAR(200),
  modulo      VARCHAR(50)
);

-- 6. rol_permisos
CREATE TABLE IF NOT EXISTS rol_permisos (
  rol_id     INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permiso_id INTEGER NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
  PRIMARY KEY (rol_id, permiso_id)
);

-- 7. usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id         SERIAL PRIMARY KEY,
  username   CITEXT UNIQUE NOT NULL,
  nombre     VARCHAR(100) NOT NULL,
  email      CITEXT UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  rol        VARCHAR(20) DEFAULT 'empleado' CHECK (rol IN ('admin', 'empleado')),
  activo     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. usuario_roles
CREATE TABLE IF NOT EXISTS usuario_roles (
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol_id     INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  asignado_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (usuario_id, rol_id)
);

-- 9. clientes
CREATE TABLE IF NOT EXISTS clientes (
  id               SERIAL PRIMARY KEY,
  dni              VARCHAR(20) UNIQUE NOT NULL,
  nombre           VARCHAR(100) NOT NULL,
  apellido         VARCHAR(100) NOT NULL,
  email            CITEXT UNIQUE,
  telefono         VARCHAR(20),
  direccion        TEXT,
  fecha_nacimiento DATE,
  ubicacion_id     INTEGER REFERENCES ubicacion(id),
  activo           BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- 10. cuentas
CREATE TABLE IF NOT EXISTS cuentas (
  id             SERIAL PRIMARY KEY,
  numero_cuenta  VARCHAR(20) UNIQUE NOT NULL,
  cliente_id     INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo_cuenta_id INTEGER REFERENCES tipos_cuenta(id),
  moneda_id      INTEGER REFERENCES monedas(id),
  saldo          DECIMAL(15, 2) DEFAULT 0.00 CHECK (saldo >= 0),
  activa         BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

-- 11. transacciones
CREATE TABLE IF NOT EXISTS transacciones (
  id                SERIAL PRIMARY KEY,
  cuenta_origen_id  INTEGER REFERENCES cuentas(id),
  cuenta_destino_id INTEGER REFERENCES cuentas(id),
  tipo              tipo_transaccion NOT NULL,
  monto             DECIMAL(15, 2) NOT NULL CHECK (monto > 0),
  descripcion       TEXT,
  estado            estado_transaccion DEFAULT 'completado',
  usuario_id        INTEGER REFERENCES usuarios(id),
  created_at        TIMESTAMP DEFAULT NOW()
);

-- 12. creditos
CREATE TABLE IF NOT EXISTS creditos (
  id              SERIAL PRIMARY KEY,
  cliente_id      INTEGER NOT NULL REFERENCES clientes(id),
  cuenta_id       INTEGER REFERENCES cuentas(id),
  monto_solicitado DECIMAL(15, 2) NOT NULL CHECK (monto_solicitado > 0),
  monto_aprobado  DECIMAL(15, 2),
  tasa_interes    DECIMAL(5, 4) NOT NULL,
  plazo_meses     INTEGER NOT NULL CHECK (plazo_meses > 0),
  estado          estado_credito DEFAULT 'solicitado',
  fecha_solicitud DATE DEFAULT CURRENT_DATE,
  fecha_aprobacion DATE,
  usuario_aprueba INTEGER REFERENCES usuarios(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- 13. cuotas_credito
CREATE TABLE IF NOT EXISTS cuotas_credito (
  id               SERIAL PRIMARY KEY,
  credito_id       INTEGER NOT NULL REFERENCES creditos(id) ON DELETE CASCADE,
  numero_cuota     INTEGER NOT NULL,
  monto_cuota      DECIMAL(15, 2) NOT NULL,
  monto_capital    DECIMAL(15, 2) NOT NULL,
  monto_interes    DECIMAL(15, 2) NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_pago       DATE,
  estado           estado_cuota DEFAULT 'pendiente',
  UNIQUE (credito_id, numero_cuota)
);

-- 14. tarjetas
CREATE TABLE IF NOT EXISTS tarjetas (
  id             SERIAL PRIMARY KEY,
  cliente_id     INTEGER NOT NULL REFERENCES clientes(id),
  cuenta_id      INTEGER REFERENCES cuentas(id),
  numero_tarjeta VARCHAR(16) UNIQUE NOT NULL,
  tipo           tipo_tarjeta NOT NULL,
  limite_credito DECIMAL(15, 2) DEFAULT 0.00,
  saldo_utilizado DECIMAL(15, 2) DEFAULT 0.00,
  fecha_emision  DATE DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE NOT NULL,
  estado         estado_tarjeta DEFAULT 'activa',
  created_at     TIMESTAMP DEFAULT NOW()
);

-- 15. movimientos_tarjeta
CREATE TABLE IF NOT EXISTS movimientos_tarjeta (
  id          SERIAL PRIMARY KEY,
  tarjeta_id  INTEGER NOT NULL REFERENCES tarjetas(id),
  tipo        tipo_movimiento_tj NOT NULL,
  monto       DECIMAL(15, 2) NOT NULL CHECK (monto > 0),
  descripcion TEXT,
  comercio    VARCHAR(200),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- 16. reclamos
CREATE TABLE IF NOT EXISTS reclamos (
  id            SERIAL PRIMARY KEY,
  cliente_id    INTEGER NOT NULL REFERENCES clientes(id),
  cuenta_id     INTEGER REFERENCES cuentas(id),
  titulo        VARCHAR(200) NOT NULL,
  descripcion   TEXT NOT NULL,
  estado        estado_reclamo DEFAULT 'abierto',
  resolucion    TEXT,
  atendido_por  INTEGER REFERENCES usuarios(id),
  fecha_cierre  TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- 17. auditoria
CREATE TABLE IF NOT EXISTS auditoria (
  id          BIGSERIAL PRIMARY KEY,
  usuario_id  INTEGER REFERENCES usuarios(id),
  accion      VARCHAR(100) NOT NULL,
  tabla       VARCHAR(50),
  registro_id INTEGER,
  datos_antes JSONB,
  datos_despues JSONB,
  ip          INET,
  nivel       nivel_auditoria DEFAULT 'info',
  created_at  TIMESTAMP DEFAULT NOW()
);

-- 18. integracion_log
CREATE TABLE IF NOT EXISTS integracion_log (
  id             BIGSERIAL PRIMARY KEY,
  servicio       VARCHAR(100) NOT NULL,
  endpoint       VARCHAR(300),
  metodo         VARCHAR(10),
  request_body   JSONB,
  response_body  JSONB,
  status_code    INTEGER,
  duracion_ms    INTEGER,
  exitoso        BOOLEAN DEFAULT TRUE,
  error_mensaje  TEXT,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- 19. entidades_financieras
CREATE TABLE IF NOT EXISTS entidades_financieras (
  id SERIAL PRIMARY KEY,
  codigo_sie VARCHAR(10) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  activa BOOLEAN DEFAULT TRUE
);

-- 20. agenda_beneficiarios
CREATE TABLE IF NOT EXISTS agenda_beneficiarios (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  entidad_id INTEGER NOT NULL REFERENCES entidades_financieras(id),
  alias_contacto VARCHAR(50) NOT NULL,
  numero_cuenta VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (cliente_id, numero_cuenta)
);

-- Datos semilla
INSERT INTO clientes (id, dni, nombre, apellido, email) VALUES 
  (1, '1234567', 'Juan', 'Perez', 'juan@test.com')
ON CONFLICT DO NOTHING;

INSERT INTO entidades_financieras (codigo_sie, nombre) VALUES 
  ('101', 'Banco de Crédito de Bolivia - BCP'),
  ('102', 'Banco Nacional de Bolivia - BNB'),
  ('103', 'Banco Mercantil Santa Cruz'),
  ('104', 'Banco Fie'),
  ('105', 'Banco Sol'),
  ('106', 'Banco Unión'),
  ('107', 'Banco Económico')
ON CONFLICT (codigo_sie) DO NOTHING;

INSERT INTO monedas (codigo, nombre, simbolo) VALUES
  ('PEN', 'Sol Peruano', 'S/'),
  ('USD', 'Dólar Americano', '$'),
  ('EUR', 'Euro', '€')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO tipos_cuenta (codigo, descripcion) VALUES
  ('ahorros',   'Cuenta de Ahorros'),
  ('corriente', 'Cuenta Corriente'),
  ('plazo_fijo','Cuenta a Plazo Fijo')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO roles (nombre, descripcion) VALUES
  ('admin',    'Administrador del sistema'),
  ('empleado', 'Empleado de ventanilla'),
  ('gerente',  'Gerente de sucursal')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO ubicacion (nombre, nivel, padre_id, codigo) VALUES
  ('Bolivia', 'pais', NULL, 'BO')
ON CONFLICT DO NOTHING;

INSERT INTO usuarios (username, nombre, email, password, rol)
VALUES ('admin', 'Administrador', 'admin@bancocbcp.pe',
        '$2a$10$jIJMK/vuLjD7WdIoxcLNGO0dTWkj.X390Fe25AROyIy55Zn1R7N3G', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Seed Permisos
INSERT INTO permisos (codigo, descripcion, modulo) VALUES
  ('OP_REGISTRAR_CLIENTE', 'Permitir registro de nuevos clientes', 'CLIENTES'),
  ('OP_APERTURA_CUENTA', 'Permitir apertura de cuentas bancarias', 'CUENTAS'),
  ('OP_OPERAR_TRANSACCION', 'Permitir depósitos, retiros y transferencias', 'TRANSACCIONES'),
  ('OP_REVISAR_CREDITO', 'Permitir aprobación de solicitudes de crédito', 'CREDITOS')
ON CONFLICT (codigo) DO NOTHING;

-- Asignar permisos al rol empleado (cajero)
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id 
FROM roles r, permisos p 
WHERE r.nombre = 'empleado' AND p.codigo IN ('OP_REGISTRAR_CLIENTE', 'OP_APERTURA_CUENTA', 'OP_OPERAR_TRANSACCION')
ON CONFLICT DO NOTHING;

-- Asignar permisos al rol admin (todos)
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id 
FROM roles r, permisos p 
WHERE r.nombre = 'admin'
ON CONFLICT DO NOTHING;
