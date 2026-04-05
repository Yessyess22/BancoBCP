# Bitacora de Desarrollo — Sistema BancoBCP
> Proyecto académico UPDS — Sistemas de Información II  
> Registro cronológico de decisiones técnicas, cambios arquitectónicos y correcciones críticas.

---

## 2026-04-05 — Sprint Relámpago: Saneamiento del Repositorio

### [ARCH-001] Reestructuración Arquitectónica: Migración a Patrón de 4 Capas (Backend)

**Responsable:** Alejandro Segovia  
**Estado:** Completado (módulo Transacciones) — Pendiente en otros módulos

**Contexto:**  
El backend operaba con un modelo monolítico donde la lógica de negocio, las consultas SQL y el manejo de respuestas HTTP convivían directamente en los archivos de rutas (`routes/*.js`). Este patrón dificultaba el mantenimiento, las pruebas unitarias y la asignación de trabajo por módulo.

**Acción:**  
Se creó la estructura de directorios correspondiente al patrón de 4 capas y se implementaron las capas para el módulo de Transacciones como modelo de referencia:

```
backend/src/
├── middlewares/        ← Autenticación JWT, manejo de errores
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   └── index.js
├── controllers/        ← Manejo de request/response HTTP
│   ├── transaccion.controller.js
│   └── index.js
├── services/           ← Reglas de negocio
│   ├── transaccion.service.js
│   └── index.js
└── repositories/       ← Acceso a datos (pg.Pool)
    ├── transaccion.repository.js
    └── index.js
```

**Flujo objetivo establecido:**
```
Request → Middleware → Router → Controller → Service → Repository → PostgreSQL
```

**Pendiente:** Aplicar el mismo patrón a los módulos auth, clientes y cuentas.

---

### [ARCH-002] Reestructuración Frontend: Creación de Estructura de Capas

**Responsable:** Equipo Frontend  
**Estado:** Estructura creada — Extracción de componentes PENDIENTE

**Contexto:**  
El archivo `frontend/src/App.js` (789 líneas) concentra la totalidad del frontend: contexto de autenticación, páginas, componentes de UI y lógica de negocio del cliente. Esto dificulta el trabajo paralelo por módulo.

**Acción:**  
Se crearon los directorios necesarios para el patrón de capas frontend:

```
frontend/src/
├── api/          ← Cliente HTTP centralizado (axios.js implementado)
├── components/   ← Componentes reutilizables (pendiente extracción)
├── context/      ← Contexto de autenticación (pendiente extracción)
├── hooks/        ← Custom hooks (pendiente implementación)
└── pages/        ← Páginas por módulo (pendiente extracción)
```

**Pendiente:** Extraer el contenido de `App.js` hacia sus directorios correspondientes. `App.js` permanece funcional hasta que las páginas sean implementadas.

---

### [DB-001] Base de Datos: Implementación del Esquema Completo (18 tablas en 3FN)

**Responsable:** Equipo BD  
**Estado:** Completado

**Contexto:**  
El archivo `backend/db/init.sql` inicialmente solo contenía 4 tablas (`usuarios`, `clientes`, `cuentas`, `transacciones`), cubriendo el 22% del modelo de datos normalizado definido en el documento de diseño (`BCP_Diseño_BaseDeDatos_Normalización.pdf`).

**Acción:**  
Se amplió `init.sql` para incluir las 18 tablas en Tercera Forma Normal (3FN):

| Módulo       | Tablas agregadas                                              |
|--------------|---------------------------------------------------------------|
| Seguridad    | `roles`, `permisos`, `usuario_roles`                          |
| Auditoría    | `auditoria`                                                   |
| Ubicación    | `departamentos`, `ciudades`                                   |
| Créditos     | `creditos`, `cuotas_credito`                                  |
| Tarjetas     | `tarjetas`, `movimientos_tarjeta`                             |
| Reclamos     | `reclamos`                                                    |
| Cuentas      | `tipos_cuenta`, `monedas` (normalizados desde ENUM)           |
| Transacc.    | `estados_transaccion` (normalizado desde ENUM)                |

**Seguridad:** Se habilitó la extensión `pgcrypto` para soporte de hashing nativo en la base de datos.

---

### [BUG-001] Corrección Crítica: Integridad de Saldos en Transferencias

**Responsable:** Denis  
**Severidad:** CRÍTICA  
**Estado:** Corregido

**Síntoma:**  
En operaciones de transferencia entre cuentas, el saldo se descontaba correctamente de la cuenta origen, pero se volvía a sumar al origen en lugar de acreditarse en la cuenta destino. El dinero "desaparecía" de la cuenta destino.

**Causa raíz:**  
Error de variable en la query de acreditación dentro de `backend/src/routes/transaccion.routes.js`:

```javascript
// INCORRECTO — usaba cuenta_origen_id en ambas queries
await client.query(
    'UPDATE cuentas SET saldo = saldo + $1 WHERE id = $2',
    [monto, cuenta_origen_id]  // ← Bug: parámetro incorrecto
);

// CORRECTO
await client.query(
    'UPDATE cuentas SET saldo = saldo + $1 WHERE id = $2',
    [monto, cuenta_destino_id]  // ← Fix aplicado
);
```

**Validación:** La transferencia ahora ejecuta correctamente dos actualizaciones atómicas dentro de una transacción SQL con `BEGIN / COMMIT / ROLLBACK`.

---

### [INFRA-001] Infraestructura: Red Estática Docker bcp_network

**Responsable:** Alejandro Segovia  
**Estado:** Completado

**Acción:**  
Se configuró la red `bcp_network` con subred estática `192.168.100.0/24` y se asignaron IPs fijas a cada contenedor para garantizar comunicación interna predecible:

| Contenedor          | IP Fija          | Puerto expuesto |
|---------------------|------------------|-----------------|
| `bancocbcp_db`      | 192.168.100.10   | 5432            |
| `bancocbcp_backend` | 192.168.100.20   | 5001 → 5000     |
| `bancocbcp_frontend`| 192.168.100.30   | 3000            |

**Nota:** Los servicios Redis y Nginx Proxy Manager fueron evaluados y descartados para este prototipo. No existen en el repositorio ni en `docker-compose.yml`. Redis estaba considerado para rate limiting; Nginx para SSL en producción. Ambos quedan fuera del alcance del MVP académico.

---

### [INFRA-002] Script de Arranque Unificado: start-bcp.js

**Responsable:** Alejandro Segovia  
**Estado:** Completado

**Acción:**  
Se creó `start-bcp.js` en la raíz del repositorio. El script:
1. Verifica la existencia de `.env`; si no existe pero hay `.env.example`, lo copia automáticamente.
2. Ejecuta `docker compose down` para limpiar contenedores previos.
3. Ejecuta `docker compose up -d --build` para levantar el stack completo.
4. Imprime las URLs de acceso al sistema.

---

---

## 2026-04-05 — Sprint Relámpago: Core de Identidad

### [ARCH-004] Implementación del Core de Identidad: Auth, Usuarios y Clientes en Patrón 4 Capas

**Responsable:** Alejandro Segovia  
**Rama:** `feature/core-identidad`  
**Estado:** Completado

**Contexto:**  
ARCH-001 estableció el patrón de 4 capas usando Transacciones como módulo de referencia. Este hito lo extiende a los módulos de Auth, Usuarios y Clientes, completando el núcleo de identidad y seguridad del sistema.

**Módulos implementados:**

#### Auth (`auth.controller.js` / `auth.service.js` / `auth.repository.js`)
- Login con JWT enriquecido: el token incluye `{ id, username, rol, roles[] }` donde `roles` es el array de roles granulares del usuario.
- Registro de auditoría automática en `auditoria_log` por cada intento de login (exitoso y fallido) — cubre **RNF-11** (Auditoría).
- Rutas protegidas: `POST /api/auth/login`.

#### Usuarios (`usuario.controller.js` / `usuario.service.js` / `usuario.repository.js`)
- Nuevo módulo con CRUD completo: `GET /api/usuarios`, `GET /api/usuarios/:id`, `POST /api/usuarios`, `PUT /api/usuarios/:id`, `DELETE /api/usuarios/:id`.
- Acceso restringido a rol `admin` mediante middleware `verifyRole`.
- Auditoría automática de altas, modificaciones y bajas de usuarios.

#### Clientes (`cliente.controller.js` / `cliente.service.js` / `cliente.repository.js`)
- Refactorización completa del módulo monolítico al patrón de 4 capas.
- Validaciones de negocio en capa Service: DNI único y Email único por cliente.
- Auditoría automática de cambios en registros de clientes.

**Middleware activado:**
- `verifyToken` activo en todas las rutas de Clientes y Usuarios — **cierra SEC-002**.
- `verifyRole('admin')` protege el módulo de Usuarios completo.

**Estructura final implementada:**
```
backend/src/
├── controllers/
│   ├── auth.controller.js      ← NUEVO
│   ├── cliente.controller.js   ← NUEVO
│   ├── usuario.controller.js   ← NUEVO
│   └── index.js
├── services/
│   ├── auth.service.js         ← NUEVO
│   ├── cliente.service.js      ← NUEVO
│   ├── usuario.service.js      ← NUEVO
│   └── index.js
├── repositories/
│   ├── auth.repository.js      ← NUEVO
│   ├── cliente.repository.js   ← NUEVO
│   ├── usuario.repository.js   ← NUEVO
│   └── index.js
├── middlewares/
│   ├── auth.middleware.js      ← verifyToken + verifyRole activos
│   └── index.js
└── routes/
    ├── auth.routes.js          ← actualizado
    ├── cliente.routes.js       ← actualizado
    └── usuario.routes.js       ← NUEVO
```

---

## Pendientes del Sprint

| ID       | Tarea                                                    | Responsable     | Estado      |
|----------|----------------------------------------------------------|-----------------|-------------|
| ARCH-003 | Extraer App.js (789 líneas) en páginas y componentes     | Equipo Frontend | Pendiente   |
| ARCH-004 | Aplicar patrón 4 capas a módulos auth, clientes, usuarios| Alejandro S.    | **Completado** |
| SEC-001  | Crear `.env.example` y verificar que no hay credenciales en código | Todos | Pendiente |
| SEC-002  | Activar middleware `verifyToken` en todas las rutas protegidas | Alejandro S. | **Completado** |
| MOD-001  | Implementar módulo Créditos (API + UI)                   | Alejandro P.    | Pendiente   |
| MOD-002  | Implementar módulo Cuentas — rutas PUT/DELETE faltantes  | Yessica         | Pendiente   |
| MOD-003  | Completar Dashboard KPIs (endpoints parciales)           | Denis           | Pendiente   |
