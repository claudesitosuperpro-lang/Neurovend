# NEUROVEND — Estado del Desarrollo y Próximos Pasos

**Última actualización:** 2026-10-27

---

## RESUMEN DE ESTADO

| Componente | Estado |
|-----------|--------|
| NEUROVEND.Core | ✅ COMPLETO |
| NEUROVEND.Infrastructure | ✅ COMPLETO |
| NEUROVEND.API | ✅ COMPLETO |
| NEUROVEND.HardwareBridge | ✅ COMPLETO |
| NEUROVEND.Tests | ⬜ PENDIENTE (no prioritario) |
| schema.sql | ✅ LISTO |
| Frontend Angular | 🟡 EN PROGRESO — ~90% completo |
| Configuración Supabase | ✅ CONECTADO Y FUNCIONANDO |

---

## LO QUE ESTÁ HECHO (al 2026-10-27)

### Backend
- `.NET 9` Minimal APIs — todos los endpoints implementados y compilando
- Supabase configurado, schema ejecutado, admin `admin/Admin1234` funcionando con BCrypt real
- HardwareBridge en puerto 5001

### Frontend Angular 22 + PrimeNG 22
- **Core completo:** models, auth.service, hardware.service, api.service, interceptor, guards
- **Login:** pantalla completa con validación y JWT
- **POS Dashboard (`/pos`):**
  - Búsqueda de productos con debounce 300ms
  - Grid de productos con cards clickables
  - Múltiples cuentas (custom tabs) — cada una es una Venta en Supabase
  - Tabla de detalles editable (cantidad inline con InputNumber)
  - Diálogos para productos de peso (kg) y unidad (cantidad)
  - Leer báscula desde HardwareBridge
  - Botones: Limpiar cuenta, Cobrar, Nueva cuenta, Cerrar cuenta
  - Navbar con menú para dueños (Productos, Reportes, Usuarios, Configuración)
  - Integración CobrarComponent
- **CobrarComponent:**
  - Dos pasos: cobrar (efectivo/tarjeta) → imprimir ticket
  - Efectivo: monto recibido, cálculo de cambio en tiempo real
  - Impresión ESC/POS vía HardwareBridge (base64)
  - Botón Imprimir deshabilitado si HardwareBridge no disponible
- **Gestión Productos (`/productos`):**
  - Tabla de todos los productos (activos e inactivos)
  - CRUD completo: crear, editar, toggle activo, eliminar con ConfirmDialog
  - Formulario con SelectButton tipo venta (peso/unidad), precios, stock
- **Reportes (`/reportes`):**
  - DatePicker rango desde/hasta
  - Lista de ventas con expand para ver detalles
  - Cards de resumen: número de ventas + monto total
- **Usuarios (`/usuarios`):**
  - Formulario registro nuevo usuario (nombre, username, password, rol)
  - SelectButton para rol (empleado/dueño)
- **Configuración (`/configuracion`):**
  - Sección impresora: nombre (dropdown si HardwareBridge disponible), encabezado ticket
  - Sección báscula: puerto COM (dropdown), baudrate
  - Recarga automática de dispositivos vía HardwareBridge
- **Routing:** todas las rutas lazy-loaded con guards (authGuard, duenoGuard)
- **Build:** compila sin errores ✅

---

## PENDIENTE

### Funcional
1. **Estilos globales / pulido visual** — layout general, responsive para tablet
2. **Probar flujo completo:** login → POS → agregar productos → cobrar → imprimir
3. **Probar rutas dueño:** productos, reportes, usuarios, configuración

### Técnico menor
1. Eliminar imports no usados en cobrar.component.ts (warnings de compilación)
2. Considerar PosComponent: inicializar `localCantidades` cuando se cargue la primera cuenta
3. En Reportes: botón reimprimir (requiere reconstruir ticket ESC/POS desde VentaResumenDto)

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
