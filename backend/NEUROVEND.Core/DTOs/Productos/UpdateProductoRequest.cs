namespace NEUROVEND.Core.DTOs.Productos;

public record UpdateProductoRequest(
    string Codigo,
    string Nombre,
    decimal? PrecioPorKg,
    decimal? PrecioPorUnidad,
    string TipoVenta,
    decimal Stock,
    bool StockHabilitado,
    bool Activo,
    string? ImagenUrl
);
