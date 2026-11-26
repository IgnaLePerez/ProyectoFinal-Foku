namespace Foku.Models;

public class Marcador
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Color { get; set; } = "#ffe066";
    public int IdUsuario { get; set; }
}

public class DocumentoMarcador
{
    public int Id { get; set; }
    public int IdDocumento { get; set; }
    public int IdMarcador { get; set; }
    public string TextoResaltado { get; set; } = string.Empty;
    public int Pagina { get; set; }
    public string Coordenadas { get; set; } = "[]";
    
    // Propiedades extra que traemos con INNER JOIN desde Marcadores
    public string NombreMarcador { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}