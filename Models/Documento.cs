namespace Foku.Models;

public class Documento
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int IdUsuario { get; set; }
    public bool Destacado { get; set; }
    public string? RutaArchivo { get; set; }
}
