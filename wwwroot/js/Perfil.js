const modal = document.getElementById('perfilModal');
const formulario = document.getElementById('modalPerfilForm');
const inputNombre = document.getElementById('modalNombre');
const inputUsuario = document.getElementById('modalUsuario');

// Abrir el pop-up
function openPerfilModal() {
    const modal = document.getElementById('perfilModal');

    if (modal) {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
    } else {
        console.error('No se encontró el elemento perfilModal.');
    }
}

function closePerfilModal() {
    const modal = document.getElementById('perfilModal');

    if (modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
    }
}

// Cerrar al hacer clic fuera de la ventana
if (modal) {
    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            closePerfilModal();
        }
    });
}

// Cerrar al apretar Escape
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closePerfilModal();
    }
});

// Mostrar error en el formulario
function mostrarError(mensaje) {
    if (!inputUsuario) return;

    let error = document.getElementById('mensajeErrorPerfil');

    if (!error) {
        error = document.createElement('p');
        error.id = 'mensajeErrorPerfil';
        error.className = 'perfil-mensaje perfil-mensaje-error';
        inputUsuario.parentElement.appendChild(error);
    }

    error.textContent = mensaje;
    error.style.display = 'block';
    inputUsuario.classList.add('error');
}

// Limpiar error
function limpiarError() {
    const error = document.getElementById('mensajeErrorPerfil');

    if (error) {
        error.textContent = '';
        error.style.display = 'none';
    }

    if (inputUsuario) {
        inputUsuario.classList.remove('error');
    }
}

// Borrar el error cuando se modifica el nombre de usuario
if (inputUsuario) {
    inputUsuario.addEventListener('input', limpiarError);
}

// Validar antes de guardar
if (formulario) {
    formulario.addEventListener('submit', async function (event) {
        event.preventDefault();

        const nombre = inputNombre.value.trim();
        const usuario = inputUsuario.value.trim();

        if (nombre === '') {
            mostrarError('El nombre es obligatorio.');
            return;
        }

        if (usuario.length < 4 || usuario.length > 20) {
            mostrarError(
                'El nombre de usuario debe tener entre 4 y 20 caracteres.'
            );
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(usuario)) {
            mostrarError(
                'El nombre de usuario solo puede tener letras, números y guion bajo.'
            );
            return;
        }

        const usuarioActual = formulario.dataset.usuarioActual;

        // Consultar disponibilidad solo si cambió el nombre de usuario
        if (usuario.toLowerCase() !== usuarioActual.toLowerCase()) {
            try {
                const response = await fetch(
                    '/Usuario/NombreUsuarioValido?nombreUsuario=' +
                    encodeURIComponent(usuario)
                );

                if (!response.ok) {
                    mostrarError(
                        'No se pudo verificar el nombre de usuario.'
                    );
                    return;
                }

                const disponible = await response.json();

                if (!disponible) {
                    mostrarError(
                        'Ese nombre de usuario ya está en uso. Elegí otro.'
                    );
                    return;
                }
            } catch (error) {
                console.error(error);
                mostrarError(
                    'No se pudo verificar el nombre de usuario. Intentá nuevamente.'
                );
                return;
            }
        }

        limpiarError();

        // Enviar el formulario al controlador
        formulario.submit();
    });
}

// Si el servidor devuelve un error, volver a abrir el pop-up
if (
    modal &&
    document.querySelector(
        '.perfil-mensaje-error:not(#mensajeErrorPerfil)'
    )
) {
    openPerfilModal();
}
// Cambiar foto de perfil

const inputFotoPerfil = document.getElementById('inputFotoPerfil');
const formFotoPerfil = document.getElementById('formFotoPerfil');

if (inputFotoPerfil && formFotoPerfil) {
    inputFotoPerfil.addEventListener('change', function () {
        if (inputFotoPerfil.files.length > 0) {
            formFotoPerfil.submit();
        }
    });
}

// Abrir el pop-up de cerrar sesión
function openCerrarSesionModal() {
    const modal = document.getElementById('cerrarSesionModal');

    if (modal) {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
    }
}

// Cerrar el pop-up
function closeCerrarSesionModal() {
    const modal = document.getElementById('cerrarSesionModal');

    if (modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
    }
}

// Confirmar cierre de sesión
function confirmarCerrarSesion() {
    const form = document.getElementById('formCerrarSesion');

    if (form) {
        form.submit();
    }
}

function abrirTienda() {
    document.getElementById("tiendaModal").classList.add("open");
}

function cerrarTienda() {
    document.getElementById("tiendaModal").classList.remove("open");
}

// POPUP PARA CAMBIAR CONTRASEÑA

const passwordModal = document.getElementById('passwordModal');
const formCambiarPassword = document.getElementById('formCambiarPassword');

const nuevaContraseña = document.getElementById('nuevaContraseña');
const confirmarContraseña = document.getElementById('confirmarContraseña');
const passwordAyuda = document.getElementById('passwordAyuda');

// Abrir popup de cambiar contraseña
function openPasswordModal() {
    closePerfilModal();

    if (passwordModal) {
        passwordModal.classList.add('open');
        passwordModal.setAttribute('aria-hidden', 'false');
    }
}

// Cerrar popup de cambiar contraseña
function closePasswordModal() {
    if (passwordModal) {
        passwordModal.classList.remove('open');
        passwordModal.setAttribute('aria-hidden', 'true');
    }
}

// Cancelar y volver a Editar perfil
function cancelarPasswordModal() {
    closePasswordModal();
    openPerfilModal();
}

// Mostrar u ocultar contraseña
function mostrarOcultarPassword(id, boton) {
    const input = document.getElementById(id);

    if (!input) return;

    if (input.type === 'password') {
        input.type = 'text';
        boton.textContent = 'Ocultar';
    } else {
        input.type = 'password';
        boton.textContent = 'Mostrar';
    }
}

// Evitar copiar, cortar y pegar en los dos campos
[nuevaContraseña, confirmarContraseña].forEach(input => {
    if (input) {
        input.addEventListener('copy', event => event.preventDefault());
        input.addEventListener('cut', event => event.preventDefault());
        input.addEventListener('paste', event => event.preventDefault());
    }
});

// Contraseñas demasiado comunes
const contraseñasDebiles = [
    '12345678q',
    '12345678a',
    '1234567890',
    'password',
    'password123',
    'qwerty123',
    'abcdefgh',
    'admin123',
    'contraseña',
    'Contraseña',
    'Contraseña12345',
    'contraseña12345'
];

// Validar contraseña
function validarNuevaContraseña() {
    const password = nuevaContraseña.value;

    if (password.length < 8) {
        passwordAyuda.textContent = 'La contraseña debe tener al menos 8 caracteres.';
        passwordAyuda.className = 'password-help error';
        return false;
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        passwordAyuda.textContent = 'Debe incluir al menos una letra y un número.';
        passwordAyuda.className = 'password-help error';
        return false;
    }

    if (contraseñasDebiles.includes(password.toLowerCase())) {
        passwordAyuda.textContent = 'Es una contraseña muy común. Elegí una menos predecible.';
        passwordAyuda.className = 'password-help error';
        return false;
    }

    passwordAyuda.textContent = 'La contraseña cumple con los requisitos.';
    passwordAyuda.className = 'password-help success';

    return true;
}

// Validar mientras escribe
if (nuevaContraseña) {
    nuevaContraseña.addEventListener('input', function () {
        validarNuevaContraseña();
    });
}

// Validar formulario antes de enviarlo
if (formCambiarPassword) {
    formCambiarPassword.addEventListener('submit', function (event) {
        event.preventDefault();

        const passwordValida = validarNuevaContraseña();
        const errorPassword = document.getElementById('errorPassword');

        if (!passwordValida) {
            return;
        }

        if (nuevaContraseña.value !== confirmarContraseña.value) {
            errorPassword.textContent = 'Las contraseñas no coinciden.';
            errorPassword.style.display = 'block';
            confirmarContraseña.focus();
            return;
        }

        errorPassword.style.display = 'none';

        formCambiarPassword.submit();
    });
}

if (confirmarContraseña) {
    confirmarContraseña.addEventListener('input', function () {
        const errorPassword = document.getElementById('errorPassword');

        if (errorPassword) {
            errorPassword.style.display = 'none';
        }
    });
}

// Si el servidor devuelve un error, volver a abrir el popup
if (document.getElementById('mensajeErrorPassword')) {
    openPasswordModal();
}