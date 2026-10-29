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

    public static List<Tarea> GetTareasPorUsuario(int id){
        List<Tarea> tareas = new List<Tarea>();
        string query = @"SELECT 
                            ID AS Id,
                            FechaLimite,
                            Fecha,
                            Nombre,
                            [Descripcion] AS Descripcion,
                            Terminada,
                            IdUsuario
                        FROM Tareas
                        WHERE IdUsuario = @pId";
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            tareas = connection.Query<Tarea>(query, new { pId = id }).ToList();
        }
        return tareas;
    }

    public static List<Etiqueta> ObtenerEtiquetasPorUsuario(int idUsuario)
    {
        string query = "exec ObtenerEtiquetasPorUsuario @pIdUsuario";
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            return connection.Query<Etiqueta>(query, new { pIdUsuario = idUsuario }).ToList();
        }
    }

    public static List<Tarea> ObtenerTareasFiltradas(int idUsuario, int? idEtiqueta = null, bool? terminada = null, string? busqueda = null)
    {
        List<Tarea> tareas;
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            tareas = connection.Query<Tarea>(
                "exec FiltrarTareas @pIdUsuario, @pIdEtiqueta, @pTerminada",
                new
                {
                    pIdUsuario = idUsuario,
                    pIdEtiqueta = idEtiqueta,
                    pTerminada = terminada
                }
            ).ToList();
        }

        foreach (var tarea in tareas)
        {
            tarea.Etiquetas = ObtenerEtiquetasDeTarea(tarea.Id);
        }

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var texto = busqueda.Trim();
            tareas = tareas
                .Where(t => (t.Nombre ?? string.Empty).Contains(texto, StringComparison.OrdinalIgnoreCase)
                    || (t.Descripcion ?? string.Empty).Contains(texto, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        return tareas
            .OrderBy(t => t.Terminada)
            .ThenBy(t => t.Nombre, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public static List<Etiqueta> ObtenerEtiquetasDeTarea(int idTarea)
    {
        string query = @"SELECT e.ID AS Id, e.Nombre, e.Color, e.IdUsuario
                        FROM TareasXEtiquetas txe
                        INNER JOIN Etiquetas e ON e.ID = txe.IdEtiqueta
                        WHERE txe.IdTarea = @pIdTarea";

        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            return connection.Query<Etiqueta>(query, new { pIdTarea = idTarea }).ToList();
        }
    }

    public static void AgregarTarea(int idUsuario, string nombre, string? descripcion = null, DateTime? fechaLimite = null)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            connection.Execute(
                "exec AgregarTarea @pNombre, @pIdUsuario, @pFechaLimite, @pDescripcion",
                new
                {
                    pNombre = nombre,
                    pIdUsuario = idUsuario,
                    pFechaLimite = fechaLimite,
                    pDescripcion = descripcion
                }
            );
        }
    }

    public static void CrearEtiqueta(int idUsuario, string nombre, string color)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            connection.Execute(
                "exec AgregarEtiqueta @pNombre, @pColor, @pIdUsuario",
                new
                {
                    pNombre = nombre,
                    pColor = color,
                    pIdUsuario = idUsuario
                }
            );
        }
    }

    public static void AgregarEtiquetaATarea(int idTarea, int idEtiqueta)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            connection.Execute(
                @"IF NOT EXISTS (
                        SELECT 1
                        FROM TareasXEtiquetas
                        WHERE IdTarea = @pIdTarea AND IdEtiqueta = @pIdEtiqueta)
                    INSERT INTO TareasXEtiquetas (IdTarea, IdEtiqueta)
                    VALUES (@pIdTarea, @pIdEtiqueta);",
                new { pIdTarea = idTarea, pIdEtiqueta = idEtiqueta }
            );
        }
    }

    public static void QuitarEtiquetaDeTarea(int idTarea, int idEtiqueta)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            connection.Execute(
                "DELETE FROM TareasXEtiquetas WHERE IdTarea = @pIdTarea AND IdEtiqueta = @pIdEtiqueta;",
                new { pIdTarea = idTarea, pIdEtiqueta = idEtiqueta }
            );
        }
    }

    public static void ModificarTarea(int idTarea, bool? terminada = null, string? nombre = null, string? descripcion = null, DateTime? fechaLimite = null)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            connection.Execute(
                "exec ModificarTarea @pIdTarea, @pNombre, @pFechaLimite, @pDescripcion, @pTerminada",
                new
                {
                    pIdTarea = idTarea,
                    pNombre = nombre,
                    pFechaLimite = fechaLimite,
                    pDescripcion = descripcion,
                    pTerminada = terminada
                }
            );
        }
    }

    public static void BorrarTarea(int idTarea)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            connection.Execute(
                "exec BorrarTarea @pIdTarea",
                new { pIdTarea = idTarea }
            );
        }
    }

    public static void BorrarEtiqueta(int idEtiqueta)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            connection.Execute(
                "exec BorrarEtiqueta @pIdEtiqueta",
                new { pIdEtiqueta = idEtiqueta }
            );
        }
    }
}