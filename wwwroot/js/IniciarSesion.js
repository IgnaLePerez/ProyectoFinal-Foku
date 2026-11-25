const inputUserName = document.getElementById('inputUserName');
const inputPassword = document.getElementById('inputPassword');
const labelUserName = document.getElementById('labelUserName');
const labelPassword = document.getElementById('labelPassword');

function limpiarError(input, label) {
    if (!input || !label) return;
    input.style.borderColor = '';
    input.style.boxShadow = '';
    label.style.color = '';
    label.innerHTML = label.dataset.originalText || label.textContent;
}

function mostrarError(input, label, mensaje) {
    if (!input || !label) return;
    input.style.borderColor = 'red';
    input.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
    label.style.color = 'red';
    label.innerHTML = mensaje;
}


async function verificarSesion(event) {
    event.preventDefault();

    const username = inputUserName.value.trim();
    const password = inputPassword.value.trim();

    if (!username) {
        mostrarError(inputUserName, labelUserName, 'Nombre de usuario - Campo obligatorio');
        return;
    }

    if (!password) {
        mostrarError(inputPassword, labelPassword, 'Contraseña - Campo obligatorio');
        return;
    }

    try {
        // Verificar si el nombre de usuario existe
        const response = await fetch(
            '/Usuario/NombreUsuarioValido?nombreUsuario=' + encodeURIComponent(username)
        );

        const data = await response.json();

        if (data) {
            mostrarError(inputUserName, labelUserName, 'Nombre de usuario - El nombre de usuario no existe, por favor elija otro');
            return;
        }

        // Verificar si la sesión es válida
        const responseSesion = await fetch(
            '/Usuario/SesionValida?nombreUsuario=' + encodeURIComponent(username) +
            '&password=' + encodeURIComponent(password)
        );

        const dataSesion = await responseSesion.json();
        if (!dataSesion) {
            mostrarError(inputPassword, labelPassword, 'Contraseña - Sesión inválida');
            return;
        }

        // Si ambas verificaciones son correctas
        limpiarError(inputUserName, labelUserName);
        limpiarError(inputPassword, labelPassword);

        event.target.submit();

    } catch (error) {
        console.error('Error:', error);
    }
}


const formIniciarSesion = document.getElementById('formIniciarSesion');
if (formIniciarSesion) {
    formIniciarSesion.addEventListener('submit', verificarSesion);
}