using System.Diagnostics;
using Foku.Models;
using Microsoft.AspNetCore.Mvc;

namespace Foku.Controllers;

public class UsuarioController : Controller
{
    private readonly IWebHostEnvironment _environment;
    public UsuarioController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public IActionResult VistaIniciarSesion()
    {
        return View("IniciarSesion");
    }

    [HttpPost]
    public IActionResult IniciarSesion(string nombreUsuario, string contraseña)
    {
        if (contraseña != contraseña.Trim())
        {
            TempData["ErrorLogin"] = "La contraseña no puede tener espacios al principio o al final.";
            return RedirectToAction("VistaIniciarSesion");
        }

        HttpContext.Session.SetString("id", BD.BuscarSesion(nombreUsuario, contraseña));
        return RedirectToAction("Index", "Home");
    }

    [HttpPost]
    public IActionResult CerrarSesion()
    {
        HttpContext.Session.SetString("id", "-1");
        return RedirectToAction("VistaLanding", "Home");
    }

    public IActionResult Registrarse()
    {
        ViewBag.msj = null;
        return View();
    }

    [HttpPost]
    public IActionResult RegistrarDatos(string nombreUsuario, string contraseña, string nombre, string apellido, string email)
    {
        if (contraseña.Length < 8 || contraseña.Contains(" "))
        {
            ViewBag.msj = "La contraseña debe tener al menos 8 caracteres, con letras y números.";

            ViewBag.nombreUsuario = nombreUsuario;
            ViewBag.nombre = nombre;
            ViewBag.apellido = apellido;
            ViewBag.email = email;

            return View("Registrarse");
        }

        Usuario user = new Usuario(0, nombreUsuario, nombre, apellido, email, contraseña, 0);
        BD.CrearUsuario(user);

        string id = BD.BuscarSesion(nombreUsuario, contraseña);
        HttpContext.Session.SetString("id", id);
        return RedirectToAction("Index", "Home");
    }

    [HttpGet]
    public bool NombreUsuarioValido(string nombreUsuario)
    {
        bool valido = BD.NombreUsuarioValido(nombreUsuario);
        return valido;
    }

    [HttpGet]
    public bool SesionValida(string nombreUsuario, string password)
    {
        if (BD.BuscarSesion(nombreUsuario, password) == "0"){
            return false;
        }
        return true;
    }

    [HttpGet]
    public IActionResult Perfil()
    {
        string? idSesion = HttpContext.Session.GetString("id");
        if (string.IsNullOrEmpty(idSesion) || idSesion == "-1")
        {
            return RedirectToAction("VistaLanding", "Home");
        }
        Usuario usuario = BD.GetUsuario(int.Parse(idSesion));
        if (usuario == null)
        {
            HttpContext.Session.Clear();
            return RedirectToAction("VistaLanding", "Home");
        }

        return View(usuario);
    }

    [HttpPost]
    public IActionResult EditarPerfil(string nombre, string nombreUsuario)
    {
        string? idSesion = HttpContext.Session.GetString("id");
        if (string.IsNullOrEmpty(idSesion) || idSesion == "-1")
        {
            return RedirectToAction("VistaLanding", "Home");
        }

        Usuario usuarioActual = BD.GetUsuario(int.Parse(idSesion));
        if (usuarioActual == null)
        {
            HttpContext.Session.Clear();
            return RedirectToAction("VistaLanding", "Home");
        }

        if (string.IsNullOrWhiteSpace(nombre) || string.IsNullOrWhiteSpace(nombreUsuario))
        {
            TempData["ErrorPerfil"] = "Nombre y nombre de usuario son obligatorios.";
            return RedirectToAction("Perfil");
        }

        string nuevoNombre = nombre.Trim();
        string nuevoUsuario = nombreUsuario.Trim();

        if (nuevoUsuario.Length < 4 || nuevoUsuario.Length > 20 || !System.Text.RegularExpressions.Regex.IsMatch(nuevoUsuario, "^[a-zA-Z0-9_]+$"))
        {
            TempData["ErrorPerfil"] = "El nombre de usuario debe tener entre 4 y 20 caracteres y solo letras, números o guion bajo.";
            return RedirectToAction("Perfil");
        }

        if (!usuarioActual.Username.Equals(nuevoUsuario, StringComparison.OrdinalIgnoreCase) && !BD.NombreUsuarioValido(nuevoUsuario))
        {
            TempData["ErrorPerfil"] = "Ese nombre de usuario ya está en uso.";
            return RedirectToAction("Perfil");
        }

        BD.ActualizarUsuario(usuarioActual.Id, nuevoNombre, nuevoUsuario);
        TempData["SuccessPerfil"] = "Perfil actualizado correctamente.";
        return RedirectToAction("Perfil");
    }

    [HttpPost]
public IActionResult CambiarFotoPerfil(IFormFile foto)
{
    string? idSesion = HttpContext.Session.GetString("id");

    if (string.IsNullOrEmpty(idSesion) || idSesion == "-1")
    {
        return RedirectToAction("VistaLanding", "Home");
    }

    Usuario usuario = BD.GetUsuario(int.Parse(idSesion));

    if (usuario == null)
    {
        HttpContext.Session.Clear();
        return RedirectToAction("VistaLanding", "Home");
    }

    if (foto == null || foto.Length == 0)
    {
        TempData["ErrorPerfil"] = "Seleccioná una imagen.";
        return RedirectToAction("Perfil");
    }

    if (foto.Length > 5 * 1024 * 1024)
    {
        TempData["ErrorPerfil"] = "La imagen no puede superar los 5 MB.";
        return RedirectToAction("Perfil");
    }

    string extension = Path.GetExtension(foto.FileName).ToLowerInvariant();

    if (extension != ".jpg" && extension != ".jpeg" && extension != ".png")
    {
        TempData["ErrorPerfil"] = "Solo se permiten imágenes JPG, JPEG o PNG.";
        return RedirectToAction("Perfil");
    }

    string carpeta = Path.Combine(_environment.WebRootPath, "uploads", "perfiles");

    if (!Directory.Exists(carpeta))
    {
        Directory.CreateDirectory(carpeta);
    }

    string nombreArchivo = Guid.NewGuid().ToString() + extension;
    string rutaArchivo = Path.Combine(carpeta, nombreArchivo);

    using (var stream = new FileStream(rutaArchivo, FileMode.Create))
    {
        foto.CopyTo(stream);
    }

    string rutaFoto = "/uploads/perfiles/" + nombreArchivo;

    // Eliminar la foto anterior, si existe
    if (!string.IsNullOrWhiteSpace(usuario.FotoPerfil))
    {
            string rutaAnterior = Path.Combine(
                _environment.WebRootPath,
                usuario.FotoPerfil.TrimStart('/').Replace('/', Path.DirectorySeparatorChar)
            );

            if (System.IO.File.Exists(rutaAnterior))
            {
                System.IO.File.Delete(rutaAnterior);
            }
        }

        BD.ActualizarFotoPerfil(usuario.Id, rutaFoto);

        TempData["SuccessPerfil"] = "Foto de perfil actualizada correctamente.";

        return RedirectToAction("Perfil");
    }

    [HttpPost]
    public IActionResult CambiarContraseña(string nuevaContraseña, string confirmarContraseña)
    {
        string idSesion = HttpContext.Session.GetString("id");

        if (idSesion == null || idSesion == "-1")
        {
            return RedirectToAction("VistaLanding", "Home");
        }

        Usuario usuario = BD.GetUsuario(int.Parse(idSesion));

        if (usuario == null)
        {
            return RedirectToAction("VistaLanding", "Home");
        }

        if (nuevaContraseña != nuevaContraseña.Trim() || confirmarContraseña != confirmarContraseña.Trim())
        {
            TempData["ErrorPassword"] = "La contraseña no puede tener espacios al principio o al final.";
            return RedirectToAction("Perfil");
        }

        if (nuevaContraseña == usuario.Contraseña)
        {
            TempData["ErrorPassword"] = "La nueva contraseña no puede ser igual a la actual.";
            return RedirectToAction("Perfil");
        }

        if (nuevaContraseña == "" || confirmarContraseña == "")
        {
            TempData["ErrorPassword"] = "Completá los dos campos.";
            return RedirectToAction("Perfil");
        }

        if (nuevaContraseña != confirmarContraseña)
        {
            TempData["ErrorPassword"] = "Las contraseñas no coinciden.";
            return RedirectToAction("Perfil");
        }

        if (nuevaContraseña.Length < 8)
        {
            TempData["ErrorPassword"] = "La contraseña debe tener al menos 8 caracteres.";
            return RedirectToAction("Perfil");
        }

        bool tieneLetra = false;
        bool tieneNumero = false;

        foreach (char caracter in nuevaContraseña)
        {
            if (char.IsLetter(caracter))
            {
                tieneLetra = true;
            }

            if (char.IsDigit(caracter))
            {
                tieneNumero = true;
            }
        }

        if (!tieneLetra || !tieneNumero)
        {
            TempData["ErrorPassword"] = "La contraseña debe incluir letras y números.";
            return RedirectToAction("Perfil");
        }

        if (nuevaContraseña == "12345678a" || nuevaContraseña == "12345678q" || nuevaContraseña == "abcdefgh" || nuevaContraseña == "password" || nuevaContraseña == "Password" || nuevaContraseña == "password123" || nuevaContraseña == "Password123" || nuevaContraseña == "admin123" || nuevaContraseña == "Contraseña" || nuevaContraseña == "Contraseña12345" || nuevaContraseña == "contraseña" || nuevaContraseña == "contraseña12345")
        {
            TempData["ErrorPassword"] = "La contraseña es muy común. Elegí otra.";
            return RedirectToAction("Perfil");
        }

        BD.CambiarContraseña(usuario.Id, nuevaContraseña);

        TempData["SuccessPerfil"] = "Contraseña actualizada correctamente.";

        return RedirectToAction("Perfil");
    }
}
