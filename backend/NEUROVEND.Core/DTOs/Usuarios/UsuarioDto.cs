namespace NEUROVEND.Core.DTOs.Usuarios;

public record UsuarioDto(long Id, string Nombre, string Username, string Rol, bool Activo, DateTime CreadoEn);
