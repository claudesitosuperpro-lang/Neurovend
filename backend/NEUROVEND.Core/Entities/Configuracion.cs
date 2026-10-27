namespace NEUROVEND.Core.Entities;

public class Configuracion
{
    public long Id { get; set; }
    public string PuertoBascula { get; set; } = "COM3";
    public int BaudrateBascula { get; set; } = 9600;
    public string NombreImpresora { get; set; } = "Impresora Termica";
    public string EncabezadoTicket { get; set; } = string.Empty;
    public DateTime ActualizadoEn { get; set; }
}
