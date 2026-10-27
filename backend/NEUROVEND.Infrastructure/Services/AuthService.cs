using NEUROVEND.Core.Entities;
using NEUROVEND.Core.Interfaces;

namespace NEUROVEND.Infrastructure.Services;

public class AuthService(IUsuarioRepository usuarioRepository) : IAuthService
{
    public async Task<Usuario?> AuthenticateAsync(string username, string password)
    {
        var usuario = await usuarioRepository.GetByUsernameAsync(username);
        if (usuario == null) return null;
        return BCrypt.Net.BCrypt.Verify(password, usuario.PasswordHash) ? usuario : null;
    }

    public async Task<bool> RegisterAsync(string nombre, string username, string password, string rol)
    {
        if (await usuarioRepository.ExistsByUsernameAsync(username)) return false;
        var usuario = new Usuario
        {
            Nombre = nombre,
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Rol = rol
        };
        await usuarioRepository.CreateAsync(usuario);
        return true;
    }

    public bool IsOwner(Usuario usuario) => usuario.Rol == "dueño";
}
