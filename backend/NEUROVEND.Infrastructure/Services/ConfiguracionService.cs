using NEUROVEND.Core.Entities;
using NEUROVEND.Core.Interfaces;

namespace NEUROVEND.Infrastructure.Services;

public class ConfiguracionService(IConfiguracionRepository configuracionRepository) : IConfiguracionService
{
    public Task<Configuracion> GetAsync() => configuracionRepository.GetAsync();
    public Task SaveAsync(Configuracion configuracion) => configuracionRepository.SaveAsync(configuracion);
}
