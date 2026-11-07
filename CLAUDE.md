# NEUROVEND — Instrucciones para Claude Code

## Qué es este proyecto
Sistema POS (Point of Sale) moderno construido en .NET 9 + Angular 18 + Supabase.
Es una reescritura completa de `fruteria-pos` (Java/Swing/PostgreSQL local) con stack web, cloud y soporte multi-usuario.

## Contexto completo del proyecto
Leer obligatoriamente antes de cualquier tarea:
- [`agents/PROJECT_CONTEXT.md`](agents/PROJECT_CONTEXT.md) — arquitectura, decisiones, modelos de datos, stack
- [`agents/PROGRESS.md`](agents/PROGRESS.md) — estado actual detallado, pasos completados y qué sigue

## Estructura del proyecto
```
C:\NEUROVEND\
├── CLAUDE.md                  ← estás aquí
├── NEUROVEND.sln              ← solución .NET
├── schema.sql                 ← esquema SQL para ejecutar en Supabase
├── backend\
│   ├── NEUROVEND.Core\        ← Entidades, Interfaces, DTOs
│   ├── NEUROVEND.Infrastructure\ ← Repositorios + Servicios (Dapper)
│   ├── NEUROVEND.API\         ← Minimal APIs, Program.cs
│   ├── NEUROVEND.HardwareBridge\ ← App local puerto 5001 (báscula/impresora)
│   └── NEUROVEND.Tests\       ← xUnit (vacío, pendiente)
└── frontend\
    └── neurovend-web\         ← Angular 18 app (TODO: construir)
```

## Estado actual (2026-11-07)
**Sistema COMPLETO Y EN PRODUCCIÓN.** Backend en Fly.io, frontend en Vercel.
- Frontend: Angular 22 + PrimeNG 22, todas las pantallas implementadas y funcionando.
- Últimas features agregadas: categorías de productos, cierre de caja, sonido al agregar, cobro exacto.

## Pendiente prioritario
1. Reimprimir ticket en Reportes (reconstruir ESC/POS desde VentaResumenDto)
2. Seguridad: rotar credenciales Supabase y JWT key (están en git en texto plano)

Ver `agents/PROGRESS.md` para el estado detallado.

## Decisiones importantes (NO cambiar sin discutir)
- UI Library: **PrimeNG** (mejor para táctil/tablet) o Angular Material — decidir al inicio del frontend
- Estado: **Angular Signals** (no NgRx, innecesario para este tamaño)
- HardwareBridge corre en `localhost:5001` — el frontend lo detecta con `GET /` y degrada graciosamente
- Passwords: BCrypt (ya implementado en backend)
- JWT 12h, claims: sub(id), unique_name(username), role, nombre, id
- CORS configurado solo para `localhost:4200`
