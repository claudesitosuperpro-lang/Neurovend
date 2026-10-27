using NEUROVEND.Core.Entities;

namespace NEUROVEND.Core.Interfaces;

public interface IVentaService
{
    Task<long> CrearVentaPendienteAsync(long usuarioId);
    Task AgregarProductoAsync(long ventaId, long productoId, decimal cantidad);
    Task EliminarProductoAsync(long ventaId, long productoId);
    Task UpdateCantidadAsync(long ventaId, long productoId, decimal nuevaCantidad);
    Task<IEnumerable<DetalleVenta>> GetDetallesAsync(long ventaId);
    Task FinalizarVentaAsync(long ventaId, string metodoPago, decimal montoRecibido, decimal cambio);
    Task CancelarVentaAsync(long ventaId);
    Task<IEnumerable<Venta>> GetVentasPorFechaAsync(DateOnly inicio, DateOnly fin);
}
