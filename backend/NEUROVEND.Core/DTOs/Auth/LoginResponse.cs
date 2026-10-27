namespace NEUROVEND.Core.DTOs.Auth;

public record LoginResponse(string Token, string Nombre, string Username, string Rol, long Id);
