namespace NEUROVEND.Core.DTOs.Usuarios;

public record UpdateUsuarioRequest(string Nombre, string Username, string Rol, string? Password);
