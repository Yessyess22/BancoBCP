# Sistema Bancario BCP

Prototipo académico de un sistema bancario transaccional (TPS/MIS) desarrollado para la asignatura **Sistemas de Información II — UPDS**.

Stack: **Node.js / Express · React 18 · PostgreSQL 16 · Docker**

---

## Prerequisitos

Antes de ejecutar el sistema, asegurate de tener instalado:

| Herramienta | Version minima | Descarga oficial                        |
|-------------|----------------|-----------------------------------------|
| Docker Desktop (incluye Docker Compose) | 24.x | https://www.docker.com/products/docker-desktop |
| Node.js     | 18.x o superior | https://nodejs.org                     |

> **Windows:** Habilitar WSL 2 en Docker Desktop.  
> **Mac:** Aceptar los permisos de red al primer arranque de Docker.  
> **Ubuntu:** Agregar tu usuario al grupo docker: `sudo usermod -aG docker $USER` (requiere cerrar sesion).

---

## Instalacion y Arranque

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd BancoBCP
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y edita las credenciales si es necesario:

```bash
cp .env.example .env
```

> El script de arranque realiza este paso automaticamente si `.env` no existe.

### 3. Levantar el sistema

```bash
node start-bcp.js
```

El script detiene contenedores previos, construye las imagenes y levanta los tres servicios (base de datos, backend y frontend) en modo background. La primera ejecucion puede tardar varios minutos mientras Docker descarga las imagenes base.

---

## Acceso al Sistema

Una vez que el script finalice, el sistema estara disponible en:

| Servicio    | URL                              | Descripcion                        |
|-------------|----------------------------------|------------------------------------|
| Frontend    | http://localhost:3000            | Interfaz web React                 |
| API REST    | http://localhost:5001/api        | Backend Express                    |
| Health Check| http://localhost:5001/api/health | Estado de la conexion a la BD      |

**Credenciales de acceso por defecto (entorno de desarrollo):**

| Campo    | Valor    |
|----------|----------|
| Usuario  | `admin`  |
| Password | `admin123` |

> Cambiar estas credenciales antes de cualquier despliegue fuera del entorno local.

---

## Comandos Utiles

```bash
# Ver logs del backend en tiempo real
docker compose logs -f backend

# Ver logs del frontend
docker compose logs -f frontend

# Detener todos los contenedores
docker compose down

# Resetear la base de datos (borra todos los datos)
docker compose down -v && node start-bcp.js
```

---

## Estructura del Proyecto

```
BancoBCP/
├── backend/
│   ├── db/
│   │   └── init.sql          # Esquema completo (18 tablas, 3FN)
│   ├── src/
│   │   ├── config/           # Conexion a PostgreSQL
│   │   ├── middlewares/      # JWT, manejo de errores
│   │   ├── routes/           # Definicion de endpoints
│   │   ├── controllers/      # Manejo de request/response
│   │   ├── services/         # Logica de negocio
│   │   └── repositories/     # Acceso a datos
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/              # Cliente HTTP centralizado
│   │   ├── pages/            # Paginas por modulo
│   │   ├── components/       # Componentes reutilizables
│   │   ├── context/          # Contexto de autenticacion
│   │   └── hooks/            # Custom hooks
│   └── Dockerfile
├── docker-compose.yml        # Orquestacion de servicios
├── start-bcp.js              # Script de arranque unificado
└── .env.example              # Plantilla de variables de entorno
```

---

## Roles del Equipo

| Integrante    | Modulo responsable                              |
|---------------|-------------------------------------------------|
| Denis         | Transacciones (depositos, retiros, transferencias) |
| Alejandro S.  | Identidad (autenticacion, usuarios, seguridad)  |
| Yessica       | Cuentas (alta, consulta, actualizacion)         |
| Alejandro P.  | Creditos (solicitud, aprobacion, cuotas)        |

---

## Endpoints Principales

### Autenticacion
| Metodo | Ruta              | Auth        | Descripcion                                               |
|--------|-------------------|-------------|-----------------------------------------------------------|
| POST   | /api/auth/login   | No          | Iniciar sesion. Retorna JWT con `{ id, username, rol, roles[] }` |

### Usuarios *(solo administradores)*
| Metodo | Ruta                  | Auth        | Descripcion                     |
|--------|-----------------------|-------------|---------------------------------|
| GET    | /api/usuarios         | JWT + admin | Listar usuarios del sistema     |
| GET    | /api/usuarios/:id     | JWT + admin | Obtener usuario por ID          |
| POST   | /api/usuarios         | JWT + admin | Crear usuario                   |
| PUT    | /api/usuarios/:id     | JWT + admin | Actualizar usuario              |
| DELETE | /api/usuarios/:id     | JWT + admin | Eliminar usuario                |

### Clientes
| Metodo | Ruta                | Auth | Descripcion                     |
|--------|---------------------|------|---------------------------------|
| GET    | /api/clientes       | JWT  | Listar clientes                 |
| POST   | /api/clientes       | JWT  | Registrar cliente               |
| GET    | /api/clientes/:id   | JWT  | Obtener cliente por ID          |
| PUT    | /api/clientes/:id   | JWT  | Actualizar cliente              |
| DELETE | /api/clientes/:id   | JWT  | Eliminar cliente (soft delete)  |

### Cuentas
| Metodo | Ruta              | Auth | Descripcion                     |
|--------|-------------------|------|---------------------------------|
| GET    | /api/cuentas      | JWT  | Listar cuentas                  |
| POST   | /api/cuentas      | JWT  | Crear cuenta                    |

### Transacciones
| Metodo | Ruta                              | Auth | Descripcion                     |
|--------|-----------------------------------|------|---------------------------------|
| GET    | /api/transacciones                | JWT  | Listar transacciones            |
| POST   | /api/transacciones/deposito       | JWT  | Realizar deposito               |
| POST   | /api/transacciones/retiro         | JWT  | Realizar retiro                 |
| POST   | /api/transacciones/transferencia  | JWT  | Transferir entre cuentas        |

---

## Solucion de Problemas Comunes

**El frontend no carga / error de CORS**  
Verificar que `REACT_APP_API_URL` en `.env` apunte a `http://localhost:5001/api`.

**Error de conexion a la base de datos**  
Esperar 15-20 segundos adicionales para que PostgreSQL termine de inicializarse. Verificar con `docker compose logs postgres`.

**Puerto ya en uso**  
Detener otros procesos que usen los puertos 3000, 5001 o 5432 antes de ejecutar el sistema.

**Cambios en el codigo no se reflejan**  
Ejecutar `docker compose up -d --build` para reconstruir las imagenes.
