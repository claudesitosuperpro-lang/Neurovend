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

    public async Task<bool> ExistsByUsernameExcludingIdAsync(string username, long excludeId)
    {
        const string sql = "SELECT COUNT(1) FROM usuarios WHERE username = @username AND id <> @excludeId";
        await using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(sql, new { username, excludeId }) > 0;
    }

    public async Task<IEnumerable<Usuario>> GetAllAsync()
    {
        const string sql = """
            SELECT id, nombre, username, password AS PasswordHash, rol, activo, creado_en AS CreadoEn
            FROM usuarios ORDER BY creado_en ASC
            """;
        await using var conn = CreateConnection();
        return await conn.QueryAsync<Usuario>(sql);
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

    public async Task UpdateAsync(Usuario usuario)
    {
        const string sql = """
            UPDATE usuarios SET nombre = @Nombre, username = @Username, rol = @Rol, password = @PasswordHash
            WHERE id = @Id
            """;
        await using var conn = CreateConnection();
        await conn.ExecuteAsync(sql, usuario);
    }

    public async Task ToggleActivoAsync(long id, bool activo)
    {
        const string sql = "UPDATE usuarios SET activo = @activo WHERE id = @id";
        await using var conn = CreateConnection();
        await conn.ExecuteAsync(sql, new { id, activo });
    }
}
