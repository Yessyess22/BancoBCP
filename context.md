# context.md — Fuente de Verdad: Sistema BancoBCP
> Generado el 2026-04-05 | Sprint Relámpago | Arquitecto: Análisis Automatizado
> Uso: Referencia técnica para onboarding, desarrollo y revisión de PR.

---

## 1. Visión General

El Sistema BancoBCP es un **TPS/MIS bancario** de propósito académico (UPDS — Sistemas de Información II) que replica las operaciones core de un banco comercial. El objetivo es demostrar dominio de arquitectura fullstack, normalización relacional y buenas prácticas de ingeniería de software bajo estándares similares a ASFI/SBS.

| Dimensión         | Valor                                                           |
|-------------------|-----------------------------------------------------------------|
| Tipo de sistema   | TPS (Procesamiento Transaccional) + MIS (Información Gerencial) |
| Stack principal   | Node.js / Express — React — PostgreSQL — Docker                 |
| Entorno objetivo  | Contenedores Docker (desarrollo); Nginx Proxy Manager (prod)    |
| Estado actual     | MVP funcional — listo para desarrollo del Sprint Relámpago      |

### Módulos del dominio

| Módulo            | Estado UI   | Estado API              | Prioridad Sprint |
|-------------------|-------------|-------------------------|------------------|
| Autenticación     | Completo    | Completo (4 capas)      | Mantenimiento    |
| Clientes          | Completo    | Completo (4 capas)      | Mantenimiento    |
| Cuentas           | Completo    | Completo                | Mantenimiento    |
| Transacciones     | Completo    | Completo*               | BUG CRÍTICO      |
| Dashboard/MIS     | Completo    | Parcial                 | Mejora           |
| Usuarios/Roles    | Ausente     | Completo (4 capas)      | Desarrollo       |
| Créditos          | Deshabilitado | Ausente               | Desarrollo       |
| Tarjetas          | Deshabilitado | Ausente               | Desarrollo       |
| Reclamos          | Deshabilitado | Ausente               | Desarrollo       |
| Reportes Auditoría| Deshabilitado | Ausente               | Desarrollo       |

> (*) Bug activo en transferencias — ver sección 6.

---

## 2. Arquitectura de Software

### 2.1 Diagrama C4 — Nivel Contenedores

```
[Usuario/Navegador]
        |
        | HTTP :3000
        v
[frontend — React 18 / Vite-like CRA]
        |
        | HTTP :5001 → :5000 (Docker NAT)
        v
[backend — Node.js 20 / Express 4]
        |
        | pg.Pool — TCP :5432
        v
[postgres — PostgreSQL 16]
```

### 2.2 Patrón de Capas (Estado Actual vs. Objetivo)

#### Estado IMPLEMENTADO (Auth / Usuarios / Clientes / Transacciones)
```
Request → Middleware (verifyToken, verifyRole) → Router → Controller → Service → Repository → PostgreSQL
```

#### Estado PENDIENTE (Cuentas, Créditos, Tarjetas, Reclamos)
```
Request → Router (routes/*.js)
              └── Lógica de negocio embebida
              └── Consultas SQL directas (pg.Pool)
              └── Respuesta HTTP
```

#### Estado OBJETIVO completo (Patrón por Capas — Sprint Relámpago)
```
Request
  → Middleware (auth, validación, rate-limit)
  → Router (routes/*.js)        ← solo dispatch
  → Controller (*.controller.js) ← manejo HTTP
  → Service (*.service.js)       ← reglas de negocio
  → Repository (*.repository.js) ← acceso a datos (pg.Pool)
  → PostgreSQL
```

### 2.3 Estructura de Directorios Objetivo

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js                  (pool PostgreSQL)
│   │   └── logger.js              (Winston — PENDIENTE)
│   ├── middlewares/
│   │   ├── auth.middleware.js     (JWT verify — PENDIENTE)
│   │   ├── validate.middleware.js (Joi/express-validator — PENDIENTE)
│   │   └── errorHandler.js        (PENDIENTE)
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── cliente.routes.js
│   │   ├── cuenta.routes.js
│   │   ├── transaccion.routes.js
│   │   ├── credito.routes.js      (PENDIENTE)
│   │   ├── tarjeta.routes.js      (PENDIENTE)
│   │   ├── reporte.routes.js      (PENDIENTE)
│   │   └── usuario.routes.js      (implementado)
│   ├── controllers/               (auth, cliente, usuario implementados)
│   ├── services/                  (auth, cliente, usuario implementados)
│   ├── repositories/              (auth, cliente, usuario implementados)
│   ├── models/                    (PENDIENTE — Sequelize)
│   └── index.js
├── db/
│   └── init.sql
├── .env.example                   (PENDIENTE)
├── Dockerfile
└── package.json

frontend/
├── src/
│   ├── api/
│   │   └── axios.js               (cliente HTTP centralizado — PENDIENTE)
│   ├── components/                (CAPA FALTANTE)
│   ├── pages/                     (CAPA FALTANTE — extraer de App.js)
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ClientesPage.jsx
│   │   ├── CuentasPage.jsx
│   │   └── TransaccionesPage.jsx
│   ├── context/
│   │   └── AuthContext.jsx        (PENDIENTE — extraer de App.js)
│   ├── hooks/                     (PENDIENTE)
│   ├── App.js                     (789 líneas — REQUIERE REFACTOR)
│   ├── index.js
│   └── index.css
├── public/
│   └── index.html
├── .env.example                   (PENDIENTE)
├── Dockerfile
└── package.json
```

---

## 3. Estado de la Base de Datos

### 3.1 Tablas Implementadas (init.sql)

| # | Tabla          | PK  | FKs                              | Notas                              |
|---|----------------|-----|----------------------------------|------------------------------------|
| 1 | `usuarios`     | id  | —                                | rol ENUM (admin/empleado)          |
| 2 | `clientes`     | id  | —                                | dni UNIQUE, soft delete (activo)   |
| 3 | `cuentas`      | id  | cliente_id → clientes            | numero_cuenta UNIQUE, saldo DECIMAL|
| 4 | `transacciones`| id  | cuenta_origen_id, cuenta_destino_id → cuentas | estado ENUM |

### 3.2 Tablas Requeridas por el Diseño (18 tablas 3FN del PDF)

Comparando con el documento `BCP_Diseño_BaseDeDatos_Normalización.pdf`, las siguientes tablas **faltan en init.sql**:

| Tabla esperada         | Módulo         | Implementada |
|------------------------|----------------|--------------|
| `roles`                | Seguridad      | NO           |
| `permisos`             | Seguridad      | NO           |
| `usuario_roles`        | Seguridad      | NO           |
| `auditoria`            | Auditoría      | NO           |
| `departamentos`        | Ubicación      | NO           |
| `ciudades`             | Ubicación      | NO           |
| `creditos`             | Créditos       | NO           |
| `cuotas_credito`       | Créditos       | NO           |
| `tarjetas`             | Tarjetas       | NO           |
| `movimientos_tarjeta`  | Tarjetas       | NO           |
| `reclamos`             | Reclamos       | NO           |
| `tipos_cuenta`         | Cuentas        | NO (ENUM)    |
| `monedas`              | Cuentas        | NO (ENUM)    |
| `estados_transaccion`  | Transacciones  | NO (ENUM)    |

> **Conclusión:** Solo 4 de 18 tablas están implementadas (22%). El sprint debe agregar las 14 tablas faltantes con sus migraciones.

### 3.3 Modelo Crítico: transacciones

```sql
CREATE TABLE transacciones (
    id              SERIAL PRIMARY KEY,
    cuenta_origen_id   INTEGER REFERENCES cuentas(id),  -- nullable para depósitos
    cuenta_destino_id  INTEGER REFERENCES cuentas(id),  -- nullable para retiros
    tipo            VARCHAR(20) CHECK (tipo IN ('deposito','retiro','transferencia')),
    monto           DECIMAL(15,2) NOT NULL CHECK (monto > 0),
    descripcion     TEXT,
    estado          VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','completado','fallido')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Requerimientos Críticos

### 4.1 Requerimientos Funcionales (RF) Prioritarios

| ID    | Requerimiento                                      | Estado      | Prioridad |
|-------|----------------------------------------------------|-------------|-----------|
| RF-01 | Login con usuario/contraseña y JWT                 | Completo    | P1        |
| RF-02 | CRUD completo de Clientes con soft-delete          | Completo    | P1        |
| RF-03 | CRUD de Cuentas (ahorros/corriente)                | Completo    | P1        |
| RF-04 | Depósito atómico con actualización de saldo        | Completo    | P1        |
| RF-05 | Retiro con validación de saldo suficiente          | Completo    | P1        |
| RF-06 | Transferencia atómica entre cuentas                | **BUG**     | P1 URGENTE|
| RF-07 | Dashboard con KPIs (clientes, cuentas, volumen)    | Parcial     | P1        |
| RF-08 | Gestión de Roles y Permisos (admin/empleado)       | Completo    | P1        |
| RF-09 | Registro de Auditoría de operaciones               | Completo    | P1        |
| RF-10 | Módulo de Créditos (solicitud, aprobación, cuotas) | Ausente     | P2        |
| RF-11 | Módulo de Tarjetas (emisión, estado, límite)       | Ausente     | P2        |
| RF-12 | Módulo de Reclamos                                 | Ausente     | P3        |
| RF-13 | Reportes exportables (PDF/Excel)                   | Ausente     | P2        |
| RF-14 | Gestión de Usuarios del sistema                    | Completo    | P1        |

### 4.2 Requerimientos No Funcionales (RNF)

| ID     | Requerimiento                                            | Estado      |
|--------|----------------------------------------------------------|-------------|
| RNF-01 | Autenticación stateless con JWT (HS256, 8h expiry)       | Completo    |
| RNF-02 | Contraseñas hasheadas con bcrypt (salt rounds ≥ 10)      | Completo    |
| RNF-03 | Variables de entorno en .env (no credenciales en código) | **FALTANTE**|
| RNF-04 | Middleware de autenticación en rutas protegidas           | Completo    |
| RNF-05 | Validación de entradas en todos los endpoints            | **FALTANTE**|
| RNF-06 | Logging estructurado con Winston + Morgan                | **FALTANTE**|
| RNF-07 | Respuestas API estandarizadas `{success, data, message}` | **FALTANTE**|
| RNF-08 | Manejo centralizado de errores (errorHandler middleware) | **FALTANTE**|
| RNF-09 | Transacciones SQL atómicas con ROLLBACK                  | Parcial     |
| RNF-10 | HTTPS/SSL en producción (Nginx Proxy Manager)            | Pendiente   |
| RNF-11 | Rate limiting en endpoints sensibles                     | **FALTANTE**|
| RNF-12 | Tiempo de respuesta API < 200ms para operaciones core    | No medido   |

---

## 5. Mapa de Rutas de la API

### Convención de Respuesta (Objetivo)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación completada",
  "meta": { "total": 100, "page": 1 }
}
```

### 5.1 Autenticación
| Método | Ruta             | Body                        | Auth | Estado   |
|--------|------------------|-----------------------------|------|----------|
| POST   | /api/auth/login  | `{username, password}`      | No   | OK       |
| POST   | /api/auth/logout | —                           | JWT  | PENDIENTE|
| GET    | /api/auth/me     | —                           | JWT  | PENDIENTE|

> Login retorna `{ token, user: { id, username, rol, roles[] } }`. El campo `roles` contiene los roles granulares del usuario para control de acceso fino en el frontend.

### 5.2 Usuarios *(nuevo — solo admin)*
| Método | Ruta                  | Body                                           | Auth        | Estado |
|--------|-----------------------|------------------------------------------------|-------------|--------|
| GET    | /api/usuarios         | —                                              | JWT + admin | OK     |
| GET    | /api/usuarios/:id     | —                                              | JWT + admin | OK     |
| POST   | /api/usuarios         | `{username, password, nombre, apellido, rol}`  | JWT + admin | OK     |
| PUT    | /api/usuarios/:id     | `{nombre, apellido, rol}`                      | JWT + admin | OK     |
| DELETE | /api/usuarios/:id     | —                                              | JWT + admin | OK     |

### 5.3 Clientes
| Método | Ruta                | Body / Params                                          | Auth | Estado   |
|--------|---------------------|--------------------------------------------------------|------|----------|
| GET    | /api/clientes       | ?search=&page=&limit=                                  | JWT  | OK*      |
| GET    | /api/clientes/:id   | —                                                      | JWT  | OK*      |
| POST   | /api/clientes       | `{dni, nombre, apellido, email, telefono, direccion, fecha_nacimiento}` | JWT | OK* |
| PUT    | /api/clientes/:id   | `{nombre, apellido, email, telefono, direccion}`       | JWT  | OK*      |
| DELETE | /api/clientes/:id   | —                                                      | JWT  | OK*      |

> (*) Sin middleware JWT activo actualmente.

### 5.4 Cuentas
| Método | Ruta              | Body                                      | Auth | Estado   |
|--------|-------------------|-------------------------------------------|------|----------|
| GET    | /api/cuentas      | —                                         | JWT  | OK*      |
| GET    | /api/cuentas/:id  | —                                         | JWT  | OK*      |
| POST   | /api/cuentas      | `{cliente_id, tipo, saldo_inicial, moneda}` | JWT | OK*    |
| PUT    | /api/cuentas/:id  | `{tipo, moneda, activa}`                  | JWT  | PENDIENTE|
| DELETE | /api/cuentas/:id  | —                                         | JWT  | PENDIENTE|

### 5.5 Transacciones
| Método | Ruta                              | Body                                                 | Auth | Estado    |
|--------|-----------------------------------|------------------------------------------------------|------|-----------|
| GET    | /api/transacciones                | ?limit=100                                           | JWT  | OK*       |
| POST   | /api/transacciones/deposito       | `{cuenta_destino_id, monto, descripcion}`            | JWT  | OK*       |
| POST   | /api/transacciones/retiro         | `{cuenta_origen_id, monto, descripcion}`             | JWT  | OK*       |
| POST   | /api/transacciones/transferencia  | `{cuenta_origen_id, cuenta_destino_id, monto, descripcion}` | JWT | **BUG** |

### 5.6 Módulos Pendientes (Estructura Esperada)
| Módulo      | Prefijo            | Rutas mínimas esperadas                       |
|-------------|--------------------|-----------------------------------------------|
| Créditos    | /api/creditos      | GET, GET/:id, POST, PUT/:id (estado), GET/:id/cuotas |
| Tarjetas    | /api/tarjetas      | GET, GET/:id, POST, PUT/:id (bloquear/activar)|
| Reclamos    | /api/reclamos      | GET, GET/:id, POST, PUT/:id (estado)          |
| Reportes    | /api/reportes      | GET /transacciones, GET /clientes, GET /auditoria |

---

## 6. Bug Crítico Activo

### BUG-001: Transferencias no acreditan la cuenta destino

**Archivo:** `backend/src/routes/transaccion.routes.js` — línea ~80

**Código actual (incorrecto):**
```javascript
// Acreditar cuenta destino
await client.query(
    'UPDATE cuentas SET saldo = saldo + $1 WHERE id = $2',
    [monto, cuenta_origen_id]  // ← ERROR: usa cuenta_origen_id en lugar de cuenta_destino_id
);
```

**Código correcto:**
```javascript
await client.query(
    'UPDATE cuentas SET saldo = saldo + $1 WHERE id = $2',
    [monto, cuenta_destino_id]  // ← CORRECCIÓN
);
```

**Impacto:** En toda transferencia, el saldo se descuenta del origen pero se vuelve a sumar al origen (en lugar del destino). El dinero desaparece del destino. **Severidad: CRÍTICA.**

---

## 7. Guía de Estilo y Convenciones

### 7.1 Naming de Variables y Funciones

| Contexto         | Convención       | Ejemplo                          |
|------------------|------------------|----------------------------------|
| Variables JS/TS  | camelCase        | `cuentaId`, `saldoInicial`       |
| Funciones        | camelCase verbo  | `getCliente`, `createTransaccion`|
| Constantes       | UPPER_SNAKE_CASE | `JWT_SECRET`, `MAX_RETRIES`      |
| Archivos backend | kebab-case       | `cliente.routes.js`, `auth.middleware.js` |
| Archivos frontend| PascalCase       | `ClientesPage.jsx`, `AuthContext.jsx` |
| Tablas SQL       | snake_case plural| `clientes`, `transacciones`      |
| Columnas SQL     | snake_case       | `cuenta_origen_id`, `created_at` |
| Endpoints API    | kebab-case plural| `/api/clientes`, `/api/cuentas`  |

### 7.2 Estructura de Archivos de Ruta (Backend)

```javascript
// cliente.routes.js — Patrón objetivo
const router = require('express').Router();
const { verifyToken } = require('../middlewares/auth.middleware');
const { validateBody } = require('../middlewares/validate.middleware');
const ClienteController = require('../controllers/cliente.controller');
const { createClienteSchema } = require('../validators/cliente.validator');

router.get('/',    verifyToken, ClienteController.getAll);
router.get('/:id', verifyToken, ClienteController.getById);
router.post('/',   verifyToken, validateBody(createClienteSchema), ClienteController.create);
router.put('/:id', verifyToken, ClienteController.update);
router.delete('/:id', verifyToken, ClienteController.remove);

module.exports = router;
```

### 7.3 Formato de Respuesta API

```javascript
// Éxito
res.status(200).json({ success: true, data: result, message: 'OK' });

// Error de negocio (400)
res.status(400).json({ success: false, data: null, message: 'Saldo insuficiente' });

// No autorizado (401)
res.status(401).json({ success: false, data: null, message: 'Token inválido o expirado' });

// No encontrado (404)
res.status(404).json({ success: false, data: null, message: 'Cliente no encontrado' });

// Error interno (500) — manejado por errorHandler
next(error); // no responder directamente
```

### 7.4 Logging con Winston (Objetivo)

```javascript
// src/config/logger.js
const winston = require('winston');
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});
module.exports = logger;
```

Niveles de log esperados:
- `error`: Excepciones no controladas, fallos de BD, errores 5xx
- `warn`: Intentos de autenticación fallidos, validaciones rechazadas
- `info`: Inicio de servidor, conexión BD, operaciones exitosas de negocio
- `debug`: Queries SQL (solo en desarrollo)

### 7.5 Variables de Entorno (.env.example Requerido)

```env
# Servidor
NODE_ENV=development
PORT=5000
LOG_LEVEL=info

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=alex
DB_PASSWORD=
DB_NAME=BancoBCP

# Seguridad
JWT_SECRET=
JWT_EXPIRES_IN=8h
BCRYPT_SALT_ROUNDS=12

# Frontend
REACT_APP_API_URL=http://localhost:5001/api
```

---

## 8. Configuración Docker

### Servicios actuales
| Servicio   | Imagen              | Puerto Host | Puerto Contenedor | Red          |
|------------|---------------------|-------------|-------------------|--------------|
| postgres   | postgres:16-alpine  | 5432        | 5432              | bcp_network  |
| backend    | node:20-alpine      | 5001        | 5000              | bcp_network  |
| frontend   | node:20-alpine      | 3000        | 3000              | bcp_network  |

### Servicios pendientes
| Servicio          | Propósito                              |
|-------------------|----------------------------------------|
| redis             | Caché de sesiones / rate limiting      |
| nginx             | Reverse proxy + SSL (producción)       |

### Comandos rápidos
```bash
# Levantar todo
docker-compose up --build

# Solo BD (para desarrollo local)
docker-compose up postgres -d

# Ver logs del backend
docker-compose logs -f backend

# Resetear BD
docker-compose down -v && docker-compose up --build
```

---

## 9. Checklist Pre-Sprint — Saneamiento Requerido

Antes de que el equipo clone sus ramas, el tech lead debe resolver:

### BLOQUEANTES (deben estar resueltos antes del primer PR)
- [ ] **BUG-001**: Corregir parámetro en transferencia (`transaccion.routes.js:~80`)
- [ ] **SEC-001**: Crear `.env.example` y mover credenciales fuera de `docker-compose.yml`
- [x] **SEC-002**: Agregar middleware `verifyToken` a todas las rutas protegidas *(completo — Auth, Clientes, Usuarios)*
- [x] **ARCH-001**: Crear capas `controllers/`, `services/`, `repositories/` para Auth, Clientes y Usuarios
- [ ] **ARCH-002**: Crear carpetas `pages/`, `components/`, `context/`, `hooks/` en frontend

### ALTA PRIORIDAD (Sprint Relámpago)
- [ ] **DB-001**: Agregar las 14 tablas faltantes a `init.sql` (o crear migraciones)
- [ ] **ARCH-003**: Extraer componentes de `App.js` (789 líneas → páginas separadas)
- [ ] **API-001**: Estandarizar todas las respuestas al formato `{success, data, message}`
- [ ] **LOG-001**: Integrar Winston + Morgan
- [ ] **VAL-001**: Agregar validación de entradas con `express-validator` o `joi`

### MEDIA PRIORIDAD
- [ ] Instalar y configurar Sequelize (modelos ORM)
- [ ] Agregar Swagger/OpenAPI (`/api/docs`)
- [ ] Configurar Redis en docker-compose
- [ ] Crear `README.md` con instrucciones de setup
- [ ] Configurar ESLint + Prettier

---

## 10. Credenciales de Desarrollo (SOLO ENTORNO LOCAL)

> **ADVERTENCIA:** Cambiar todas estas credenciales antes de cualquier despliegue.

| Servicio    | Usuario | Contraseña     | Notas                        |
|-------------|---------|----------------|------------------------------|
| PostgreSQL  | alex    | 123456         | Cambiar en .env              |
| App Admin   | admin   | admin123       | Cambiar post-primer login    |
| JWT Secret  | —       | bancocbcp_jwt_secret_2024 | Rotar en producción |

**Acceso rápido:**
- Frontend: http://localhost:3000
- API: http://localhost:5001/api
- Health: http://localhost:5001/api/health
