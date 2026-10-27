using NEUROVEND.Core.Entities;
using NEUROVEND.Core.Interfaces;

namespace NEUROVEND.Infrastructure.Services;

public class VentaService(IVentaRepository ventaRepository, IProductoRepository productoRepository) : IVentaService
{
    public Task<long> CrearVentaPendienteAsync(long usuarioId) =>
        ventaRepository.CrearVentaPendienteAsync(usuarioId);

    public async Task AgregarProductoAsync(long ventaId, long productoId, decimal cantidad)
    {
        var producto = await productoRepository.GetByIdAsync(productoId)
            ?? throw new ArgumentException("Producto no encontrado o inactivo");

        if (cantidad <= 0)
            throw new ArgumentException("La cantidad debe ser mayor que 0");
        if (producto.TipoVenta == "unidad" && cantidad % 1 != 0)
            throw new ArgumentException("La cantidad para productos por unidad debe ser entera");

        if (producto.StockHabilitado)
        {
            var detalles = await ventaRepository.GetDetallesAsync(ventaId);
            var enCarrito = detalles.FirstOrDefault(d => d.ProductoId == productoId)?.Cantidad ?? 0;
            var disponible = producto.Stock - enCarrito;
            if (disponible < cantidad)
                throw new InvalidOperationException(
                    $"Stock insuficiente para '{producto.Nombre}'. Disponible: {disponible:F2}");
        }

        await ventaRepository.AgregarOActualizarProductoAsync(
            ventaId, productoId, cantidad, producto.TipoVenta, producto.PrecioUnitario);
    }

    public Task EliminarProductoAsync(long ventaId, long productoId) =>
        ventaRepository.EliminarProductoAsync(ventaId, productoId);

    public async Task UpdateCantidadAsync(long ventaId, long productoId, decimal nuevaCantidad)
    {
        if (nuevaCantidad < 0)
            throw new ArgumentException("La cantidad no puede ser negativa");

        var producto = await productoRepository.GetByIdAsync(productoId)
            ?? throw new ArgumentException("Producto no encontrado");

        if (producto.TipoVenta == "unidad" && nuevaCantidad % 1 != 0)
            throw new ArgumentException("La cantidad para unidad debe ser entera");

        if (producto.StockHabilitado && nuevaCantidad > producto.Stock)
            throw new InvalidOperationException(
                $"Stock insuficiente para '{producto.Nombre}'. Disponible: {producto.Stock:F2}");

        await ventaRepository.UpdateCantidadAsync(
            ventaId, productoId, nuevaCantidad, producto.TipoVenta, producto.PrecioUnitario);
    }

    public Task<IEnumerable<DetalleVenta>> GetDetallesAsync(long ventaId) =>
        ventaRepository.GetDetallesAsync(ventaId);

    public async Task FinalizarVentaAsync(long ventaId, string metodoPago, decimal montoRecibido, decimal cambio)
    {
        var detalles = (await ventaRepository.GetDetallesAsync(ventaId)).ToList();

        foreach (var detalle in detalles)
        {
            var producto = await productoRepository.GetByIdAsync(detalle.ProductoId);
            if (producto?.StockHabilitado == true && producto.Stock < detalle.Cantidad)
                throw new InvalidOperationException(
                    $"Stock insuficiente para '{producto.Nombre}'. Disponible: {producto.Stock:F2}");
        }

        await ventaRepository.FinalizarVentaAsync(ventaId, metodoPago, montoRecibido, cambio);

        foreach (var detalle in detalles)
        {
            var producto = await productoRepository.GetByIdAsync(detalle.ProductoId);
            if (producto?.StockHabilitado == true)
                await productoRepository.UpdateStockAsync(detalle.ProductoId, producto.Stock - detalle.Cantidad);
        }
    }

    public Task CancelarVentaAsync(long ventaId) =>
        ventaRepository.CancelarVentaAsync(ventaId);

    public Task<IEnumerable<Venta>> GetVentasPorFechaAsync(DateOnly inicio, DateOnly fin) =>
        ventaRepository.GetVentasPorFechaAsync(inicio, fin);

    public Task<IEnumerable<Venta>> GetMisVentasAsync(long usuarioId, DateOnly inicio, DateOnly fin) =>
        ventaRepository.GetMisVentasAsync(usuarioId, inicio, fin);
}
