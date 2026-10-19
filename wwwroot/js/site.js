// Funciones para abrir y cerrar el widget de Pomodoro
function abrirPomodoro() {
    const widget = document.getElementById('pomodoro-widget');
    if (widget) {
        widget.classList.remove('hidden');
    }
}

function cerrarPomodoro() {
    const widget = document.getElementById('pomodoro-widget');
    if (widget) {
        widget.classList.add('hidden');
    }
}

// Inicializar la función de arrastrar cuando el DOM haya cargado
document.addEventListener('DOMContentLoaded', () => {
    const widget = document.getElementById('pomodoro-widget');
    if (widget) {
        hacerArrastrable(widget);
    }
});

// Lógica para permitir que el widget se mueva por la pantalla
function hacerArrastrable(widget) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = widget.querySelector('.widget-header');
    
    if (header) {
        header.onmousedown = arrastrarMouseDown;
    }

    function arrastrarMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmousemove = elementoArrastrado;
        document.onmouseup = cerrarArrastre;
    }

    function elementoArrastrado(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        widget.style.top = (widget.offsetTop - pos2) + "px";
        widget.style.left = (widget.offsetLeft - pos1) + "px";
    }

    function cerrarArrastre() {
        document.onmousemove = null;
        document.onmouseup = null;
    }
}