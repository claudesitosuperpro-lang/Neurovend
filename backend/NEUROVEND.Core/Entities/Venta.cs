namespace NEUROVEND.Core.Entities;

public class Venta
{
    public long Id { get; set; }
    public long UsuarioId { get; set; }
    public DateTime Fecha { get; set; }
    public DateOnly FechaVenta { get; set; }
    public decimal Total { get; set; }
    public string? MetodoPago { get; set; } // "efectivo" | "tarjeta"
    public string Estado { get; set; } = "pendiente"; // "pendiente" | "completada"
    public List<DetalleVenta> Detalles { get; set; } = [];
    public Pago? Pago { get; set; }
    public string? UsuarioNombre { get; set; }
}
