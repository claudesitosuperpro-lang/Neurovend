namespace NEUROVEND.Core.DTOs.Ventas;

public record VentaResumenDto(
    long Id,
    DateTime Fecha,
    decimal Total,
    string? MetodoPago,
    string UsuarioNombre,
    IEnumerable<DetalleVentaDto> Detalles
);
