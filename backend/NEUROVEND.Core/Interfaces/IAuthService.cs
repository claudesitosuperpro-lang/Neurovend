using NEUROVEND.Core.Entities;

namespace NEUROVEND.Core.Interfaces;

public interface IAuthService
{
    Task<Usuario?> AuthenticateAsync(string username, string password);
    Task<bool> RegisterAsync(string nombre, string username, string password, string rol);
    bool IsOwner(Usuario usuario);
}
