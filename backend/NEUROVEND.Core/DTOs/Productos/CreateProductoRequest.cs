namespace NEUROVEND.Core.DTOs.Productos;

public record CreateProductoRequest(
    string Codigo,
    string Nombre,
    decimal? PrecioPorKg,
    decimal? PrecioPorUnidad,
    string TipoVenta,
    decimal Stock,
    bool StockHabilitado,
    string? ImagenUrl
);
