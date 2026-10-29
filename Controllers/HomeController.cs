using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Foku.Models;
using System.Text.Json;

namespace Foku.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    private readonly Calendar _calendar;

    public HomeController(ILogger<HomeController> logger, Calendar calendar)
    {
        _logger = logger;
        _calendar = calendar;
    }

    public IActionResult VistaLanding()
    {
        return View("Landing");
    }

    public async Task<IActionResult> Index()
    {
        string? idSesion = HttpContext.Session.GetString("id");

        if (string.IsNullOrEmpty(idSesion) || idSesion == "-1")
        {
            return RedirectToAction("VistaLanding");
        }

        ViewBag.user = BD.GetUsuario(int.Parse(idSesion));
        ViewBag.tareas = BD.GetTareasPorUsuario(int.Parse(idSesion));

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

    public IActionResult WorkSpace()
    {
        if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1")
        {
            return RedirectToAction("VistaLanding");
        }

        ViewBag.user = BD.GetUsuario(int.Parse(HttpContext.Session.GetString("id")));
        ViewBag.tareas = BD.GetTareasPorUsuario(int.Parse(HttpContext.Session.GetString("id")));
        return View();
    }

    [HttpGet]
    public IActionResult GetEtiquetasTareas()
    {
        if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1")
        {
            return Unauthorized();
        }

        var usuarioId = int.Parse(HttpContext.Session.GetString("id"));
        var etiquetas = BD.ObtenerEtiquetasPorUsuario(usuarioId)
            .Select(e => new { id = e.Id, nombre = e.Nombre, color = e.Color })
            .ToList();

        return Json(etiquetas);
    }

    [HttpGet]
    public IActionResult GetTareas(string buscar = "", string idEtiqueta = "", string terminada = "")
    {
        if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1")
        {
            return Unauthorized();
        }

        var usuarioId = int.Parse(HttpContext.Session.GetString("id"));
        int? etiquetaId = string.IsNullOrWhiteSpace(idEtiqueta) ? null : int.Parse(idEtiqueta);
        bool? finalizada = string.IsNullOrWhiteSpace(terminada) ? null : bool.Parse(terminada);

        var tareas = BD.ObtenerTareasFiltradas(usuarioId, etiquetaId, finalizada, buscar)
            .Select(t => new {
                id = t.Id,
                nombre = t.Nombre,
                descripcion = t.Descripcion,
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
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(payload?.nombre))
        {
            return BadRequest();
        }

        var usuarioId = int.Parse(HttpContext.Session.GetString("id"));
        BD.AgregarTarea(usuarioId, payload.nombre, payload.descripcion ?? string.Empty);
        return Ok();
    }

    [HttpPost]
    public IActionResult ToggleTarea([FromBody] ToggleTareaInput payload)
    {
        if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1")
        {
            return Unauthorized();
        }

        if (payload == null || payload.id <= 0)
        {
            return BadRequest();
        }

        BD.ModificarTarea(payload.id, payload.terminada);
        return Ok();
    }

    [HttpPost]
    public IActionResult CrearEtiqueta([FromBody] EtiquetaInput payload)
    {
        if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1")
        {
            return Unauthorized();
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
            return Unauthorized();
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
            return Unauthorized();
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
            return Unauthorized();
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
            return Unauthorized();
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

    public class TareaInput
    {
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
}
