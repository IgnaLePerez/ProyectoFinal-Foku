namespace Foku.Models;

public class Tarea{
    public int Id { get; set; }
    public DateTime? FechaLimite { get; set; }
    public DateTime? Fecha { get; set; }
    public string Nombre { get; set; }
    public string Descripcion { get; set; }
    public bool Terminada { get; set; }
    public int IdUsuario { get; set; }
    public List<Etiqueta> Etiquetas { get; set; } = new();

    public Tarea(){ }
}

public class Etiqueta
{
    public int Id { get; set; }
    public string Nombre { get; set; }
    public string Color { get; set; }
    public int IdUsuario { get; set; }
}