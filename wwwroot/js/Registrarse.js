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

function validarUsuario() {
    const username = inputUserName.value.trim();
    if (!username) {
        mostrarError(inputUserName, labelUserName, 'Nombre de usuario - Este campo es obligatorio');
        return false;
    }

    if (username.length < 4 || username.length > 20) {
        mostrarError(inputUserName, labelUserName, 'Nombre de usuario - Debe tener entre 4 y 20 caracteres');
        return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        mostrarError(inputUserName, labelUserName, 'Nombre de usuario - Solo letras, números y guion bajo');
        return false;
    }

    return true;
}

function validarPassword() {
    const password = inputPassword.value;
    if (!password) {
        mostrarError(inputPassword, labelPassword, 'Contraseña - Este campo es obligatorio');
        return false;
    }

    if (password.length < 8) {
        mostrarError(inputPassword, labelPassword, 'Contraseña - La contraseña debe tener al menos 8 caracteres');
        return false;
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        mostrarError(inputPassword, labelPassword, 'Contraseña - Debe incluir letras y números');
        return false;
    }

    return true;
}

async function validarNombreUsuarioExistente() {
    const username = inputUserName.value.trim();
    if (!username) return false;

    try {
        const response = await fetch(`/Usuario/NombreUsuarioValido?nombreUsuario=${encodeURIComponent(username)}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        const data = await response.json();
        const usuarioValido = data === true;

        if (!usuarioValido) {
            mostrarError(inputUserName, labelUserName, 'Nombre de usuario - El nombre de usuario ya existe, por favor elija otro');
            return false;
        }

        limpiarError(inputUserName, labelUserName);
        return true;
    } catch (error) {
        console.error('Error validando usuario:', error);
        mostrarError(inputUserName, labelUserName, 'Nombre de usuario - No se pudo validar el usuario');
        return false;
    }
}

function validarCampos() {
    let valido = true;

    if (!validarUsuario()) {
        valido = false;
    }

    if (!validarPassword()) {
        valido = false;
    }

    return valido;
}

if (labelUserName) {
    labelUserName.dataset.originalText = labelUserName.textContent;
}

if (labelPassword) {
    labelPassword.dataset.originalText = labelPassword.textContent;
}

inputUserName?.addEventListener('input', () => {
    if (inputUserName.value.trim() === '') {
        limpiarError(inputUserName, labelUserName);
        return;
    }
    if (validarUsuario()) {
        limpiarError(inputUserName, labelUserName);
    }
});

inputPassword?.addEventListener('input', () => {
    if (inputPassword.value === '') {
        limpiarError(inputPassword, labelPassword);
        return;
    }
    if (validarPassword()) {
        limpiarError(inputPassword, labelPassword);
    }
});

document.querySelector('.formLog')?.addEventListener('submit', async function (event) {
    if (!validarCampos()) {
        event.preventDefault();
        return;
    }

    const usuarioDisponible = await validarNombreUsuarioExistente();
    if (!usuarioDisponible) {
        event.preventDefault();
        return;
    }
});