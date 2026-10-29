using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Foku.Models;

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
}
