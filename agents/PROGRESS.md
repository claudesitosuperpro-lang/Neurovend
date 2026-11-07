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
| schema.sql | ✅ LISTO (tabla categorias + columna categoria en productos) |
| Frontend Angular | ✅ COMPLETO Y EN PRODUCCIÓN |
| Fly.io deploy | ✅ versión 7 |

---

## LO QUE ESTÁ HECHO (al 2026-11-07)

### Backend — Endpoints completos
| Ruta | Descripción |
|------|-------------|
| POST `/api/auth/login` | Login JWT |
| POST `/api/auth/register` | Registro (dueño) |
| GET/PUT `/api/configuracion/` | Config impresora/báscula |
| GET `/api/productos/` | POS: activos, filtrable por `?q=` y `?categoria=` |
| GET `/api/productos/gestion` | Gestión: todos inc. inactivos |
| GET `/api/productos/categorias` | Lista categorías desde tabla `categorias` |
| POST/PUT/PATCH/DELETE `/api/productos/` | CRUD productos |
| **GET `/api/categorias/`** | Listar categorías |
| **POST `/api/categorias/`** | Crear categoría (dueño, valida duplicados) |
| **DELETE `/api/categorias/{id}`** | Eliminar categoría (dueño) |
| POST `/api/ventas/` | Crear venta pendiente |
| GET `/api/ventas/{id}/detalles` | Detalles de venta |
| POST/PUT/DELETE `/api/ventas/{id}/productos` | Agregar/actualizar/eliminar producto |
| POST `/api/ventas/{id}/finalizar` | Finalizar venta |
| DELETE `/api/ventas/{id}` | Cancelar venta |
| GET `/api/ventas/mis-ventas` | Ventas del usuario autenticado |
| GET `/api/ventas/reportes` | Reportes por rango (dueño) |
| **GET `/api/ventas/cierre`** | Cierre de caja con desglose por categoría (dueño) |
| GET/PUT/PATCH/DELETE `/api/usuarios/` | Gestión usuarios (dueño) |

### Frontend Angular 22 + PrimeNG 22 — Pantallas
| Ruta | Descripción | Guard |
|------|-------------|-------|
| `/login` | Login JWT | — |
| `/pos` | POS principal con multi-cuentas | auth |
| `/productos` | Gestión productos + gestión categorías | auth + dueño |
| `/reportes` | Reportes por rango de fechas | auth + dueño |
| `/cierre-caja` | Cierre de caja con desglose por categoría | auth + dueño |
| `/usuarios` | Gestión de usuarios | auth + dueño |
| `/mis-ventas` | Ventas propias con reimpresión | auth |
| `/configuracion` | Config impresora/báscula | auth + dueño |

### Features destacadas
- **Categorías como entidad propia**: tabla `categorias` independiente, CRUD en `/productos`, dropdown en form de producto, confirmación antes de eliminar (evita accidente de dedo)
- **Filtro por categoría en POS**: `<p-select>` dropdown al lado del buscador, siempre visible
- **Cierre de caja**: cards resumen + tabla por categoría con barra de porcentaje visual
- **Sonido al agregar**: beep programático Web Audio API (sin archivo de audio)
- **Cobro exacto**: botón "Exacto" setea monto recibido = total
- **POS multi-cuentas**: estado persiste entre navegación (PosStateService singleton)
- **HardwareBridge**: báscula + impresora ESC/POS, degrada graciosamente si no disponible

### BD (Supabase) — schema actual
Tablas: `usuarios`, `categorias`, `productos` (col. `categoria`), `ventas`, `detalle_venta`, `pagos`, `configuracion`

Schema completo en `schema.sql` — idempotente con `IF NOT EXISTS`.

---

## PENDIENTE

1. **Reimprimir ticket en Reportes** — botón pendiente (reconstruir ticket ESC/POS desde VentaResumenDto)
2. **Seguridad CRÍTICA** — appsettings.json tiene credenciales Supabase y JWT key en git. Rotar y actualizar secrets en Fly.io.
3. **Local dev apunta a producción** — apiInterceptor hardcodea fly.io sin excepción para localhost.

---

## DECISIONES DE DISEÑO (NO REABRIR)

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
| Categorías | Tabla propia `categorias` | Evita inconsistencias de texto libre |
| Sonido | Web Audio API (programático) | Sin archivo de audio extra |

---

## NOTAS TÉCNICAS CRÍTICAS

### PrimeNG 22 — Selectores lowercase en templates
`<p-inputnumber>`, `<p-datepicker>`, `<p-selectbutton>`, `<p-toggleswitch>`, `<p-confirmdialog>`, `<p-select>`
Directivas de atributo sí son camelCase: `pInputText`, `pTemplate`.

### Angular 22 — Signals
```typescript
private api = inject(ApiService); // inject() en campo, no constructor
cargando = signal(false);
cuentaActual = computed(() => this.cuentas()[this.cuentaIndex()] ?? null);
```

### Deploy Fly.io
```powershell
flyctl deploy --depot=false   # usar si falla el builder Depot por TLS
```

### Proxy dev
`/api` → `http://localhost:5115` vía `proxy.conf.json`
HardwareBridge calls van directo a `http://localhost:5001`

---

## COMANDOS

```powershell
# Backend API
cd C:\NEUROVEND\backend\NEUROVEND.API && dotnet run

# Frontend dev
cd C:\NEUROVEND\frontend\neurovend-web && ng serve

# Build frontend
cd C:\NEUROVEND\frontend\neurovend-web && npx ng build --configuration=development

# Deploy backend
cd C:\NEUROVEND && flyctl deploy --depot=false
```
