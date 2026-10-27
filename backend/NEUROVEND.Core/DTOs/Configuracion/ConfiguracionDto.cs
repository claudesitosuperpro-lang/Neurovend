namespace NEUROVEND.Core.DTOs.Configuracion;

public record ConfiguracionDto(
    string PuertoBascula,
    int BaudrateBascula,
    string NombreImpresora,
    string EncabezadoTicket
);
