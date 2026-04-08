# Sistema Bancario BCP — Resumen del Proyecto

**Materia:** Sistemas de Información II  
**Universidad:** UPDS  
**Integrante:** Alejandro Segovia (Escobar)

---

## ¿Qué es el sistema?

**BancoBCP** es un sistema de información bancario completo que digitaliza las operaciones de un banco. Permite gestionar clientes, cuentas, transacciones, créditos, beneficiarios y usuarios del sistema desde una interfaz web moderna, con control de acceso por roles.

---

## Arquitectura General

El sistema sigue una arquitectura de **tres capas** completamente contenerizada:

```
┌─────────────────────────────────────────────────┐
│                  DOCKER COMPOSE                  │
│                                                  │
│  ┌──────────┐   ┌──────────┐   ┌─────────────┐  │
│  │ Frontend │──▶│ Backend  │──▶│  PostgreSQL │  │
│  │ React    │   │ Node.js  │   │   (BD)      │  │
│  │ :3000    │   │ :5001    │   │   :5432     │  │
│  └──────────┘   └──────────┘   └─────────────┘  │
│                                                  │
│         Red interna: 192.168.100.0/24            │
└─────────────────────────────────────────────────┘
```

Cada servicio corre en su propio contenedor Docker con red interna aislada. El frontend hace peticiones al backend via proxy y el backend se comunica con la base de datos por la red interna de Docker.

---

## Tecnologías Utilizadas

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| **Node.js** | v20 | Runtime del servidor |
| **Express.js** | 4.19 | Framework HTTP / API REST |
| **PostgreSQL** | 16 | Base de datos relacional |
| **bcryptjs** | 2.4 | Hash de contraseñas |
| **jsonwebtoken** | 9.0 | Autenticación JWT |
| **express-validator** | 7.3 | Validación de datos de entrada |
| **pg** | 8.12 | Driver de conexión a PostgreSQL |
| **nodemon** | 3.1 | Hot-reload en desarrollo |

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| **React** | 18.3 | Librería de UI |
| **React Router DOM** | 6.24 | Navegación SPA |
| **Axios** | 1.7 | Cliente HTTP |
| **Chart.js + react-chartjs-2** | 4.5 | Gráficas del Dashboard |
| **jsPDF + jspdf-autotable** | 4.2 | Exportación de reportes a PDF |

### Infraestructura
| Tecnología | Uso |
|---|---|
| **Docker** | Contenerización de servicios |
| **Docker Compose** | Orquestación multi-contenedor |
| **Git** | Control de versiones |

---

## Base de Datos — Modelo Relacional (3FN)

La base de datos está diseñada en **Tercera Forma Normal (3FN)** con **20 tablas**:

```
ubicacion           → departamentos/regiones de Bolivia
clientes            → datos personales del cliente bancario
usuarios            → cuentas de acceso al sistema (admin, empleado, cliente)
roles               → roles del sistema
permisos            → permisos granulares por operación
rol_permisos        → tabla puente roles ↔ permisos
usuario_roles       → tabla puente usuarios ↔ roles
monedas             → BOB, USD, EUR
tipos_cuenta        → ahorro, corriente, etc.
cuentas             → cuentas bancarias de los clientes
transacciones       → depósitos, retiros, transferencias
tarjetas            → tarjetas vinculadas a cuentas
movimientos_tarjeta → historial de uso de tarjetas
creditos            → solicitudes y créditos aprobados
cuotas_credito      → cronograma de amortización (método francés)
entidades_financieras → bancos externos (BNB, Mercantil, Fíe...)
agenda_beneficiarios → contactos de transferencia de cada cliente
reclamos            → gestión de quejas y reclamos
auditoria           → registro de acciones del sistema
integracion_log     → log de integraciones externas
```

**Tipos de dato especiales de PostgreSQL usados:**
- `CITEXT` — texto case-insensitive (username, email sin importar mayúsculas)
- `ENUM` — estados controlados (`estado_credito`, `estado_transaccion`, `estado_reclamo`)
- `DECIMAL(15,2)` — precisión monetaria

---

## Módulos del Sistema

### 1. Autenticación y Seguridad
- Login con **JWT** (JSON Web Token) — token con 8 horas de expiración
- Contraseñas hasheadas con **bcrypt** (salt rounds = 10)
- Middleware `verifyToken` protege todas las rutas privadas
- Sistema de **permisos granulares** por operación (tabla `permisos` + `rol_permisos`)

### 2. Gestión de Clientes
- CRUD completo de clientes vinculados a ubicación geográfica
- **Al crear un cliente se genera automáticamente su usuario** del sistema:
  - Username = DNI del cliente
  - Contraseña inicial = DNI del cliente
  - Rol = `cliente`
- Creación atómica (transacción BEGIN/COMMIT) — si falla el usuario, no se crea el cliente

### 3. Gestión de Usuarios
- CRUD de usuarios del sistema (solo admin)
- Tres roles: `admin`, `empleado`, `cliente`
- Protección: un usuario no puede desactivar su propia cuenta

### 4. Gestión de Cuentas
- Apertura de cuentas bancarias por cliente
- Monedas disponibles: **Boliviano (BOB)**, Dólar (USD), Euro (EUR)
- Los clientes solo ven sus propias cuentas (filtrado por `cliente_id` del JWT)

### 5. Motor de Transacciones
- **Depósitos**, **Retiros** y **Transferencias**
- Procesamiento **atómico** con transacciones SQL (BEGIN/COMMIT/ROLLBACK)
- Transferencias internas (entre cuentas BCP) e **interbancarias** (otros bancos)
- Los clientes solo pueden operar sus propias cuentas (validación de ownership)
- Historial filtrado por rol

### 6. Agenda de Beneficiarios
- Cada cliente puede registrar contactos frecuentes de transferencia
- Vinculados a entidades financieras de Bolivia (7 bancos)
- Al hacer una transferencia, los beneficiarios aparecen en el dropdown de cuenta destino
- CRUD completo con eliminación

### 7. Gestión de Créditos
- Solicitud de créditos por empleados/clientes
- Flujo de aprobación con **control de segregación de funciones**:
  - Un empleado **no puede aprobar** un crédito que él mismo registró
  - Se requiere otro empleado o administrador como supervisor
- Cálculo automático de cuotas con **método de amortización francés** (cuota fija)
- Generación del cronograma de pagos completo

### 8. Reportes
- Exportación de datos a **PDF** con jsPDF + autoTable
- Reportes de clientes, cuentas, transacciones y créditos

### 9. Dashboard
- Resumen ejecutivo con indicadores clave
- Gráficas de transacciones con Chart.js

---

## Patrones y Principios Aplicados

### Arquitectura del Backend
```
src/
├── routes/        → Definición de endpoints y middlewares
├── controllers/   → Lógica HTTP (req/res)
├── services/      → Lógica de negocio
├── repositories/  → Acceso a datos (SQL)
├── middlewares/   → Auth, roles, validación, errores
└── validators/    → Esquemas de validación por entidad
```

Patrón: **Route → Controller → Service → Repository** (separación de responsabilidades)

### Control de Acceso
- **RBAC** (Role-Based Access Control) con permisos granulares en base de datos
- El JWT incluye: `id`, `rol`, `cliente_id` — suficiente para tomar decisiones de autorización sin consultar la BD en cada request
- Dos tipos de middleware:
  - `authorizeRoles('admin')` — control por rol directo
  - `hasPermission('OP_CODIGO')` — control por permiso en BD (más flexible)

### Integridad de Datos
- Todas las operaciones monetarias usan transacciones SQL explícitas
- Constraints de BD: CHECK, UNIQUE, FOREIGN KEY con ON DELETE CASCADE
- Soft delete en clientes y usuarios (campo `activo = FALSE`)

---

## Flujo de Creación de Cliente (ejemplo de integración)

```
Empleado registra cliente
        │
        ▼
BEGIN (transacción SQL)
        │
        ├─▶ INSERT INTO clientes → nuevo cliente
        │
        ├─▶ bcrypt.hash(dni) → contraseña segura
        │
        ├─▶ INSERT INTO usuarios (rol='cliente', cliente_id)
        │
COMMIT ─┘
        │
        ▼
Respuesta al frontend con credenciales generadas
        │
        ▼
Modal muestra: username=DNI, password=DNI
```

---

## Roles y Permisos

| Rol | Permisos | Restricciones |
|---|---|---|
| `admin` | Todo | — |
| `empleado` | Registrar clientes, abrir cuentas, operar transacciones, **revisar créditos** | No puede aprobar créditos que él mismo registró |
| `cliente` | Operar sus propias cuentas, ver sus transacciones, gestionar sus beneficiarios | Solo ve y opera sus propios datos |

---

## Despliegue

```bash
# Levantar todo el sistema
docker-compose up -d

# Servicios disponibles:
# Frontend:  http://localhost:3000
# Backend:   http://localhost:5001/api
# DB:        localhost:5432

# Credenciales por defecto:
# Usuario: admin
# Contraseña: admin123
```

---

## Endpoints principales de la API

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Autenticación |
| GET/POST | `/api/clientes` | Gestión de clientes |
| GET/POST | `/api/cuentas` | Gestión de cuentas |
| POST | `/api/transacciones/deposito` | Depósito |
| POST | `/api/transacciones/retiro` | Retiro |
| POST | `/api/transacciones/transferencia` | Transferencia |
| POST | `/api/creditos/solicitar` | Solicitar crédito |
| PATCH | `/api/creditos/:id/revisar` | Aprobar/rechazar crédito |
| GET/POST/DELETE | `/api/beneficiarios` | Agenda de beneficiarios |
| GET | `/api/beneficiarios/entidades` | Bancos disponibles |
| GET/POST/PUT/DELETE | `/api/usuarios` | Gestión de usuarios (admin) |
| GET | `/api/reportes` | Generación de reportes |

---

*Sistema desarrollado para la materia Sistemas de Información II — UPDS*
