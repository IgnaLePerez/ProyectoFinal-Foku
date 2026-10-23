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

async function verificarSesion() {
    const username = inputUserName.value.trim();

    fetch('/Usuario/NombreUsuarioValido?nombreUsuario=' + username, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })
    .then(response => { console.log(response); return response.json(); })
    .then(data => {
        alert(data)
        if(data){
            mostrarError(inputUserName, labelUserName, 'Nombre de usuario - El nombre de usuario no existe, por favor elija otro');
            return false;
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });

    limpiarError(inputUserName, labelUserName);
    return true;
}