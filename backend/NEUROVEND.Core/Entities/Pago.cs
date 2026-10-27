namespace NEUROVEND.Core.Entities;

public class Pago
{
    public long Id { get; set; }
    public long VentaId { get; set; }
    public decimal MontoRecibido { get; set; }
    public decimal CambioDevuelto { get; set; }
}
