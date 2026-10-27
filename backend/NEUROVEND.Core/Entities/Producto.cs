namespace NEUROVEND.Core.Entities;

public class Producto
{
    public long Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public decimal? PrecioPorKg { get; set; }
    public decimal? PrecioPorUnidad { get; set; }
    public string TipoVenta { get; set; } = string.Empty; // "peso" | "unidad"
    public decimal Stock { get; set; }
    public bool StockHabilitado { get; set; } = true;
    public bool Activo { get; set; } = true;
    public string? ImagenUrl { get; set; }
    public DateTime CreadoEn { get; set; }

    public decimal PrecioUnitario => TipoVenta == "peso" ? PrecioPorKg!.Value : PrecioPorUnidad!.Value;
}
