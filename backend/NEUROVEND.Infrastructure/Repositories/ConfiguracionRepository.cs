using Dapper;
using NEUROVEND.Core.Entities;
using NEUROVEND.Core.Interfaces;
using Npgsql;

namespace NEUROVEND.Infrastructure.Repositories;

public class ConfiguracionRepository(string connectionString) : IConfiguracionRepository
{
    private NpgsqlConnection CreateConnection() => new(connectionString);

    public async Task<Configuracion> GetAsync()
    {
        const string sql = """
            SELECT id, puerto_bascula AS PuertoBascula, baudrate_bascula AS BaudrateBascula,
                   nombre_impresora AS NombreImpresora, encabezado_ticket AS EncabezadoTicket,
                   actualizado_en AS ActualizadoEn
            FROM configuracion LIMIT 1
            """;
        await using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<Configuracion>(sql) ?? new Configuracion();
    }

    public async Task SaveAsync(Configuracion configuracion)
    {
        // Siempre actualiza la única fila existente; si no existe, la crea con id=1
        const string sql = """
            INSERT INTO configuracion (id, puerto_bascula, baudrate_bascula, nombre_impresora, encabezado_ticket)
            VALUES (1, @PuertoBascula, @BaudrateBascula, @NombreImpresora, @EncabezadoTicket)
            ON CONFLICT (id) DO UPDATE SET
                puerto_bascula    = EXCLUDED.puerto_bascula,
                baudrate_bascula  = EXCLUDED.baudrate_bascula,
                nombre_impresora  = EXCLUDED.nombre_impresora,
                encabezado_ticket = EXCLUDED.encabezado_ticket,
                actualizado_en    = CURRENT_TIMESTAMP
            """;
        await using var conn = CreateConnection();
        await conn.ExecuteAsync(sql, configuracion);
    }
}
