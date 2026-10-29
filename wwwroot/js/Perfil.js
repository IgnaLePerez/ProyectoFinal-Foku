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