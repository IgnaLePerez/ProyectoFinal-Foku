using Dapper;
using Microsoft.Data.SqlClient;
using Foku.Models;
using System.Globalization;

namespace Foku.Models;

public static class BD
{
        private static string _connectionString = @"Server=localhost;DataBase=DBFoku;Integrated Security=True;TrustServerCertificate=True;";

    public static string BuscarSesion(string nombreUsuario, string contraseña)
    {
        string query = "exec BuscarSesion @pUsername, @pContraseña";

        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            int id = connection.QueryFirstOrDefault<int>(query, new { pUsername = nombreUsuario, pContraseña = contraseña });

            return id.ToString();
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

    public static int ActualizarUsuario(int id, string nombre, string username)
    {
        string query = "UPDATE Usuarios SET Nombre = @pNombre, Username = @pUsername WHERE ID = @pId";

        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            int filasModificadas = connection.Execute(query, new
            {
                pId = id,
                pNombre = nombre,
                pUsername = username
            });

            return filasModificadas;
        }
    }

    public static void ActualizarFotoPerfil(int id, string fotoPerfil)
    {
        string query = "UPDATE Usuarios SET FotoPerfil = @pFotoPerfil WHERE ID = @pId";

        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            connection.Execute(query, new
            {
                pId = id,
                pFotoPerfil = fotoPerfil
            });
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

    public static List<object> ObtenerTareasFiltradas(int idUsuario, int? idEtiqueta = null, bool? terminada = null, string? busqueda = null)
    {
        List<Tarea> tareas;
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            tareas = connection.Query<Tarea>("exec FiltrarTareas @pIdUsuario, @pIdEtiqueta, @pTerminada", new {
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
            .Select(t => (object)new {
                id = t.Id,
                nombre = t.Nombre,
                descripcion = t.Descripcion,
                fechaLimite = t.FechaLimite?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                terminada = t.Terminada,
                tags = t.Etiquetas.Select(e => new { id = e.Id, nombre = e.Nombre, color = e.Color }).ToList()
            })
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

    public static void ModificarEtiqueta(int idEtiqueta, string nombre, string color)
    {
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            connection.Execute(
                "exec ModificarEtiqueta @pIdEtiqueta, @pNombre, @pColor",
                new
                {
                    pIdEtiqueta = idEtiqueta,
                    pNombre = nombre,
                    pColor = color
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

    public static List<Documento> ObtenerDocumentosPorUsuario(int idUsuario)
    {
        const string query = @"
            SELECT ID AS Id, Nombre, IdUsuario, Destacado
            FROM Documentos
            WHERE IdUsuario = @pIdUsuario
            ORDER BY Destacado DESC, Nombre ASC;";

        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            return connection.Query<Documento>(query, new { pIdUsuario = idUsuario }).ToList();
        }
    }

    public static List<Documento> ObtenerDocumentosFiltrados(int idUsuario, string busqueda)
    {
        const string query = @"
            SELECT ID AS Id, Nombre, IdUsuario, Destacado
            FROM Documentos
            WHERE IdUsuario = @pIdUsuario
              AND (@pBusqueda = '' OR Nombre LIKE '%' + @pBusqueda + '%')
            ORDER BY Destacado DESC, Nombre ASC;";
        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            return connection.Query<Documento>(query, new
            {
                pIdUsuario = idUsuario,
                pBusqueda = busqueda?.Trim() ?? string.Empty
            }).ToList();
        }
    }

    public static int AgregarDocumento(int idUsuario, string nombre)
    {
        const string query = @"
            INSERT INTO Documentos (Nombre, IdUsuario, Destacado)
            OUTPUT INSERTED.ID
            VALUES (@pNombre, @pIdUsuario, 0);";

        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            return connection.QuerySingle<int>(query, new { pNombre = nombre, pIdUsuario = idUsuario });
        }
    }

    public static Documento? ObtenerDocumento(int idDocumento, int idUsuario)
    {
        const string query = @"
            SELECT ID AS Id, Nombre, IdUsuario, Destacado
            FROM Documentos
            WHERE ID = @pIdDocumento AND IdUsuario = @pIdUsuario;";

        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            return connection.QueryFirstOrDefault<Documento>(query, new
            {
                pIdDocumento = idDocumento,
                pIdUsuario = idUsuario
            });
        }
    }

    public static bool AlternarDocumentoDestacado(int idDocumento, int idUsuario)
    {
        const string query = @"
            UPDATE Documentos
            SET Destacado = CASE WHEN Destacado = 1 THEN 0 ELSE 1 END
            WHERE ID = @pIdDocumento AND IdUsuario = @pIdUsuario;

            SELECT Destacado
            FROM Documentos
            WHERE ID = @pIdDocumento AND IdUsuario = @pIdUsuario;";

        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            return connection.QueryFirstOrDefault<bool>(query, new
            {
                pIdDocumento = idDocumento,
                pIdUsuario = idUsuario
            });
        }
    }

    public static bool RenombrarDocumento(int idDocumento, int idUsuario, string nombre)
    {
        const string query = @"
            UPDATE Documentos
            SET Nombre = @pNombre
            WHERE ID = @pIdDocumento AND IdUsuario = @pIdUsuario;";

        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            return connection.Execute(query, new
            {
                pIdDocumento = idDocumento,
                pIdUsuario = idUsuario,
                pNombre = nombre
            }) > 0;
        }
    }

    public static bool EliminarDocumento(int idDocumento, int idUsuario)
    {
        const string query = @"
            BEGIN TRANSACTION;

            DELETE FROM DocumentosXMarcadores
            WHERE IdDocumento = @pIdDocumento;

            DELETE FROM Documentos
            WHERE ID = @pIdDocumento AND IdUsuario = @pIdUsuario;

            COMMIT TRANSACTION;";

        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            int filas = connection.Execute(query, new
            {
                pIdDocumento = idDocumento,
                pIdUsuario = idUsuario
            });
            return filas > 0;
        }
    }

    public static void CambiarContraseña(int id, string contraseña)
    {
        string query = "exec CambiarContraseña @pId, @pContraseña";

        using (SqlConnection connection = new SqlConnection(_connectionString))
        {
            connection.Execute(query, new {pId = id, pContraseña = contraseña});
        }
    }

    // ================= MARCADORES (ETIQUETAS DE PDF) =================

public static List<Marcador> ObtenerMarcadoresPorUsuario(int idUsuario)
{
    const string query = "SELECT ID AS Id, Nombre, Color, IdUsuario FROM Marcadores WHERE IdUsuario = @pIdUsuario ORDER BY ID ASC;";
    using var connection = new SqlConnection(_connectionString);
    return connection.Query<Marcador>(query, new { pIdUsuario = idUsuario }).ToList();
}

public static Marcador CrearMarcador(int idUsuario, string nombre, string color)
{
    const string query = @"
        INSERT INTO Marcadores (Nombre, Color, IdUsuario)
        OUTPUT INSERTED.ID AS Id, INSERTED.Nombre, INSERTED.Color, INSERTED.IdUsuario
        VALUES (@pNombre, @pColor, @pIdUsuario);";
    using var connection = new SqlConnection(_connectionString);
    return connection.QuerySingle<Marcador>(query, new { pNombre = nombre, pColor = color, pIdUsuario = idUsuario });
}

public static bool ModificarMarcador(int idMarcador, int idUsuario, string nombre, string color)
{
    const string query = @"
        UPDATE Marcadores 
        SET Nombre = @pNombre, Color = @pColor 
        WHERE ID = @pIdMarcador AND IdUsuario = @pIdUsuario;";
    using var connection = new SqlConnection(_connectionString);
    return connection.Execute(query, new { pIdMarcador = idMarcador, pIdUsuario = idUsuario, pNombre = nombre, pColor = color }) > 0;
}

public static bool BorrarMarcador(int idMarcador, int idUsuario)
{
    // Gracias al ON DELETE CASCADE en SQL, esto también borra sus resaltados en DocumentosXMarcadores
    const string query = "DELETE FROM Marcadores WHERE ID = @pIdMarcador AND IdUsuario = @pIdUsuario;";
    using var connection = new SqlConnection(_connectionString);
    return connection.Execute(query, new { pIdMarcador = idMarcador, pIdUsuario = idUsuario }) > 0;
}

// ================= RESALTADOS EN DOCUMENTOS =================

public static List<DocumentoMarcador> ObtenerResaltadosPorDocumento(int idDocumento, int idUsuario)
{
    const string query = @"
        SELECT dxm.ID AS Id, dxm.IdDocumento, dxm.IdMarcador, dxm.TextoResaltado, 
               dxm.Pagina, dxm.Coordenadas, m.Nombre AS NombreMarcador, m.Color
        FROM DocumentosXMarcadores dxm
        INNER JOIN Marcadores m ON m.ID = dxm.IdMarcador
        INNER JOIN Documentos d ON d.ID = dxm.IdDocumento
        WHERE dxm.IdDocumento = @pIdDocumento AND d.IdUsuario = @pIdUsuario;";
    using var connection = new SqlConnection(_connectionString);
    return connection.Query<DocumentoMarcador>(query, new { pIdDocumento = idDocumento, pIdUsuario = idUsuario }).ToList();
}

public static DocumentoMarcador AgregarResaltado(int idDocumento, int idMarcador, string texto, int pagina, string coordenadas)
{
    const string query = @"
        INSERT INTO DocumentosXMarcadores (IdDocumento, IdMarcador, TextoResaltado, Pagina, Coordenadas)
        OUTPUT INSERTED.ID
        VALUES (@pIdDocumento, @pIdMarcador, @pTexto, @pPagina, @pCoordenadas);";
    using var connection = new SqlConnection(_connectionString);
    int nuevoId = connection.QuerySingle<int>(query, new { 
        pIdDocumento = idDocumento, 
        pIdMarcador = idMarcador, 
        pTexto = texto, 
        pPagina = pagina, 
        pCoordenadas = coordenadas 
    });

    const string selectQuery = @"
        SELECT dxm.ID AS Id, dxm.IdDocumento, dxm.IdMarcador, dxm.TextoResaltado, 
               dxm.Pagina, dxm.Coordenadas, m.Nombre AS NombreMarcador, m.Color
        FROM DocumentosXMarcadores dxm
        INNER JOIN Marcadores m ON m.ID = dxm.IdMarcador
        WHERE dxm.ID = @pId;";
        return connection.QuerySingle<DocumentoMarcador>(selectQuery, new { pId = nuevoId });
    }

    public static bool EliminarResaltado(int idResaltado, int idUsuario)
    {
        const string query = @"
            DELETE dxm
            FROM DocumentosXMarcadores dxm
            INNER JOIN Documentos d ON d.ID = dxm.IdDocumento
            WHERE dxm.ID = @pIdResaltado AND d.IdUsuario = @pIdUsuario;";
        using var connection = new SqlConnection(_connectionString);
        return connection.Execute(query, new { pIdResaltado = idResaltado, pIdUsuario = idUsuario }) > 0;
    }
}