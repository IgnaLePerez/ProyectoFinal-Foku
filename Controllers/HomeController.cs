using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Foku.Models;

namespace Foku.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    public IActionResult Index()
    {
        if (HttpContext.Session.GetString("id") == null){
            return RedirectToAction("VistaIniciarSesion", "Usuario");
        }
        ViewBag.user = BD.GetUsuario(int.Parse(HttpContext.Session.GetString("id")));
        return View();   
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
}
