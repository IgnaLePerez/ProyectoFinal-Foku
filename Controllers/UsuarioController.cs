using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Foku.Models;

namespace Foku.Controllers;

public class UsuarioController : Controller
{

    public IActionResult VistaIniciarSesion()
    {
        return View("IniciarSesion");
    }

    [HttpPost]
    public IActionResult IniciarSesion(string nombreUsuario, string contraseña)
    {
        HttpContext.Session.SetString("id", BD.BuscarSesion(nombreUsuario, contraseña));
        return RedirectToAction("Index", "Home");
    }

    public IActionResult CerrarSesion()
    {
        HttpContext.Session.Clear();
        return RedirectToAction("Index", "Home");
    }

    public IActionResult Registrarse()
    {
        ViewBag.msj = null;
        return View();
    }

    [HttpPost]
    public IActionResult RegistrarDatos(string nombreUsuario, string contraseña, string nombre, string apellido, string email)
    {
        Usuario user = new Usuario(0, nombreUsuario, nombre, apellido, email, contraseña, 0);

        BD.CrearUsuario(user);

        string id = BD.BuscarSesion(nombreUsuario, contraseña);
        HttpContext.Session.SetString("id", id);
        Console.WriteLine(HttpContext.Session.GetString("id"));
        return RedirectToAction("Index", "Home");
    }

[HttpGet]
public bool NombreUsuarioValido(string nombreUsuario)
{
    bool valido = BD.NombreUsuarioValido(nombreUsuario);
    return valido;
}

    [HttpGet]
    public IActionResult VerificarSesion()
    {
        string? id = HttpContext.Session.GetString("id");
        bool existeSesion = !string.IsNullOrEmpty(id) && id != "-1";

        return Json(new { existeSesion });
    }
}
