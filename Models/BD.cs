using Dapper;
using Microsoft.Data.SqlClient;

namespace Foku.Models;

public static class BD
{
        private static string _connectionString = @"Server=localhost;DataBase=DBFoku;Integrated Security=True;TrustServerCertificate=True;";

    public static string BuscarSesion(string nombreUsuario, string contraseña)
    {
        string query = "exec BuscarSesion @pUsername, @pContraseña";

        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            int? id = connection.QueryFirstOrDefault<int?>(
                query,
                new { pUsername = nombreUsuario, pContraseña = contraseña }
            );

            return id?.ToString() ?? "-1";
        }
    }

    public static Usuario GetUsuario(int id){
        Usuario user = null;
        string query = "exec GetUsuario @pId";
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            user = connection.QueryFirstOrDefault<Usuario>(query, new { pId = id });
        }
        return user;
    }

    public static void CrearUsuario(Usuario user){
        string query = "exec RegistrarDatos @pMonedas, @pUsername, @pNombre, @pApellido, @pEmail, @pContraseña, @pRacha";
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            connection.Execute(query, new { pMonedas = user.Monedas, pUsername = user.Username, pNombre = user.Nombre, pApellido = user.Apellido, pEmail = user.Email, pContraseña = user.Contraseña, pRacha = user.Racha });
        }
    }

    public static void ActualizarUsuario(int id, string nombre, string username)
    {
        string query = "UPDATE Usuarios SET Nombre = @pNombre, Username = @pUsername WHERE ID = @pId";
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            connection.Execute(query, new { pId = id, pNombre = nombre, pUsername = username });
        }
    }

    public static bool NombreUsuarioValido(string nombreUsuario){
        string query = "exec GetCantidadUsuariosConNombre @pUsername";
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            int count = connection.QueryFirstOrDefault<int>(query, new { pUsername = nombreUsuario });
            if (count > 0)
            {
                return false;
            }  
        }
        return true;
    }
} 