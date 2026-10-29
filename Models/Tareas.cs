namespace Foku.Models;

public class Tarea{
    public int Id { get; set; }
    public DateTime FechaLimite { get; set; }
    public DateTime FechaCreacion { get; set; }
    public string Nombre { get; set; }
    public string Descripcion { get; set; }
    public bool Terminada { get; set; }

    public Tarea(){}
}