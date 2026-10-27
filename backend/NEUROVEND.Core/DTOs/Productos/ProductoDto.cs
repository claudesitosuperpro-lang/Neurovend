namespace NEUROVEND.Core.DTOs.Productos;

public record ProductoDto(
    long Id,
    string Codigo,
    string Nombre,
    decimal? PrecioPorKg,
    decimal? PrecioPorUnidad,
    string TipoVenta,
    decimal Stock,
    bool StockHabilitado,
    bool Activo,
    string? ImagenUrl,
    DateTime CreadoEn
);
