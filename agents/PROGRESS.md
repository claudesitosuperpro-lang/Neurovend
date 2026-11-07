# NEUROVEND — Estado del Desarrollo y Próximos Pasos

**Última actualización:** 2026-11-07

---

## RESUMEN DE ESTADO

| Componente | Estado |
|-----------|--------|
| NEUROVEND.Core | ✅ COMPLETO |
| NEUROVEND.Infrastructure | ✅ COMPLETO |
| NEUROVEND.API | ✅ COMPLETO |
| NEUROVEND.HardwareBridge | ✅ COMPLETO |
| NEUROVEND.Tests | ⬜ PENDIENTE (no prioritario) |
| schema.sql | ✅ LISTO (incluye categoria) |
| Frontend Angular | ✅ COMPLETO Y EN PRODUCCIÓN |
| Configuración Supabase | ✅ CONECTADO Y FUNCIONANDO |

---

## LO QUE ESTÁ HECHO (al 2026-11-07)

### Backend
- `.NET 9` Minimal APIs — todos los endpoints implementados y compilando
- Supabase configurado, schema ejecutado, admin `admin/Admin1234` funcionando con BCrypt real
- HardwareBridge en puerto 5001
- **Endpoint `GET /api/productos/categorias`** — devuelve categorías únicas activas
- **Endpoint `GET /api/productos/?categoria=`** — filtra por categoría en POS
- **Endpoint `GET /api/ventas/cierre?inicio=&fin=`** — cierre de caja con desglose por categoría

### Frontend Angular 22 + PrimeNG 22
- **Core completo:** models, auth.service, hardware.service, api.service, interceptor, guards
- **SoundService**: beep programático con Web Audio API (sin archivo de audio)
- **Login:** pantalla completa con validación y JWT
- **POS Dashboard (`/pos`):**
  - Búsqueda de productos con debounce 300ms
  - **Chips de categoría** bajo el buscador para filtrar por categoría (aparecen solo si hay categorías definidas)
  - Grid de productos con cards clickables
  - Múltiples cuentas (custom tabs) — cada una es una Venta en Supabase
  - Tabla de detalles editable (cantidad inline con InputNumber)
  - Diálogos para productos de peso (kg) y unidad (cantidad)
  - Leer báscula desde HardwareBridge
  - Botones: Limpiar cuenta, Cobrar, Nueva cuenta, Cerrar cuenta
  - **Sonido beep** al confirmar agregar un producto a la cuenta
  - Navbar con menú para dueños: Productos, Reportes, Cierre de caja, Mis ventas, Usuarios, Configuración
- **CobrarComponent:**
  - Dos pasos: cobrar (efectivo/tarjeta) → imprimir ticket
  - Efectivo: monto recibido, cálculo de cambio en tiempo real
  - **Botón "Exacto"** para setear monto recibido = total en un clic
  - Impresión ESC/POS vía HardwareBridge (base64)
- **Gestión Productos (`/productos`):**
  - Tabla con columna Categoría (badge morado)
  - CRUD completo: crear, editar, toggle activo, eliminar con ConfirmDialog
  - Formulario incluye campo **Categoría** (texto libre)
- **Reportes (`/reportes`):** DatePicker rango, lista de ventas expandibles, cards de resumen
- **Cierre de Caja (`/cierre-caja`) — NUEVO:**
  - DatePicker rango (hoy por defecto)
  - Cards: total ventas, monto total, efectivo, tarjeta, ticket promedio
  - Tabla de ventas por categoría con barra de porcentaje visual
  - Solo accesible para dueños
- **Usuarios (`/usuarios`):** lista, crear, editar, toggle activo, protección auto-desactivación
- **Mis Ventas (`/mis-ventas`):** con reimpresión de ticket
- **Configuración (`/configuracion`):** impresora + báscula + HardwareBridge
- **Routing:** todas las rutas lazy-loaded con guards (authGuard, duenoGuard)
- **Build:** compila sin errores ✅

### BD (Supabase)
- `productos.categoria VARCHAR(50)` — columna nullable, ya ejecutada ✅
- `idx_productos_categoria` — índice sobre categoria ✅
- Productos existentes antes de 2026-11-07 tienen `categoria = NULL` → asignar desde Gestión de Productos

---

## PENDIENTE

### Funcional
1. **Asignar categorías a productos existentes** — hacerlo manualmente desde /productos
2. **Reimprimir ticket en Reportes** — botón pendiente (requiere reconstruir ticket ESC/POS desde VentaResumenDto)

### Técnico
1. **Seguridad CRÍTICA**: appsettings.json tiene credenciales Supabase y JWT key en git. Rotar contraseña Supabase y JWT key, actualizar secrets en Fly.io.
2. **Local dev apunta a producción**: apiInterceptor hardcodea fly.io sin excepción para localhost.

---

## DECISIONES DE DISEÑO TOMADAS (NO REABRIR)

| Decisión | Elegido | Motivo |
|----------|---------|--------|
| Backend | .NET 9 Minimal APIs | Rendimiento, tipado fuerte |
| Database | Supabase cloud | Multi-usuario, sin servidor local |
| Auth | JWT propio (12h) | Simple, no depende de Supabase Auth |
| Frontend | Angular 22 | Escalable, tipado |
| ORM | Dapper | Queries SQL directas, sin magic |
| Estado Angular | Signals | Sin NgRx, suficiente para este tamaño |
| Hardware | Bridge local .exe | Acceso a COM/USB sin backend cloud |
| PrimeNG | v22 | Táctil/tablet, componentes completos |
| Temas PrimeNG | @primeuix/themes/Aura | Reemplaza @primeng/themes deprecated |
| Categorías | Texto libre en producto | Sin tabla separada, sin overhead |
| Sonido | Web Audio API (programático) | Sin archivo de audio extra |

---

## NOTAS TÉCNICAS CRÍTICAS

### PrimeNG 22 — Selectores de componentes
Los selectores son **lowercase**. En templates HTML usar:
- `<p-inputnumber>` (NO `<p-inputNumber>`)
- `<p-datepicker>` (NO `<p-datePicker>`)
- `<p-selectbutton>` (NO `<p-selectButton>`)
- `<p-toggleswitch>` (NO `<p-toggleSwitch>`)
- `<p-confirmdialog>` (NO `<p-confirmDialog>`)
- `<p-dialog>`, `<p-button>`, `<p-toast>`, `<p-menubar>`, `<p-select>` — ya son lowercase

Las directivas de atributo sí son camelCase: `pInputText`, `pTemplate`, etc.

### Angular 22 — Signals pattern
```typescript
// Siempre inject() en campos, no en constructor
private api = inject(ApiService);

// Signals para estado local
cargando = signal(false);
cuentaActual = computed(() => this.cuentas()[this.cuentaIndex()] ?? null);
```

### Animaciones PrimeNG
`@angular/animations` debe instalarse y `provideAnimationsAsync()` en AppModule.

### Proxy dev
`/api` → `http://localhost:5115` vía `proxy.conf.json`

### HardwareBridge
Calls van **directamente** a `http://localhost:5001` (NO via proxy `/api`)

---

## COMANDOS

```powershell
# Backend API
cd C:\NEUROVEND\backend\NEUROVEND.API && dotnet run

# HardwareBridge
cd C:\NEUROVEND\backend\NEUROVEND.HardwareBridge && dotnet run

# Frontend
cd C:\NEUROVEND\frontend\neurovend-web && ng serve

# Build frontend
cd C:\NEUROVEND\frontend\neurovend-web && npx ng build --configuration=development
```
