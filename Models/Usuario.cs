namespace Foku.Models;

public class Usuario{
    public int Id { get; set; }
    public int Monedas { get; set; }
    public string Username { get; set; }
    public string Nombre { get; set; }
    public string Apellido { get; set; }
    public string Email { get; set; }
    public string Contraseña { get; set; }
    public int Racha { get; set; }

    public Usuario(){}
}