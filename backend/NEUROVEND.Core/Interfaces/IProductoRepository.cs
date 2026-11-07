using NEUROVEND.Core.Entities;

namespace NEUROVEND.Core.Interfaces;

public interface IProductoRepository
{
    Task<IEnumerable<Producto>> GetAllAsync(string? categoria = null);
    Task<IEnumerable<Producto>> SearchAsync(string query, string? categoria = null);
    Task<IEnumerable<Producto>> GetAllParaGestionAsync(string query);
    Task<IEnumerable<string>> GetCategoriasAsync();
    Task<Producto?> GetByIdAsync(long id);
    Task<Producto?> GetByCodigoExactoAsync(string codigo);
    Task<long> CreateAsync(Producto producto);
    Task UpdateAsync(Producto producto);
    Task DeleteAsync(long id);
    Task ToggleActivoAsync(long id, bool activo);
    Task UpdateStockAsync(long id, decimal nuevoStock);
}
