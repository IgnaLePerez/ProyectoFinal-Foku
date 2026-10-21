async function verificarSesion() {
    const mensaje = document.getElementById('mensajeSesion');
    if (!mensaje) return false;

    try {
        const response = await fetch('/Usuario/VerificarSesion', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (!data || !data.existeSesion) {
            mensaje.textContent = 'La sesión no es válida. Ingrese sus credenciales nuevamente.';
            mensaje.style.color = 'red';
            mensaje.style.display = 'block';
            return false;
        }

        mensaje.style.display = 'none';
        return true;
    } catch (error) {
        console.error('Error verificando sesión:', error);
        mensaje.textContent = 'La sesión no es válida. Ingrese sus credenciales nuevamente.';
        mensaje.style.color = 'red';
        mensaje.style.display = 'block';
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formIniciarSesion');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const sesionValida = await verificarSesion();
        if (!sesionValida) {
            return;
        }

        form.submit();
    });
});

