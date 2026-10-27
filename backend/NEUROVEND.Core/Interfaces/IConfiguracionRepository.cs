using NEUROVEND.Core.Entities;

namespace NEUROVEND.Core.Interfaces;

public interface IConfiguracionRepository
{
    Task<Configuracion> GetAsync();
    Task SaveAsync(Configuracion configuracion);
}
