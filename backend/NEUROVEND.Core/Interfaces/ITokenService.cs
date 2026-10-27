using NEUROVEND.Core.Entities;

namespace NEUROVEND.Core.Interfaces;

public interface ITokenService
{
    string GenerateToken(Usuario usuario);
}
