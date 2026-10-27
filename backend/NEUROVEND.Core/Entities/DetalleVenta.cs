namespace NEUROVEND.Core.Entities;

public class DetalleVenta
{
    public long Id { get; set; }
    public long VentaId { get; set; }
    public long ProductoId { get; set; }
    public decimal? CantidadKg { get; set; }
    public int? CantidadUnidades { get; set; }
    public decimal PrecioUnitario { get; set; } // snapshot histórico del precio
    public decimal Subtotal { get; set; }
    public int Orden { get; set; }             // orden de inserción en la cuenta
    public string? ProductoNombre { get; set; }
    public string? TipoVenta { get; set; }
    public string? ImagenUrl { get; set; }

    public decimal Cantidad => CantidadKg ?? (decimal)(CantidadUnidades ?? 0);
}
