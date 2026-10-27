using NEUROVEND.Core.Entities;

namespace NEUROVEND.Core.Interfaces;

public interface IVentaRepository
{
    Task<long> CrearVentaPendienteAsync(long usuarioId);
    Task AgregarOActualizarProductoAsync(long ventaId, long productoId, decimal cantidad, string tipoVenta, decimal precioUnitario);
    Task EliminarProductoAsync(long ventaId, long productoId);
    Task<IEnumerable<DetalleVenta>> GetDetallesAsync(long ventaId);
    Task FinalizarVentaAsync(long ventaId, string metodoPago, decimal montoRecibido, decimal cambio);
    Task CancelarVentaAsync(long ventaId);
    Task<IEnumerable<Venta>> GetVentasPorFechaAsync(DateOnly inicio, DateOnly fin);
    Task<Venta?> GetByIdAsync(long ventaId);
    Task UpdateCantidadAsync(long ventaId, long productoId, decimal nuevaCantidad, string tipoVenta, decimal precioUnitario);
}
