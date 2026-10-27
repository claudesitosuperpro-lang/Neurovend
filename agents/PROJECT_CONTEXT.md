# NEUROVEND — Contexto Completo del Proyecto

## Origen: fruteria-pos (proyecto base)

**Repositorio original:** `C:\fruteria-pos` (Java 11, Maven, Spring JDBC, Swing UI, PostgreSQL local)

NEUROVEND es una **reescritura completa** de fruteria-pos. No es un port 1:1 — hay mejoras deliberadas.
El proyecto original es la referencia funcional: TODO lo que hace debe estar en NEUROVEND.

---

## Stack tecnológico de NEUROVEND

| Capa | Tecnología |
|------|-----------|
| Backend | C# .NET 9, ASP.NET Minimal APIs |
| Frontend | Angular 18 (TypeScript), SCSS |
| Base de datos | Supabase (PostgreSQL cloud, plan gratuito) |
| Auth | JWT (12h) + BCrypt para passwords |
| Hardware Bridge | Proceso local .NET 9, puerto localhost:5001 |
| ORM/DB | Dapper 2.1.89 + Npgsql 9.0.3 |

---

## Modelos de datos (schema.sql)

Ejecutar `C:\NEUROVEND\schema.sql` UNA VEZ en el SQL Editor de Supabase.

### Tabla: usuarios
```sql
id SERIAL PK, nombre VARCHAR(100), username VARCHAR(50) UNIQUE,
password_hash VARCHAR(255), rol VARCHAR(10) CHECK ('dueño'|'empleado'),
creado_en TIMESTAMPTZ DEFAULT NOW()
```
Usuario inicial: username=`admin`, password=`Admin1234` (cambiar tras primer login).
**IMPORTANTE:** El hash BCrypt en schema.sql es un placeholder — generar uno real con `BCrypt.Net.BCrypt.HashPassword("Admin1234")`.

### Tabla: productos
```sql
id SERIAL PK, codigo VARCHAR(50) UNIQUE, nombre VARCHAR(150),
precio_por_kg DECIMAL(10,2), precio_por_unidad DECIMAL(10,2),
tipo_venta VARCHAR(10) CHECK ('peso'|'unidad'),
stock DECIMAL(10,3), activo BOOLEAN DEFAULT true,
imagen_url TEXT, -- MEJORA sobre original
creado_en TIMESTAMPTZ DEFAULT NOW()
```

### Tabla: ventas
```sql
id SERIAL PK, usuario_id INT FK→usuarios,
fecha TIMESTAMPTZ DEFAULT NOW(), total DECIMAL(10,2),
metodo_pago VARCHAR(10) CHECK ('efectivo'|'tarjeta'),
estado VARCHAR(15) CHECK ('pendiente'|'completada'|'cancelada'),
fecha_venta TIMESTAMPTZ
```

### Tabla: detalle_venta
```sql
id SERIAL PK, venta_id INT FK→ventas, producto_id INT FK→productos,
cantidad_kg DECIMAL(10,3), cantidad_unidades INT,
precio_unitario DECIMAL(10,2), -- MEJORA: snapshot del precio al momento de venta
subtotal DECIMAL(10,2),
UNIQUE(venta_id, producto_id)
```

### Tabla: pagos
```sql
id SERIAL PK, venta_id INT UNIQUE FK→ventas,
monto_recibido DECIMAL(10,2), cambio_devuelto DECIMAL(10,2),
transaccion_id VARCHAR(100)
```

### Tabla: configuracion
```sql
id SERIAL PK (siempre id=1), puerto_bascula VARCHAR(20) DEFAULT 'COM3',
baudrate INT DEFAULT 9600, nombre_impresora VARCHAR(200),
encabezado_ticket TEXT, -- max 200 chars
actualizado_en TIMESTAMPTZ DEFAULT NOW()
```

---

## Arquitectura del backend

### NEUROVEND.Core (entidades, interfaces, DTOs)
- **Entities:** `Producto`, `Usuario`, `Venta`, `DetalleVenta`, `Pago`, `Configuracion`
- **Interfaces:** `IProductoRepository`, `IUsuarioRepository`, `IVentaRepository`, `IConfiguracionRepository`, `IAuthService`, `IProductoService`, `IVentaService`, `IConfiguracionService`, `ITokenService`, `IStorageService`
- **DTOs:** `LoginRequest/Response`, `RegisterRequest`, `ProductoDto`, `CreateProductoRequest`, `UpdateProductoRequest`, `AgregarProductoRequest`, `UpdateCantidadRequest`, `FinalizarVentaRequest`, `DetalleVentaDto`, `VentaResumenDto`, `ConfiguracionDto`

### NEUROVEND.Infrastructure (Dapper + Npgsql)
**Repositorios:**
- `ProductoRepository` — `GetAllAsync` (activos, ORDER BY creado_en ASC, id ASC), `SearchAsync`, `GetAllParaGestionAsync` (todos), `GetByIdAsync`, `GetByCodigoExactoAsync`, `CreateAsync`, `UpdateAsync`, `DeleteAsync` (soft delete → activo=false), `ToggleActivoAsync`, `UpdateStockAsync`
- `UsuarioRepository` — `GetByUsernameAsync`, `ExistsByUsernameAsync`, `CreateAsync`
- `VentaRepository` — `CrearVentaPendienteAsync`, `AgregarOActualizarProductoAsync` (upsert con acumulación de cantidades), `EliminarProductoAsync`, `GetDetallesAsync`, `UpdateCantidadAsync`, `FinalizarVentaAsync`, `CancelarVentaAsync`, `GetVentasPorFechaAsync`, `GetByIdAsync`
- `ConfiguracionRepository` — `GetAsync`, `SaveAsync` (upsert id=1 siempre)

**Servicios:**
- `AuthService` — BCrypt.Verify en login, BCrypt.HashPassword en registro
- `TokenService` — genera JWT con claims: `sub`(id), `unique_name`(username), `role`(rol), `nombre`, `id`
- `ProductoService` — validaciones + delega a repositorio
- `VentaService` — valida cantidades, captura snapshot de precio al agregar producto
- `ConfiguracionService` — delega a repositorio

### NEUROVEND.API (Minimal APIs en Program.cs)

**Endpoints Auth:**
- `POST /api/auth/login` — recibe `{username, password}`, devuelve JWT
- `POST /api/auth/register` — requiere rol `dueño`

**Endpoints Productos:**
- `GET /api/productos/` — lista activos (POS), ORDER BY creado_en ASC
- `GET /api/productos/gestion` — lista todos (admin, requiere dueño)
- `GET /api/productos/{id}`
- `GET /api/productos/codigo/{codigo}` — búsqueda exacta por código (scan barcode)
- `POST /api/productos/` — requiere dueño
- `PUT /api/productos/{id}` — requiere dueño
- `PATCH /api/productos/{id}/activo` — toggle activo/inactivo, requiere dueño
- `DELETE /api/productos/{id}` — soft delete, requiere dueño

**Endpoints Ventas:**
- `POST /api/ventas/` — crea venta pendiente para el usuario autenticado
- `GET /api/ventas/{ventaId}/detalles` — lista productos de la cuenta
- `POST /api/ventas/{ventaId}/productos` — agrega o acumula producto en cuenta
- `PUT /api/ventas/{ventaId}/productos/{productoId}` — actualiza cantidad directamente
- `DELETE /api/ventas/{ventaId}/productos/{productoId}` — elimina producto de cuenta
- `POST /api/ventas/{ventaId}/finalizar` — body: `{metodoPago, montoRecibido}` → registra pago, actualiza stock
- `DELETE /api/ventas/{ventaId}` — cancela venta pendiente
- `GET /api/ventas/reportes?desde=&hasta=` — requiere dueño

**Endpoints Configuración:**
- `GET /api/configuracion/` — requiere dueño
- `PUT /api/configuracion/` — requiere dueño

**Infraestructura Program.cs:**
- JWT Bearer auth configurado
- CORS permitido para `http://localhost:4200`
- Manejo global de excepciones (middleware)
- DI de todos los servicios y repositorios

### NEUROVEND.HardwareBridge (localhost:5001)
Proceso independiente que corre en la PC con USB. El frontend lo llama directamente.
- `GET /` — health check (el frontend hace ping aquí)
- `GET /peso?puerto=COM3&baudrate=9600` — lee báscula serial (jSerialComm → System.IO.Ports)
- `GET /puertos` — lista puertos COM disponibles en el sistema
- `GET /impresoras` — lista impresoras instaladas (Windows)
- `POST /imprimir` — body: `{ impresora: string, contenidoBase64: string }` — imprime ESC/POS via P/Invoke (Windows API)

**Protocolo báscula:** puerto configurable (default COM3), baudrate 9600, envía byte `0x50` ('P'), lee respuesta.

---

## Configuración (✅ COMPLETADA)

`C:\NEUROVEND\backend\NEUROVEND.API\appsettings.json` — ya configurado con credenciales reales:
- Supabase host: `db.qanxkhtthwnssipjjjgx.supabase.co`
- JWT Key: string de 48 chars configurado
- schema.sql ejecutado en Supabase, todas las tablas creadas
- Usuario admin: `admin / Admin1234` (hash BCrypt real en DB)

---

## Arquitectura Frontend Angular (✅ IMPLEMENTADA)

**Stack:** Angular 22 + PrimeNG 21 + @primeuix/themes (Aura) + jwt-decode

**Patrón:** AppModule (NgModule raíz) + features como componentes **standalone** con lazy loading via `loadComponent`.

**Estructura implementada:**
```
src/app/
├── core/
│   ├── models/index.ts             — interfaces: UsuarioLogueado, Producto, DetalleVenta,
│   │                                  AgregarProductoRequest (cantidad unificada),
│   │                                  FinalizarVentaRequest (metodoPago, montoRecibido, cambio),
│   │                                  VentaResumenDto, Configuracion, CuentaPos
│   ├── services/
│   │   ├── auth.service.ts         — signals: usuario, isAuthenticated, isDueno; TOKEN_KEY='nv_token'
│   │   └── hardware.service.ts     — signal disponible; métodos async con firstValueFrom
│   ├── interceptors/
│   │   └── jwt.interceptor.ts      — Bearer token, excluye localhost:5001
│   └── guards/
│       ├── auth.guard.ts           — redirige a /login
│       └── dueno.guard.ts          — redirige a /pos
├── features/
│   ├── auth/login/login.component  ✅ completo
│   └── pos/pos.component           skeleton (header + hardware banner)
└── proxy.conf.json                 /api → http://localhost:5115
```

**Inyección en campos de clase:** usar `inject()`, no constructor injection (para poder referenciar en inicializadores de campos).

---

## Mejoras sobre fruteria-pos (el original)

| Mejora | Descripción |
|--------|-------------|
| BCrypt | Passwords con hash (antes texto plano) |
| imagen_url | Campo para imagen de producto (Supabase Storage o URL externa) |
| precio_unitario snapshot | Precio guardado al momento de agregar (no recalculado con precio actual) |
| Toggle activo | `PATCH /api/productos/{id}/activo` desde UI |
| Orden de productos | ORDER BY creado_en ASC, id ASC (consistente) |
| Sin integración externa | Tarjeta solo registra método, sin Clip/pasarela |
| Multi-usuario real | Cloud Supabase, no base de datos local |
| Responsive | Tablet táctil y móvil |

---

## Funcionalidades que DEBEN existir (del original)

1. Login/Auth — username+password, roles dueño/empleado
2. Dashboard POS — búsqueda en tiempo real (nombre o código), scan barcode (Enter con código exacto), navegación teclado (↑↓ Enter), productos por peso (llama báscula), por unidad (pide cantidad)
3. Múltiples cuentas simultáneas — varias ventas pendientes con navegación ← →, limpiar cuenta, eliminar cuenta
4. Cuenta editable — cambiar cantidad directamente en la tabla
5. Cobrar — Efectivo (cambio en tiempo real) + Tarjeta (sin integración). Pregunta si imprimir ticket.
6. Impresión ESC/POS — impresora térmica USB por nombre del sistema (vía HardwareBridge)
7. Gestión Productos (solo dueño) — CRUD: código, nombre, precio, tipo, stock, activo, imagen; búsqueda
8. Registro Usuarios (solo dueño)
9. Configuración (solo dueño) — puerto báscula (dropdown COM desde HardwareBridge), nombre impresora, encabezado ticket (multilinea, max 200 chars)
10. Reportes de Ventas (solo dueño) — filtro rango fechas, tabla ID/fecha/total/método/quién atendió, reimprimir ticket, total general
