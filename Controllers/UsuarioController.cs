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

    public IActionResult CerrarSesion(){
        HttpContext.Session.Clear();
        return RedirectToAction("Index", "Home");
    }

    public IActionResult Registrarse(){
        ViewBag.msj = null;
        return View();
    }

    [HttpPost]
    public IActionResult RegistrarDatos(string nombreUsuario, string contraseña, string nombre, string apellido, string email){
        if (BD.NombreUsuarioValido(nombreUsuario)){
            Usuario user = new Usuario(0, nombreUsuario, nombre, apellido, email, contraseña, 0);
            BD.CrearUsuario(user);
            HttpContext.Session.SetString("id", BD.BuscarSesion(nombreUsuario, contraseña));
            return RedirectToAction("Index");
        }
        ViewBag.msj = "El nombre de usuario ya existe, por favor elija otro";
        return View("Registrarse");
    }

    [HttpGet]
    public bool NombreUsuarioValido(string nombreUsuario){
        return BD.NombreUsuarioValido(nombreUsuario);
    }

    public IActionResult WorkSpace(){
        return View();
    }
}