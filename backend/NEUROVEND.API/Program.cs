using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using NEUROVEND.Core.DTOs.Auth;
using NEUROVEND.Core.DTOs.Configuracion;
using NEUROVEND.Core.DTOs.Productos;
using NEUROVEND.Core.DTOs.Usuarios;
using NEUROVEND.Core.DTOs.Ventas;
using NEUROVEND.Core.Entities;
using NEUROVEND.Core.Interfaces;
using NEUROVEND.Infrastructure.Repositories;
using NEUROVEND.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Supabase")
    ?? throw new InvalidOperationException("ConnectionStrings:Supabase no configurado en appsettings.json");

// ─── Repositorios ────────────────────────────────────────────────────────────
builder.Services.AddSingleton<IProductoRepository>(_ => new ProductoRepository(connectionString));
builder.Services.AddSingleton<IUsuarioRepository>(_ => new UsuarioRepository(connectionString));
builder.Services.AddSingleton<IVentaRepository>(_ => new VentaRepository(connectionString));
builder.Services.AddSingleton<IConfiguracionRepository>(_ => new ConfiguracionRepository(connectionString));

// ─── Servicios ───────────────────────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProductoService, ProductoService>();
builder.Services.AddScoped<IVentaService, VentaService>();
builder.Services.AddScoped<IConfiguracionService, ConfiguracionService>();
builder.Services.AddSingleton<ITokenService, TokenService>();

// ─── JWT ─────────────────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key no configurado");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// ─── CORS ─────────────────────────────────────────────────────────────────────
var allowedOrigins = (builder.Configuration["AllowedOrigins"] ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy
            .WithOrigins(["http://localhost:4200", .. allowedOrigins])
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// ─── Manejo global de errores ─────────────────────────────────────────────────
app.Use(async (ctx, next) =>
{
    try { await next(); }
    catch (ArgumentException ex)
    {
        ctx.Response.StatusCode = 400;
        await ctx.Response.WriteAsJsonAsync(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        ctx.Response.StatusCode = 500;
        await ctx.Response.WriteAsJsonAsync(new { error = "Error interno del servidor", detalle = ex.Message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════
var auth = app.MapGroup("/api/auth");

auth.MapPost("/login", async (LoginRequest req, IAuthService authService, ITokenService tokenService) =>
{
    var usuario = await authService.AuthenticateAsync(req.Username, req.Password);
    if (usuario == null)
        return Results.Unauthorized();

    var token = tokenService.GenerateToken(usuario);
    return Results.Ok(new LoginResponse(token, usuario.Nombre, usuario.Username, usuario.Rol, usuario.Id));
});

auth.MapPost("/register", async (RegisterRequest req, IAuthService authService, ClaimsPrincipal user) =>
{
    if (!user.IsInRole("dueño")) return Results.Forbid();
    var ok = await authService.RegisterAsync(req.Nombre, req.Username, req.Password, req.Rol);
    return ok ? Results.Ok() : Results.Conflict(new { error = "El username ya existe" });
}).RequireAuthorization();

// ═══════════════════════════════════════════════════════════════════════════════
// USUARIOS
// ═══════════════════════════════════════════════════════════════════════════════
var usuarios = app.MapGroup("/api/usuarios").RequireAuthorization();

usuarios.MapGet("/", async (IUsuarioRepository usuarioRepo, ClaimsPrincipal user) =>
{
    if (!user.IsInRole("dueño")) return Results.Forbid();
    var lista = await usuarioRepo.GetAllAsync();
    var dtos = lista.Select(u => new UsuarioDto(u.Id, u.Nombre, u.Username, u.Rol, u.Activo, u.CreadoEn));
    return Results.Ok(dtos);
});

usuarios.MapPut("/{id:long}", async (long id, UpdateUsuarioRequest req, IUsuarioRepository usuarioRepo, ClaimsPrincipal user) =>
{
    if (!user.IsInRole("dueño")) return Results.Forbid();
    if (string.IsNullOrWhiteSpace(req.Nombre) || string.IsNullOrWhiteSpace(req.Username))
        return Results.BadRequest(new { error = "Nombre y username son obligatorios" });

    var currentId = long.Parse(user.FindFirst("id")!.Value);
    if (await usuarioRepo.ExistsByUsernameExcludingIdAsync(req.Username, id))
        return Results.Conflict(new { error = "El username ya está en uso" });

    var existentes = await usuarioRepo.GetAllAsync();
    var actual = existentes.FirstOrDefault(u => u.Id == id);
    if (actual == null) return Results.NotFound();

    var passwordHash = string.IsNullOrWhiteSpace(req.Password)
        ? actual.PasswordHash
        : BCrypt.Net.BCrypt.HashPassword(req.Password);

    actual.Nombre = req.Nombre;
    actual.Username = req.Username;
    // No permitir que el dueño se cambie su propio rol
    actual.Rol = (id == currentId) ? actual.Rol : req.Rol;
    actual.PasswordHash = passwordHash;
    await usuarioRepo.UpdateAsync(actual);
    return Results.NoContent();
});

usuarios.MapPatch("/{id:long}/activo", async (long id, ToggleActivoRequest req, IUsuarioRepository usuarioRepo, ClaimsPrincipal user) =>
{
    if (!user.IsInRole("dueño")) return Results.Forbid();
    var currentId = long.Parse(user.FindFirst("id")!.Value);
    if (id == currentId)
        return Results.BadRequest(new { error = "No puedes desactivarte a ti mismo" });
    await usuarioRepo.ToggleActivoAsync(id, req.Activo);
    return Results.NoContent();
});

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTOS
// ═══════════════════════════════════════════════════════════════════════════════
var productos = app.MapGroup("/api/productos").RequireAuthorization();

// POS: solo activos, buscables por nombre o código
productos.MapGet("/", async (string? q, IProductoService productoService) =>
{
    var lista = string.IsNullOrWhiteSpace(q)
        ? await productoService.GetAllAsync()
        : await productoService.SearchAsync(q);
    return Results.Ok(lista.Select(ToDto));
});

// Gestión: todos (activos e inactivos)
productos.MapGet("/gestion", async (string? q, IProductoService productoService, ClaimsPrincipal user) =>
{
    if (!user.IsInRole("dueño")) return Results.Forbid();
    var lista = await productoService.GetAllParaGestionAsync(q ?? "");
    return Results.Ok(lista.Select(ToDto));
});

productos.MapGet("/{id:long}", async (long id, IProductoService productoService) =>
{
    var p = await productoService.GetByIdAsync(id);
    return p == null ? Results.NotFound() : Results.Ok(ToDto(p));
});

productos.MapGet("/codigo/{codigo}", async (string codigo, IProductoService productoService) =>
{
    var p = await productoService.GetByCodigoExactoAsync(codigo);
    return p == null ? Results.NotFound() : Results.Ok(ToDto(p));
});

productos.MapPost("/", async (CreateProductoRequest req, IProductoService productoService, ClaimsPrincipal user) =>
{
    if (!user.IsInRole("dueño")) return Results.Forbid();
    var producto = new Producto
    {
        Codigo = req.Codigo,
        Nombre = req.Nombre,
        PrecioPorKg = req.PrecioPorKg,
        PrecioPorUnidad = req.PrecioPorUnidad,
        TipoVenta = req.TipoVenta,
        Stock = req.Stock,
        StockHabilitado = req.StockHabilitado,
        ImagenUrl = req.ImagenUrl
    };
    var id = await productoService.CreateAsync(producto);
    return Results.Created($"/api/productos/{id}", new { id });
});

productos.MapPut("/{id:long}", async (long id, UpdateProductoRequest req, IProductoService productoService, ClaimsPrincipal user) =>
{
    if (!user.IsInRole("dueño")) return Results.Forbid();
    var producto = new Producto
    {
        Id = id,
        Codigo = req.Codigo,
        Nombre = req.Nombre,
        PrecioPorKg = req.PrecioPorKg,
        PrecioPorUnidad = req.PrecioPorUnidad,
        TipoVenta = req.TipoVenta,
        Stock = req.Stock,
        StockHabilitado = req.StockHabilitado,
        Activo = req.Activo,
        ImagenUrl = req.ImagenUrl
    };
    await productoService.UpdateAsync(producto);
    return Results.NoContent();
});

// Toggle activo/inactivo sin editar todo el producto
productos.MapPatch("/{id:long}/activo", async (long id, ToggleActivoRequest req, IProductoService productoService, ClaimsPrincipal user) =>
{
    if (!user.IsInRole("dueño")) return Results.Forbid();
    await productoService.ToggleActivoAsync(id, req.Activo);
    return Results.NoContent();
});

productos.MapDelete("/{id:long}", async (long id, IProductoService productoService, ClaimsPrincipal user) =>
{
    if (!user.IsInRole("dueño")) return Results.Forbid();
    await productoService.DeleteAsync(id);
    return Results.NoContent();
});

// ═══════════════════════════════════════════════════════════════════════════════
// VENTAS
// ═══════════════════════════════════════════════════════════════════════════════
var ventas = app.MapGroup("/api/ventas").RequireAuthorization();

ventas.MapPost("/", async (IVentaService ventaService, ClaimsPrincipal user) =>
{
    var usuarioId = long.Parse(user.FindFirst("id")!.Value);
    var ventaId = await ventaService.CrearVentaPendienteAsync(usuarioId);
    return Results.Ok(new { ventaId });
});

ventas.MapGet("/{ventaId:long}/detalles", async (long ventaId, IVentaService ventaService) =>
{
    var detalles = await ventaService.GetDetallesAsync(ventaId);
    return Results.Ok(detalles.Select(d => new DetalleVentaDto(
        d.ProductoId,
        d.ProductoNombre ?? "",
        d.TipoVenta ?? "",
        d.Cantidad,
        d.PrecioUnitario,
        d.Subtotal,
        d.Orden,
        d.ImagenUrl)));
});

ventas.MapPost("/{ventaId:long}/productos", async (long ventaId, AgregarProductoRequest req, IVentaService ventaService) =>
{
    try
    {
        await ventaService.AgregarProductoAsync(ventaId, req.ProductoId, req.Cantidad);
        return Results.Ok();
    }
    catch (InvalidOperationException ex) { return Results.BadRequest(new { error = ex.Message }); }
});

ventas.MapPut("/{ventaId:long}/productos/{productoId:long}", async (long ventaId, long productoId, UpdateCantidadRequest req, IVentaService ventaService) =>
{
    try
    {
        await ventaService.UpdateCantidadAsync(ventaId, productoId, req.NuevaCantidad);
        return Results.Ok();
    }
    catch (InvalidOperationException ex) { return Results.BadRequest(new { error = ex.Message }); }
});

ventas.MapDelete("/{ventaId:long}/productos/{productoId:long}", async (long ventaId, long productoId, IVentaService ventaService) =>
{
    await ventaService.EliminarProductoAsync(ventaId, productoId);
    return Results.NoContent();
});

ventas.MapPost("/{ventaId:long}/finalizar", async (long ventaId, FinalizarVentaRequest req, IVentaService ventaService) =>
{
    try
    {
        await ventaService.FinalizarVentaAsync(ventaId, req.MetodoPago, req.MontoRecibido, req.Cambio);
        return Results.Ok();
    }
    catch (InvalidOperationException ex) { return Results.BadRequest(new { error = ex.Message }); }
});

ventas.MapDelete("/{ventaId:long}", async (long ventaId, IVentaService ventaService) =>
{
    await ventaService.CancelarVentaAsync(ventaId);
    return Results.NoContent();
});

// Mis ventas: ventas del usuario autenticado por rango de fechas
ventas.MapGet("/mis-ventas", async (DateOnly? inicio, DateOnly? fin, IVentaService ventaService, ClaimsPrincipal user) =>
{
    var usuarioId = long.Parse(user.FindFirst("id")!.Value);
    var fechaInicio = inicio ?? DateOnly.FromDateTime(DateTime.Today);
    var fechaFin = fin ?? DateOnly.FromDateTime(DateTime.Today);
    var lista = await ventaService.GetMisVentasAsync(usuarioId, fechaInicio, fechaFin);
    return Results.Ok(lista);
});

// Reportes de ventas por rango de fechas (solo dueño)
ventas.MapGet("/reportes", async (DateOnly? inicio, DateOnly? fin, IVentaService ventaService, ClaimsPrincipal user) =>
{
    if (!user.IsInRole("dueño")) return Results.Forbid();
    var fechaInicio = inicio ?? DateOnly.FromDateTime(DateTime.Today);
    var fechaFin = fin ?? DateOnly.FromDateTime(DateTime.Today);
    var lista = await ventaService.GetVentasPorFechaAsync(fechaInicio, fechaFin);
    return Results.Ok(lista);
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════════
var config = app.MapGroup("/api/configuracion").RequireAuthorization();

config.MapGet("/", async (IConfiguracionService configuracionService) =>
{
    var c = await configuracionService.GetAsync();
    return Results.Ok(new ConfiguracionDto(c.PuertoBascula, c.BaudrateBascula, c.NombreImpresora, c.EncabezadoTicket));
});

config.MapPut("/", async (ConfiguracionDto req, IConfiguracionService configuracionService, ClaimsPrincipal user) =>
{
    if (!user.IsInRole("dueño")) return Results.Forbid();
    var configuracion = new Configuracion
    {
        PuertoBascula = req.PuertoBascula,
        BaudrateBascula = req.BaudrateBascula,
        NombreImpresora = req.NombreImpresora,
        EncabezadoTicket = req.EncabezadoTicket
    };
    await configuracionService.SaveAsync(configuracion);
    return Results.NoContent();
});

app.Run();

// ─── Helpers locales ─────────────────────────────────────────────────────────
static ProductoDto ToDto(Producto p) => new(
    p.Id, p.Codigo, p.Nombre, p.PrecioPorKg, p.PrecioPorUnidad,
    p.TipoVenta, p.Stock, p.StockHabilitado, p.Activo, p.ImagenUrl, p.CreadoEn);

record ToggleActivoRequest(bool Activo);
