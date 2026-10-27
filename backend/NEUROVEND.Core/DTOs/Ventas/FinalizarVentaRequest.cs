namespace NEUROVEND.Core.DTOs.Ventas;

public record FinalizarVentaRequest(string MetodoPago, decimal MontoRecibido, decimal Cambio);
