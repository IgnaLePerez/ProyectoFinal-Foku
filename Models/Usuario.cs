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

    public Usuario(int monedas, string username, string nombre, string apellido, string email, string contraseña, int racha)
    {
        Monedas = monedas;
        Username = username;
        Nombre = nombre;
        Apellido = apellido;
        Email = email;
        Contraseña = contraseña;
        Racha = racha;
    }
}