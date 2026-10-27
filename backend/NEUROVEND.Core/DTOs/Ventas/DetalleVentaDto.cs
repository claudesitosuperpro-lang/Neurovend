namespace NEUROVEND.Core.DTOs.Ventas;

public record DetalleVentaDto(
    long ProductoId,
    string ProductoNombre,
    string TipoVenta,
    decimal Cantidad,
    decimal PrecioUnitario,
    decimal Subtotal,
    int Orden,
    string? ImagenUrl
);
