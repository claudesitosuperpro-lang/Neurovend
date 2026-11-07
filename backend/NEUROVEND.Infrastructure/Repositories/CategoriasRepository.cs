using Dapper;
using NEUROVEND.Core.Entities;
using Npgsql;

namespace NEUROVEND.Infrastructure.Repositories;

public class CategoriasRepository(string connectionString)
{
    private NpgsqlConnection CreateConnection() => new(connectionString);

    public async Task<IEnumerable<Categoria>> GetAllAsync()
    {
        const string sql = "SELECT id, nombre FROM categorias ORDER BY nombre ASC";
        await using var conn = CreateConnection();
        return await conn.QueryAsync<Categoria>(sql);
    }

    public async Task<int> CreateAsync(string nombre)
    {
        const string sql = "INSERT INTO categorias (nombre) VALUES (@nombre) RETURNING id";
        await using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(sql, new { nombre });
    }

    public async Task DeleteAsync(int id)
    {
        const string sql = "DELETE FROM categorias WHERE id = @id";
        await using var conn = CreateConnection();
        await conn.ExecuteAsync(sql, new { id });
    }

    public async Task<bool> ExisteAsync(string nombre)
    {
        const string sql = "SELECT COUNT(1) FROM categorias WHERE LOWER(nombre) = LOWER(@nombre)";
        await using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(sql, new { nombre }) > 0;
    }
}
