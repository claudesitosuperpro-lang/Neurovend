using Dapper;
using NEUROVEND.Core.Entities;
using NEUROVEND.Core.Interfaces;
using Npgsql;

namespace NEUROVEND.Infrastructure.Repositories;

public class VentaRepository(string connectionString) : IVentaRepository
{
    private NpgsqlConnection CreateConnection() => new(connectionString);

    public async Task<long> CrearVentaPendienteAsync(long usuarioId)
    {
        const string sql = """
            INSERT INTO ventas (usuario_id, total, estado, fecha_venta)
            VALUES (@usuarioId, 0, 'pendiente', CURRENT_DATE) RETURNING id
            """;
        await using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<long>(sql, new { usuarioId });
    }

    public async Task AgregarOActualizarProductoAsync(long ventaId, long productoId, decimal cantidad, string tipoVenta, decimal precioUnitario)
    {
        var subtotal = precioUnitario * cantidad;
        var cantidadKg = tipoVenta == "peso" ? (decimal?)cantidad : null;
        var cantidadUnidades = tipoVenta == "unidad" ? (int?)Convert.ToInt32(cantidad) : null;

        const string upsertSql = """
            INSERT INTO detalle_venta (venta_id, producto_id, cantidad_kg, cantidad_unidades, precio_unitario, subtotal, orden)
            VALUES (@ventaId, @productoId, @cantidadKg, @cantidadUnidades, @precioUnitario, @subtotal,
                    (SELECT COALESCE(MAX(orden), 0) + 1 FROM detalle_venta WHERE venta_id = @ventaId))
            ON CONFLICT ON CONSTRAINT unique_venta_producto DO UPDATE SET
                cantidad_kg = CASE WHEN @cantidadKg IS NOT NULL
                              THEN detalle_venta.cantidad_kg + @cantidadKg ELSE NULL END,
                cantidad_unidades = CASE WHEN @cantidadUnidades IS NOT NULL
                              THEN detalle_venta.cantidad_unidades + @cantidadUnidades ELSE NULL END,
                subtotal = detalle_venta.subtotal + @subtotal,
                precio_unitario = @precioUnitario
            """;

        await using var conn = CreateConnection();
        await conn.ExecuteAsync(upsertSql, new { ventaId, productoId, cantidadKg, cantidadUnidades, precioUnitario, subtotal });
        await ActualizarTotalAsync(conn, ventaId);
    }

    public async Task EliminarProductoAsync(long ventaId, long productoId)
    {
        const string sql = "DELETE FROM detalle_venta WHERE venta_id = @ventaId AND producto_id = @productoId";
        await using var conn = CreateConnection();
        await conn.ExecuteAsync(sql, new { ventaId, productoId });
        await ActualizarTotalAsync(conn, ventaId);
    }

    public async Task<IEnumerable<DetalleVenta>> GetDetallesAsync(long ventaId)
    {
        const string sql = """
            SELECT dv.id, dv.venta_id AS VentaId, dv.producto_id AS ProductoId,
                   dv.cantidad_kg AS CantidadKg, dv.cantidad_unidades AS CantidadUnidades,
                   dv.precio_unitario AS PrecioUnitario, dv.subtotal, dv.orden,
                   p.nombre AS ProductoNombre, p.tipo_venta AS TipoVenta, p.imagen_url AS ImagenUrl
            FROM detalle_venta dv
            JOIN productos p ON dv.producto_id = p.id
            WHERE dv.venta_id = @ventaId
            ORDER BY dv.orden ASC
            """;
        await using var conn = CreateConnection();
        return await conn.QueryAsync<DetalleVenta>(sql, new { ventaId });
    }

    public async Task UpdateCantidadAsync(long ventaId, long productoId, decimal nuevaCantidad, string tipoVenta, decimal precioUnitario)
    {
        if (nuevaCantidad <= 0)
        {
            await EliminarProductoAsync(ventaId, productoId);
            return;
        }

        var cantidadKg = tipoVenta == "peso" ? (decimal?)nuevaCantidad : null;
        var cantidadUnidades = tipoVenta == "unidad" ? (int?)Convert.ToInt32(nuevaCantidad) : null;
        var subtotal = precioUnitario * nuevaCantidad;

        const string sql = """
            UPDATE detalle_venta
            SET cantidad_kg = @cantidadKg, cantidad_unidades = @cantidadUnidades, subtotal = @subtotal
            WHERE venta_id = @ventaId AND producto_id = @productoId
            """;
        await using var conn = CreateConnection();
        await conn.ExecuteAsync(sql, new { ventaId, productoId, cantidadKg, cantidadUnidades, subtotal });
        await ActualizarTotalAsync(conn, ventaId);
    }

    public async Task FinalizarVentaAsync(long ventaId, string metodoPago, decimal montoRecibido, decimal cambio)
    {
        const string sqlVenta = """
            UPDATE ventas SET estado = 'completada', metodo_pago = @metodoPago WHERE id = @ventaId
            """;
        const string sqlPago = """
            INSERT INTO pagos (venta_id, monto_recibido, cambio_devuelto)
            VALUES (@ventaId, @montoRecibido, @cambio)
            """;
        await using var conn = CreateConnection();
        await conn.ExecuteAsync(sqlVenta, new { ventaId, metodoPago });
        await conn.ExecuteAsync(sqlPago, new { ventaId, montoRecibido, cambio });
    }

    public async Task CancelarVentaAsync(long ventaId)
    {
        const string sql = "DELETE FROM ventas WHERE id = @ventaId AND estado = 'pendiente'";
        await using var conn = CreateConnection();
        await conn.ExecuteAsync(sql, new { ventaId });
    }

    public async Task<IEnumerable<Venta>> GetVentasPorFechaAsync(DateOnly inicio, DateOnly fin)
    {
        const string sqlVentas = """
            SELECT v.id, v.fecha, v.fecha_venta AS FechaVenta, v.total, v.metodo_pago AS MetodoPago,
                   v.estado, u.nombre AS UsuarioNombre
            FROM ventas v JOIN usuarios u ON v.usuario_id = u.id
            WHERE v.fecha_venta BETWEEN @inicio AND @fin AND v.estado = 'completada'
            ORDER BY v.fecha DESC
            """;
        await using var conn = CreateConnection();
        var ventas = (await conn.QueryAsync<Venta>(sqlVentas, new { inicio, fin })).ToList();

        if (ventas.Count == 0) return ventas;

        var ventaIds = ventas.Select(v => v.Id).ToArray();
        const string sqlDetalles = """
            SELECT dv.id, dv.venta_id AS VentaId, dv.producto_id AS ProductoId,
                   dv.cantidad_kg AS CantidadKg, dv.cantidad_unidades AS CantidadUnidades,
                   dv.precio_unitario AS PrecioUnitario, dv.subtotal, dv.orden,
                   p.nombre AS ProductoNombre, p.tipo_venta AS TipoVenta, p.imagen_url AS ImagenUrl
            FROM detalle_venta dv
            JOIN productos p ON dv.producto_id = p.id
            WHERE dv.venta_id = ANY(@ventaIds)
            ORDER BY dv.venta_id, dv.orden ASC
            """;
        var detalles = await conn.QueryAsync<DetalleVenta>(sqlDetalles, new { ventaIds });
        var detallesPorVenta = detalles.GroupBy(d => d.VentaId).ToDictionary(g => g.Key, g => g.ToList());
        foreach (var venta in ventas)
        {
            if (detallesPorVenta.TryGetValue(venta.Id, out var ventaDetalles))
                venta.Detalles = ventaDetalles;
        }

        return ventas;
    }

    public async Task<Venta?> GetByIdAsync(long ventaId)
    {
        const string sql = """
            SELECT v.id, v.fecha, v.total, v.metodo_pago AS MetodoPago, v.estado, u.nombre AS UsuarioNombre
            FROM ventas v JOIN usuarios u ON v.usuario_id = u.id
            WHERE v.id = @ventaId
            """;
        await using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<Venta>(sql, new { ventaId });
    }

    private static async Task ActualizarTotalAsync(NpgsqlConnection conn, long ventaId)
    {
        const string sql = """
            UPDATE ventas SET total = COALESCE(
                (SELECT SUM(subtotal) FROM detalle_venta WHERE venta_id = @ventaId), 0)
            WHERE id = @ventaId
            """;
        await conn.ExecuteAsync(sql, new { ventaId });
    }
}
