using NEUROVEND.Core.Entities;

namespace NEUROVEND.Core.Interfaces;

public interface IConfiguracionService
{
    Task<Configuracion> GetAsync();
    Task SaveAsync(Configuracion configuracion);
}
