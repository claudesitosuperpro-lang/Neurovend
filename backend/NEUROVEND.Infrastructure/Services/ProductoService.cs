using NEUROVEND.Core.Entities;
using NEUROVEND.Core.Interfaces;

namespace NEUROVEND.Infrastructure.Services;

public class ProductoService(IProductoRepository productoRepository) : IProductoService
{
    public Task<IEnumerable<Producto>> GetAllAsync() =>
        productoRepository.GetAllAsync();

    public Task<IEnumerable<Producto>> SearchAsync(string query) =>
        productoRepository.SearchAsync(query);

    public Task<IEnumerable<Producto>> GetAllParaGestionAsync(string query) =>
        productoRepository.GetAllParaGestionAsync(query);

    public Task<Producto?> GetByIdAsync(long id) =>
        productoRepository.GetByIdAsync(id);

    public Task<Producto?> GetByCodigoExactoAsync(string codigo) =>
        productoRepository.GetByCodigoExactoAsync(codigo);

    public async Task<long> CreateAsync(Producto producto)
    {
        Validate(producto);
        return await productoRepository.CreateAsync(producto);
    }

    public async Task UpdateAsync(Producto producto)
    {
        if (producto.Id == 0) throw new ArgumentException("ID obligatorio para actualizar");
        Validate(producto);
        await productoRepository.UpdateAsync(producto);
    }

    public Task DeleteAsync(long id) =>
        productoRepository.DeleteAsync(id);

    public Task ToggleActivoAsync(long id, bool activo) =>
        productoRepository.ToggleActivoAsync(id, activo);

    private static void Validate(Producto p)
    {
        if (string.IsNullOrWhiteSpace(p.Codigo))
            throw new ArgumentException("El código es obligatorio");
        if (string.IsNullOrWhiteSpace(p.Nombre))
            throw new ArgumentException("El nombre es obligatorio");
        if (p.TipoVenta == "peso" && p.PrecioPorKg == null)
            throw new ArgumentException("Precio por kg obligatorio para tipo 'peso'");
        if (p.TipoVenta == "unidad" && p.PrecioPorUnidad == null)
            throw new ArgumentException("Precio por unidad obligatorio para tipo 'unidad'");
        if (p.Stock < 0)
            throw new ArgumentException("El stock no puede ser negativo");
    }
}
