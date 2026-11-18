namespace Foku.Models;

public class Etiqueta
{
    public int Id { get; set; }
    public string Nombre { get; set; }
    public string Color { get; set; }
    public int IdUsuario { get; set; }

    public Etiqueta(int id, string nombre, string color, int idUsuario)
    {
        Id = id;
        Nombre = nombre;
        Color = color;
        IdUsuario = idUsuario;
    }
}