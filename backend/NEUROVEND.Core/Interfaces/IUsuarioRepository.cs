using NEUROVEND.Core.Entities;

namespace NEUROVEND.Core.Interfaces;

public interface IUsuarioRepository
{
    Task<Usuario?> GetByUsernameAsync(string username);
    Task<bool> ExistsByUsernameAsync(string username);
    Task CreateAsync(Usuario usuario);
}
