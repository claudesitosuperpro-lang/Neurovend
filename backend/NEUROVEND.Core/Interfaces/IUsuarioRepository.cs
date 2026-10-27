using NEUROVEND.Core.Entities;

namespace NEUROVEND.Core.Interfaces;

public interface IUsuarioRepository
{
    Task<Usuario?> GetByUsernameAsync(string username);
    Task<bool> ExistsByUsernameAsync(string username);
    Task<bool> ExistsByUsernameExcludingIdAsync(string username, long excludeId);
    Task<IEnumerable<Usuario>> GetAllAsync();
    Task CreateAsync(Usuario usuario);
    Task UpdateAsync(Usuario usuario);
    Task ToggleActivoAsync(long id, bool activo);
}
