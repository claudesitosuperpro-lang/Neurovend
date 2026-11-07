namespace NEUROVEND.Core.DTOs.Ventas;

public record CierrePorCategoria(string Categoria, decimal Total);

public record CierreCajaDto(
    int TotalVentas,
    decimal TotalMonto,
    decimal TotalEfectivo,
    decimal TotalTarjeta,
    decimal TicketPromedio,
    IEnumerable<CierrePorCategoria> PorCategoria
);
