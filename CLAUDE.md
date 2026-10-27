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

## Estado actual (2026-10-26)
**Backend: COMPLETO Y COMPILA.** Todos los endpoints, repositorios y servicios están implementados.
**Frontend: PENDIENTE.** Solo el scaffolding de Angular existe. Toda la UI está por construir.

## Próxima tarea inmediata
Construir el frontend Angular. Empezar por:
1. Configurar Supabase (connection string en appsettings.json)
2. AuthModule (Login + JWT)
3. PosModule (Dashboard principal)

Ver `agents/PROGRESS.md` para el plan detallado.

## Decisiones importantes (NO cambiar sin discutir)
- UI Library: **PrimeNG** (mejor para táctil/tablet) o Angular Material — decidir al inicio del frontend
- Estado: **Angular Signals** (no NgRx, innecesario para este tamaño)
- HardwareBridge corre en `localhost:5001` — el frontend lo detecta con `GET /` y degrada graciosamente
- Passwords: BCrypt (ya implementado en backend)
- JWT 12h, claims: sub(id), unique_name(username), role, nombre, id
- CORS configurado solo para `localhost:4200`
