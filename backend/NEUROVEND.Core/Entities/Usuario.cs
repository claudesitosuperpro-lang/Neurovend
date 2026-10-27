namespace NEUROVEND.Core.Entities;

public class Usuario
{
    public long Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty; // "dueño" | "empleado"
    public bool Activo { get; set; } = true;
    public DateTime CreadoEn { get; set; }
}
