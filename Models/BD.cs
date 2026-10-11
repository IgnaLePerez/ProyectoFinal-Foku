using Dapper;
using Microsoft.Data.SqlClient;

namespace Foku.Models;

public static class BD
{
        private static string _connectionString = @"Server=localhost\sqlexpress; DataBase=DBFoku;Integrated Security=True;TrustServerCertificate=True;";

    public static string BuscarSesion(string nombreUsuario, string contraseña)
    {
        string id = "-1";
        string query = "SELECT id FROM Usuarios WHERE Username = @NombreUsuario AND Contraseña = @Contraseña";
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            if(connection.QueryFirstOrDefault<string>(query, new { NombreUsuario = nombreUsuario, Contraseña = contraseña }) != null)
            {
                id = connection.QueryFirstOrDefault<string>(query, new { NombreUsuario = nombreUsuario, Contraseña = contraseña }).ToString();
            }
        }
        return id;
    }

    public static Usuario GetUsuario(int id){
        Usuario user = null;
        string query = "SELECT * FROM Usuarios WHERE id = @Id";
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            user = connection.QueryFirstOrDefault<Usuario>(query, new { Id = id });
        }
        return user;
    }

    public static void CrearUsuario(Usuario user){
        string query = "INSERT INTO Usuarios (Monedas, Username, Nombre, Apellido, Email, Contraseña, Racha) VALUES (@pMonedas, @pUsername, @pNombre, @pApellido, @pEmail, @pContraseña, @pRacha)";
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            connection.Execute(query, new { pMonedas = user.Monedas, pUsername = user.Username, pNombre = user.Nombre, pApellido = user.Apellido, pEmail = user.Email, pContraseña = user.Contraseña, pRacha = user.Racha });
        }
    }

    public static bool NombreUsuarioValido(string nombreUsuario){
        string query = "SELECT COUNT(Username) FROM Usuarios WHERE Username = @nombreUsuario";
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            int count = connection.QueryFirstOrDefault<int>(query, new { nombreUsuario = nombreUsuario });
            if (count > 0)
            {
                return false;
            }  
        }
        return true;
    }
} 