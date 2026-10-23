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

async function validarUsuario() {
    const username = inputUserName.value.trim();

    if (username.length < 4 || username.length > 20) {
        mostrarError(inputUserName, labelUserName, 'Nombre de usuario - Debe tener entre 4 y 20 caracteres');
        return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        mostrarError(inputUserName, labelUserName, 'Nombre de usuario - Solo letras, números y guion bajo');
        return false;
    }

    try {
        const response = await fetch('/Usuario/NombreUsuarioValido?nombreUsuario=' + encodeURIComponent(username), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        if (!data) {
            mostrarError(inputUserName, labelUserName, 'Nombre de usuario - El nombre de usuario ya existe, por favor elija otro');
            return false;
        }

        limpiarError(inputUserName, labelUserName);
        return true;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

function validarPassword() {
    const password = inputPassword.value;
    if (password.length < 8) {
        mostrarError(inputPassword, labelPassword, 'Contraseña - La contraseña debe tener al menos 8 caracteres');
        return false;
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        mostrarError(inputPassword, labelPassword, 'Contraseña - Debe incluir letras y números');
        return false;
    }

    limpiarError(inputPassword, labelPassword);
    return true;
}

async function validarCampos(event) {
    event.preventDefault();

    const usuarioValido = await validarUsuario();
    const passwordValida = validarPassword();

    if (!usuarioValido || !passwordValida) {
        return;
    }

    event.target.submit();
}

const formRegistrarse = document.getElementById('formRegistrarse');
if (formRegistrarse) {
    formRegistrarse.addEventListener('submit', validarCampos);
}