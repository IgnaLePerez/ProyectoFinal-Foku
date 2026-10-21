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

    public IActionResult VistaLanding()
    {
        return View("Landing");
    }

    public IActionResult Index()
    {
        if (HttpContext.Session.GetString("id") == null || HttpContext.Session.GetString("id") == "-1"){
            return RedirectToAction("VistaLanding");
        }
        ViewBag.user = BD.GetUsuario(int.Parse(HttpContext.Session.GetString("id")));
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
}
