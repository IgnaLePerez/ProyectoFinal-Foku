using System.Diagnostics;
using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Foku.Models;
using Calendar = Foku.Models.Calendar;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;

namespace Foku.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    private readonly Calendar _calendar;
    private readonly IWebHostEnvironment _environment;

    public HomeController(ILogger<HomeController> logger, Calendar calendar, IWebHostEnvironment environment)
    {
        _logger = logger;
        _calendar = calendar;
        _environment = environment;
    }

    public IActionResult VistaLanding()
    {
        return View("Landing");
    }

    public async Task<IActionResult> Index()
    {
        string idSesion = HttpContext.Session.GetString("id");

        if (string.IsNullOrEmpty(idSesion) || idSesion == "-1")
        {
            return RedirectToAction("VistaLanding");;
        }

        
        ViewBag.user = BD.GetUsuario(int.Parse(idSesion));
        ViewBag.tareas = BD.GetTareasPorUsuario(int.Parse(idSesion));
        ViewBag.eventos = await _calendar.GetEventos();

        return View("WorkSpace");
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }

    public async Task<IActionResult> WorkSpace()
    {
        if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1")
        {
            return RedirectToAction("VistaLanding");;
        }

        var usuarioId = int.Parse(HttpContext.Session.GetString("id"));
        ViewBag.user = BD.GetUsuario(usuarioId);
        ViewBag.tareas = BD.GetTareasPorUsuario(usuarioId);
        ViewBag.eventos = await _calendar.GetEventos();
        return View();
    }

    public IActionResult GetEtiquetasTareas()
    {
        if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1")
        {
            return RedirectToAction("VistaLanding");
        }
        int usuarioId = int.Parse(HttpContext.Session.GetString("id"));
        List<Etiqueta> etiquetas = new List<Etiqueta>();
        etiquetas = BD.ObtenerEtiquetasPorUsuario(usuarioId);
        return Json(etiquetas);
    }

    [HttpGet]
    public IActionResult GetTareas(string buscar = "", string idEtiqueta = "", string terminada = "")
    {
        if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1")
        {
            return RedirectToAction("VistaLanding");
        }

        var usuarioId = int.Parse(HttpContext.Session.GetString("id"));
        int? etiquetaId = string.IsNullOrWhiteSpace(idEtiqueta) ? null : int.Parse(idEtiqueta);
        bool? finalizada = string.IsNullOrWhiteSpace(terminada) ? null : bool.Parse(terminada);

        var tareas = BD.ObtenerTareasFiltradas(usuarioId, etiquetaId, finalizada, buscar)
            .Select(t => new {
                id = t.Id,
                nombre = t.Nombre,
                descripcion = t.Descripcion,
                fechaLimite = t.FechaLimite?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                terminada = t.Terminada,
                tags = t.Etiquetas.Select(e => new { id = e.Id, nombre = e.Nombre, color = e.Color }).ToList()
            })
            .ToList();

        return Json(tareas);
    }

    [HttpPost]
    public IActionResult AddTarea([FromBody] TareaInput payload)
    {
        if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1")
        {
            return RedirectToAction("VistaLanding");
        }

        if (string.IsNullOrWhiteSpace(payload?.nombre)
            || !TryParseFechaLimite(payload.fechaLimite, out var fechaLimite))
        {
            return BadRequest();
        }

        var usuarioId = int.Parse(HttpContext.Session.GetString("id"));
        BD.AgregarTarea(usuarioId, payload.nombre, payload.descripcion ?? string.Empty, fechaLimite);
        return Ok();
    }

    private static bool TryParseFechaLimite(string? valor, out DateTime? fechaLimite)
    {
        if (string.IsNullOrWhiteSpace(valor))
        {
            fechaLimite = null;
            return true;
        }

        if (DateTime.TryParseExact(valor, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var fecha)
            && fecha >= new DateTime(1753, 1, 1))
        {
            fechaLimite = fecha;
            return true;
        }

        fechaLimite = null;
        return false;
    }

    [HttpPost]
    public IActionResult UpdateTarea([FromBody] UpdateTareaInput payload)
    {
        if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1")
        {
            return RedirectToAction("VistaLanding");
        }

        if (payload == null || payload.idTarea <= 0 || string.IsNullOrWhiteSpace(payload.nombre))
        {
            return BadRequest();
        }

        var usuarioId = int.Parse(HttpContext.Session.GetString("id"));
        var tarea = BD.GetTareasPorUsuario(usuarioId).FirstOrDefault(t => t.Id == payload.idTarea);
        if (tarea == null)
        {
            return Forbid();
        }

        BD.ModificarTarea(payload.idTarea, nombre: payload.nombre.Trim(), descripcion: payload.descripcion?.Trim());
        return Ok();
    }

    [HttpPost]
    public IActionResult ToggleTarea([FromBody] ToggleTareaInput payload)
    {
        if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1")
        {
            return RedirectToAction("VistaLanding");
        }

        if (payload == null || payload.id <= 0)
        {
            return BadRequest();
        }

        BD.ModificarTarea(payload.id, payload.terminada);
        return Ok();
    }

    [HttpPost]
    public IActionResult UpdateEtiqueta([FromBody] EtiquetaInput payload)
    {
        if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1")
        {
            return RedirectToAction("VistaLanding");
        }

        if (payload == null || payload.id <= 0 || string.IsNullOrWhiteSpace(payload.nombre) || string.IsNullOrWhiteSpace(payload.color))
        {
            return BadRequest();
        }

        var usuarioId = int.Parse(HttpContext.Session.GetString("id"));
        var etiqueta = BD.ObtenerEtiquetasPorUsuario(usuarioId).FirstOrDefault(e => e.Id == payload.id);
        if (etiqueta == null)
        {
            return Forbid();
        }

        BD.ModificarEtiqueta(payload.id, payload.nombre.Trim(), payload.color.Trim());
        return Ok();
    }

    [HttpPost]
    public IActionResult CrearEtiqueta([FromBody] EtiquetaInput payload)
    {
        if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1")
        {
            return RedirectToAction("VistaLanding");
        }

        if (payload == null || string.IsNullOrWhiteSpace(payload.nombre) || string.IsNullOrWhiteSpace(payload.color))
        {
            return BadRequest();
        }

        var usuarioId = int.Parse(HttpContext.Session.GetString("id"));
        var nombre = payload.nombre.Trim();
        var color = payload.color.Trim();

        if (string.IsNullOrWhiteSpace(nombre))
        {
            return BadRequest();
        }

        BD.CrearEtiqueta(usuarioId, nombre, color);

        var nuevaEtiqueta = BD.ObtenerEtiquetasPorUsuario(usuarioId)
            .OrderByDescending(e => e.Id)
            .FirstOrDefault(e => e.Nombre == nombre && e.Color == color);

        if (nuevaEtiqueta == null)
        {
            return Ok();
        }

        return Json(new { id = nuevaEtiqueta.Id, nombre = nuevaEtiqueta.Nombre, color = nuevaEtiqueta.Color });
    }

    [HttpPost]
    public IActionResult AddEtiquetaTarea([FromBody] TareaEtiquetaInput payload)
    {
       if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1")
        {
            return RedirectToAction("VistaLanding");
        }

        if (payload == null || payload.idTarea <= 0 || payload.idEtiqueta <= 0)
        {
            return BadRequest();
        }

        var usuarioId = int.Parse(HttpContext.Session.GetString("id"));
        var tarea = BD.GetTareasPorUsuario(usuarioId).FirstOrDefault(t => t.Id == payload.idTarea);
        if (tarea == null)
        {
            return Forbid();
        }

        BD.AgregarEtiquetaATarea(payload.idTarea, payload.idEtiqueta);
        return Ok();
    }

    [HttpPost]
    public IActionResult RemoveEtiquetaTarea([FromBody] TareaEtiquetaInput payload)
    {
        if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1")
        {
            return RedirectToAction("VistaLanding");
        }

        if (payload == null || payload.idTarea <= 0 || payload.idEtiqueta <= 0)
        {
            return BadRequest();
        }

        var usuarioId = int.Parse(HttpContext.Session.GetString("id"));
        var tarea = BD.GetTareasPorUsuario(usuarioId).FirstOrDefault(t => t.Id == payload.idTarea);
        if (tarea == null)
        {
            return Forbid();
        }

        BD.QuitarEtiquetaDeTarea(payload.idTarea, payload.idEtiqueta);
        return Ok();
    }

    [HttpPost]
    public IActionResult DeleteTarea([FromBody] TareaIdInput payload)
    {
        if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1")
        {
            return RedirectToAction("VistaLanding");
        }

        if (payload == null || payload.idTarea <= 0)
        {
            return BadRequest();
        }

        var usuarioId = int.Parse(HttpContext.Session.GetString("id"));
        var tarea = BD.GetTareasPorUsuario(usuarioId).FirstOrDefault(t => t.Id == payload.idTarea);
        if (tarea == null)
        {
            return Forbid();
        }

        BD.BorrarTarea(payload.idTarea);
        return Ok();
    }

    [HttpPost]
    public IActionResult DeleteEtiqueta([FromBody] EtiquetaIdInput payload)
    {
        if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1")
        {
            return RedirectToAction("VistaLanding");;
        }

        if (payload == null || payload.idEtiqueta <= 0)
        {
            return BadRequest();
        }

        var usuarioId = int.Parse(HttpContext.Session.GetString("id"));
        var etiqueta = BD.ObtenerEtiquetasPorUsuario(usuarioId).FirstOrDefault(e => e.Id == payload.idEtiqueta);
        if (etiqueta == null)
        {
            return Forbid();
        }

        BD.BorrarEtiqueta(payload.idEtiqueta);
        return Ok();
    }

    /*[HttpGet]
    public IActionResult GetDocumentos(string buscar = "")
    {
        if (!TryGetUsuarioSesion(out int usuarioId)) return Unauthorized();
        var usuarioId = int.Parse(HttpContext.Session.GetString("id"));
        var documentos = BD.ObtenerDocumentosFiltrados(usuarioId, buscar);
        return Json(documentos);
    }*/

    [HttpPost]
    [RequestSizeLimit(100_000_000)]
    public async Task<IActionResult> UploadDocumento(IFormFile archivo)
    {
        if (!TryGetUsuarioSesion(out int usuarioId)) return Unauthorized();
        if (archivo == null || archivo.Length == 0) return BadRequest("No se recibió ningún archivo.");

        var extension = Path.GetExtension(archivo.FileName);
        if (!string.Equals(extension, ".pdf", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Solo se permiten archivos PDF.");
        }

        var nombreSeguro = Path.GetFileName(archivo.FileName).Trim();
        if (nombreSeguro.Length == 0) return BadRequest("Nombre de archivo inválido.");

        int id = BD.AgregarDocumento(usuarioId, nombreSeguro);
        var carpeta = Path.Combine(_environment.WebRootPath, "uploads", "documentos");
        Directory.CreateDirectory(carpeta);
        var rutaFisica = Path.Combine(carpeta, id + ".pdf");

        await using var stream = System.IO.File.Create(rutaFisica);
        await archivo.CopyToAsync(stream);

        var documento = BD.ObtenerDocumento(id, usuarioId);
        return documento == null ? Ok() : Json(DocumentoJson(documento));
    }

    [HttpPost]
    public IActionResult ToggleDocumento([FromBody] DocumentoIdInput payload)
    {
        if (!TryGetUsuarioSesion(out int usuarioId)) return Unauthorized();
        if (payload == null || payload.id <= 0) return BadRequest();

        var documento = BD.ObtenerDocumento(payload.id, usuarioId);
        if (documento == null) return Forbid();

        bool destacado = BD.AlternarDocumentoDestacado(payload.id, usuarioId);
        documento.Destacado = destacado;
        return Json(DocumentoJson(documento));
    }

    [HttpPost]
    public IActionResult RenombrarDocumento([FromBody] RenombrarDocumentoInput payload)
    {
        if (!TryGetUsuarioSesion(out int usuarioId)) return Unauthorized();
        if (payload == null || payload.id <= 0 || string.IsNullOrWhiteSpace(payload.nombre)) return BadRequest();

        var documento = BD.ObtenerDocumento(payload.id, usuarioId);
        if (documento == null) return Forbid();

        var nombre = payload.nombre.Trim();
        if (!BD.RenombrarDocumento(payload.id, usuarioId, nombre)) return NotFound();

        documento.Nombre = nombre;
        return Json(DocumentoJson(documento));
    }

    [HttpPost]
    public IActionResult EliminarDocumento([FromBody] DocumentoIdInput payload)
    {
        if (!TryGetUsuarioSesion(out int usuarioId)) return Unauthorized();
        if (payload == null || payload.id <= 0) return BadRequest();

        var documento = BD.ObtenerDocumento(payload.id, usuarioId);
        if (documento == null) return Forbid();

        if (!BD.EliminarDocumento(payload.id, usuarioId)) return NotFound();

        var rutaFisica = Path.Combine(_environment.WebRootPath, "uploads", "documentos", payload.id + ".pdf");
        if (System.IO.File.Exists(rutaFisica)) System.IO.File.Delete(rutaFisica);

        return Ok();
    }

    private bool TryGetUsuarioSesion(out int usuarioId)
    {
        var idSesion = HttpContext.Session.GetString("id");
        return int.TryParse(idSesion, out usuarioId) && usuarioId > 0;
    }

    private static object DocumentoJson(Documento documento)
    {
        return new
        {
            id = documento.Id,
            nombre = documento.Nombre,
            destacado = documento.Destacado,
            ruta = $"/uploads/documentos/{documento.Id}.pdf"
        };
    }

    /*[HttpGet]
    public IActionResult GetTareas(string buscar = "")
    {
        if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1")
        {
            return RedirectToAction("VistaLanding");
        }

        var usuarioId = int.Parse(HttpContext.Session.GetString("id"));
        var tareas = BD.ObtenerTareasFiltradas(usuarioId, etiquetaId, finalizada, buscar)
            .Select(t => new {
                id = t.Id,
                nombre = t.Nombre,
                descripcion = t.Descripcion,
                fechaLimite = t.FechaLimite?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                terminada = t.Terminada,
                tags = t.Etiquetas.Select(e => new { id = e.Id, nombre = e.Nombre, color = e.Color }).ToList()
            })
            .ToList();

        return Json(tareas);
    }*/

    public class TareaInput
    {
        public string nombre { get; set; }
        public string descripcion { get; set; }
        public string? fechaLimite { get; set; }
    }

    public class UpdateTareaInput
    {
        public int idTarea { get; set; }
        public string nombre { get; set; }
        public string descripcion { get; set; }
    }

    public class ToggleTareaInput
    {
        public int id { get; set; }
        public bool terminada { get; set; }
    }

    public class EtiquetaInput
    {
        public int id { get; set; }
        public string nombre { get; set; }
        public string color { get; set; }
    }

    public class TareaEtiquetaInput
    {
        public int idTarea { get; set; }
        public int idEtiqueta { get; set; }
    }

    public class TareaIdInput
    {
        public int idTarea { get; set; }
    }

    public class EtiquetaIdInput
    {
        public int idEtiqueta { get; set; }
    }

    public class DocumentoIdInput
    {
        public int id { get; set; }
    }

    public class RenombrarDocumentoInput
    {
        public int id { get; set; }
        public string nombre { get; set; } = string.Empty;
    }
}
