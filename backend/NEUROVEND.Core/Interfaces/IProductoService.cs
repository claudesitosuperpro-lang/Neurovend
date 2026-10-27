using NEUROVEND.Core.Entities;

namespace NEUROVEND.Core.Interfaces;

public interface IProductoService
{
    Task<IEnumerable<Producto>> GetAllAsync();
    Task<IEnumerable<Producto>> SearchAsync(string query);
    Task<IEnumerable<Producto>> GetAllParaGestionAsync(string query);
    Task<Producto?> GetByIdAsync(long id);
    Task<Producto?> GetByCodigoExactoAsync(string codigo);
    Task<long> CreateAsync(Producto producto);
    Task UpdateAsync(Producto producto);
    Task DeleteAsync(long id);
    Task ToggleActivoAsync(long id, bool activo);
}
