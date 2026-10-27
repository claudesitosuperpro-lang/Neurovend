using Dapper;
using NEUROVEND.Core.Entities;
using NEUROVEND.Core.Interfaces;
using Npgsql;

namespace NEUROVEND.Infrastructure.Repositories;

public class ProductoRepository(string connectionString) : IProductoRepository
{
    private NpgsqlConnection CreateConnection() => new(connectionString);

    private const string SelectColumns = """
        SELECT id, codigo, nombre, precio_por_kg AS PrecioPorKg, precio_por_unidad AS PrecioPorUnidad,
               tipo_venta AS TipoVenta, stock, stock_habilitado AS StockHabilitado,
               activo, imagen_url AS ImagenUrl, creado_en AS CreadoEn
        FROM productos
        """;

    public async Task<IEnumerable<Producto>> GetAllAsync()
    {
        var sql = $"{SelectColumns} WHERE activo = TRUE ORDER BY nombre ASC";
        await using var conn = CreateConnection();
        return await conn.QueryAsync<Producto>(sql);
    }

    public async Task<IEnumerable<Producto>> SearchAsync(string query)
    {
        var sql = $"""
            {SelectColumns}
            WHERE activo = TRUE AND (nombre ILIKE @q OR codigo ILIKE @q)
            ORDER BY nombre ASC
            """;
        await using var conn = CreateConnection();
        return await conn.QueryAsync<Producto>(sql, new { q = $"%{query}%" });
    }

    public async Task<IEnumerable<Producto>> GetAllParaGestionAsync(string query)
    {
        var sql = string.IsNullOrWhiteSpace(query)
            ? $"{SelectColumns} ORDER BY creado_en ASC, id ASC"
            : $"{SelectColumns} WHERE (nombre ILIKE @q OR codigo ILIKE @q) ORDER BY creado_en ASC, id ASC";
        await using var conn = CreateConnection();
        return await conn.QueryAsync<Producto>(sql, new { q = $"%{query}%" });
    }

    public async Task<Producto?> GetByIdAsync(long id)
    {
        var sql = $"{SelectColumns} WHERE id = @id";
        await using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<Producto>(sql, new { id });
    }

    public async Task<Producto?> GetByCodigoExactoAsync(string codigo)
    {
        var sql = $"{SelectColumns} WHERE codigo = @codigo AND activo = TRUE";
        await using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<Producto>(sql, new { codigo });
    }

    public async Task<long> CreateAsync(Producto producto)
    {
        const string sql = """
            INSERT INTO productos (codigo, nombre, precio_por_kg, precio_por_unidad, tipo_venta, stock, stock_habilitado, activo, imagen_url)
            VALUES (@Codigo, @Nombre, @PrecioPorKg, @PrecioPorUnidad, @TipoVenta, @Stock, @StockHabilitado, TRUE, @ImagenUrl)
            RETURNING id
            """;
        await using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<long>(sql, producto);
    }

    public async Task UpdateAsync(Producto producto)
    {
        const string sql = """
            UPDATE productos SET
                codigo = @Codigo,
                nombre = @Nombre,
                precio_por_kg = @PrecioPorKg,
                precio_por_unidad = @PrecioPorUnidad,
                tipo_venta = @TipoVenta,
                stock = @Stock,
                stock_habilitado = @StockHabilitado,
                activo = @Activo,
                imagen_url = @ImagenUrl
            WHERE id = @Id
            """;
        await using var conn = CreateConnection();
        await conn.ExecuteAsync(sql, producto);
    }

    public async Task DeleteAsync(long id)
    {
        const string sql = "UPDATE productos SET activo = FALSE WHERE id = @id";
        await using var conn = CreateConnection();
        await conn.ExecuteAsync(sql, new { id });
    }

    public async Task ToggleActivoAsync(long id, bool activo)
    {
        const string sql = "UPDATE productos SET activo = @activo WHERE id = @id";
        await using var conn = CreateConnection();
        await conn.ExecuteAsync(sql, new { id, activo });
    }

    public async Task UpdateStockAsync(long id, decimal nuevoStock)
    {
        const string sql = "UPDATE productos SET stock = @nuevoStock WHERE id = @id";
        await using var conn = CreateConnection();
        await conn.ExecuteAsync(sql, new { id, nuevoStock });
    }
}
