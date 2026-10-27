using Dapper;
using NEUROVEND.Core.Entities;
using NEUROVEND.Core.Interfaces;
using Npgsql;

namespace NEUROVEND.Infrastructure.Repositories;

public class UsuarioRepository(string connectionString) : IUsuarioRepository
{
    private NpgsqlConnection CreateConnection() => new(connectionString);

    public async Task<Usuario?> GetByUsernameAsync(string username)
    {
        const string sql = """
            SELECT id, nombre, username, password AS PasswordHash, rol, activo, creado_en AS CreadoEn
            FROM usuarios WHERE username = @username AND activo = TRUE
            """;
        await using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<Usuario>(sql, new { username });
    }

    public async Task<bool> ExistsByUsernameAsync(string username)
    {
        const string sql = "SELECT COUNT(1) FROM usuarios WHERE username = @username";
        await using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(sql, new { username }) > 0;
    }

    public async Task CreateAsync(Usuario usuario)
    {
        const string sql = """
            INSERT INTO usuarios (nombre, username, password, rol)
            VALUES (@Nombre, @Username, @PasswordHash, @Rol)
            """;
        await using var conn = CreateConnection();
        await conn.ExecuteAsync(sql, usuario);
    }
}
