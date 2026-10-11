labelUserName = document.getElementById("labelUserName");
inputUserName = document.getElementById("inputUserName");
labelPassword = document.getElementById("labelPassword");
inputPassword = document.getElementById("inputPassword");

function validarCampos(){
    fetch('/Usuario/NombreUsuarioValido?nombreUsuario=' + inputUserName.value, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    })
    .then(response => { console.log(response); return response.json(); })
    .then(data => {
        if (!data) {
            labelUserName.innerHTML = "Nombre de usuario - El nombre de usuario ya existe, por favor elija otro";
            labelUserName.style.color = "red";
            inputUserName.style.borderColor = "red";
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });

    if (inputPassword.value.length < 8) {
        labelPassword.innerHTML = "Contraseña - La contraseña debe tener al menos 8 caracteres";
        labelPassword.style.color = "red";
        inputPassword.style.borderColor = "red";
    }
}