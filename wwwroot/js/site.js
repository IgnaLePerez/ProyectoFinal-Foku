// ==========================================
// CONFIGURACIÓN Y ESTADO DEL POMODORO
// ==========================================
let modesConfig = {
    'concentracion': { min: 25, sec: 0 },
    'pausaCorta': { min: 5, sec: 0 },
    'pausaLarga': { min: 15, sec: 0 }
};

let modoActual = 'concentracion';
let tiempoRestante = getModeSeconds('concentracion');
let timerId = null;
let enEjecucion = false;
let contadorPomodoros = 0;

function getModeSeconds(mode) {
    return (modesConfig[mode].min * 60) + modesConfig[mode].sec;
}

function formatDurationText(min, sec) {
    let parts = [];
    if (min > 0) parts.push(`${min} minuto${min > 1 ? 's' : ''}`);
    if (sec > 0 || min === 0) parts.push(`${sec} segundo${sec !== 1 ? 's' : ''}`);
    return parts.join(' y ');
}

// ==========================================
// PERSONALIZACIÓN VÍA DESPLEGABLE COMPACTO
// ==========================================
function toggleConfigPanel() {
    const panel = document.getElementById('configPanel');
    if (panel) {
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) {
            cargarTiempoEnInputs();
        }
    }
}

function cargarTiempoEnInputs() {
    const select = document.getElementById('config-mode-select');
    if (!select) return;

    const modoSeleccionado = select.value;
    const config = modesConfig[modoSeleccionado];

    document.getElementById('input-custom-min').value = config.min;
    document.getElementById('input-custom-sec').value = config.sec;
}

function updateCustomDurations() {
    const select = document.getElementById('config-mode-select');
    if (!select) return;

    const modoSeleccionado = select.value;
    const min = parseInt(document.getElementById('input-custom-min').value) || 0;
    const sec = parseInt(document.getElementById('input-custom-sec').value) || 0;

    modesConfig[modoSeleccionado].min = min;
    modesConfig[modoSeleccionado].sec = sec;

    if (!enEjecucion && modoActual === modoSeleccionado) {
        tiempoRestante = getModeSeconds(modoActual);
        actualizarPantalla();
    }
    actualizarIndicadorProximo();
}

// ==========================================
// FUNCIONES DE INTERFAZ Y ACTUALIZACIÓN
// ==========================================
function actualizarPantalla() {
    const minutos = Math.floor(tiempoRestante / 60);
    const segundos = tiempoRestante % 60;
    const textoTiempo = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    
    const display = document.getElementById('timer-display');
    if (display) {
        display.innerText = textoTiempo;
    }
}

function actualizarIndicadorProximo() {
    const labelProximo = document.getElementById('next-cycle-label');
    const badgeCiclo = document.getElementById('cycleBadge');

    if (badgeCiclo) {
        badgeCiclo.innerText = `Ciclo #${contadorPomodoros + 1}`;
    }

    if (!labelProximo) return;

    if (modoActual === 'concentracion') {
        const proximoEsLargo = (contadorPomodoros + 1) % 4 === 0;
        const targetMode = proximoEsLargo ? 'pausaLarga' : 'pausaCorta';
        const durText = formatDurationText(modesConfig[targetMode].min, modesConfig[targetMode].sec);
        
        labelProximo.innerText = `Próximo ciclo: ${durText} de ${proximoEsLargo ? 'pausa larga' : 'descanso'}`;
    } else {
        const durText = formatDurationText(modesConfig['concentracion'].min, modesConfig['concentracion'].sec);
        labelProximo.innerText = `Próximo ciclo: ${durText} de concentración`;
    }
}

function actualizarAparienciaModo() {
    const widget = document.getElementById('pomodoro-widget');
    if (!widget) return;

    if (modoActual === 'pausaCorta' || modoActual === 'pausaLarga') {
        widget.classList.add('modo-descanso');
    } else {
        widget.classList.remove('modo-descanso');
    }

    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));

    let activeTabId = 'mode-concentracion';
    if (modoActual === 'pausaCorta') activeTabId = 'mode-pausaCorta';
    if (modoActual === 'pausaLarga') activeTabId = 'mode-pausaLarga';

    const activeElem = document.getElementById(activeTabId);
    if (activeElem) activeElem.classList.add('active');

    actualizarIndicadorProximo();
}

// ==========================================
// CONTROLES Y LÓGICA DE TEMPORIZADOR
// ==========================================
function toggleTimer() {
    const btnToggle = document.getElementById('btn-toggle-timer');

    if (enEjecucion) {
        clearInterval(timerId);
        enEjecucion = false;
        if (btnToggle) btnToggle.innerText = 'Seguir';
    } else {
        enEjecucion = true;
        if (btnToggle) btnToggle.innerText = 'Pausar';

        timerId = setInterval(() => {
            if (tiempoRestante > 0) {
                tiempoRestante--;
                actualizarPantalla();
            } else {
                clearInterval(timerId);
                enEjecucion = false;
                avanzarSiguienteCicloAutomatico();
            }
        }, 1000);
    }
}

function avanzarSiguienteCicloAutomatico() {
    if (modoActual === 'concentracion') {
        contadorPomodoros++;
        if (contadorPomodoros % 4 === 0) {
            modoActual = 'pausaLarga';
        } else {
            modoActual = 'pausaCorta';
        }
    } else {
        modoActual = 'concentracion';
    }

    tiempoRestante = getModeSeconds(modoActual);
    actualizarAparienciaModo();
    actualizarPantalla();
    toggleTimer();
}

function seleccionarModoManual(nuevoModo) {
    if (!modesConfig[nuevoModo]) return;

    clearInterval(timerId);
    enEjecucion = false;

    modoActual = nuevoModo;
    tiempoRestante = getModeSeconds(modoActual);

    const btnToggle = document.getElementById('btn-toggle-timer');
    if (btnToggle) btnToggle.innerText = 'Empezar';

    actualizarAparienciaModo();
    actualizarPantalla();
}

function resetTimer() {
    clearInterval(timerId);
    enEjecucion = false;

    tiempoRestante = getModeSeconds(modoActual);

    const btnToggle = document.getElementById('btn-toggle-timer');
    if (btnToggle) btnToggle.innerText = 'Empezar';

    actualizarPantalla();
}

// ==========================================
// VENTANA Y ARRASTRE CON LÍMITES
// ==========================================
function abrirPomodoro() {
    const widget = document.getElementById('pomodoro-widget');
    if (widget) {
        widget.classList.remove('hidden');
        asegurarDentroDePantalla(widget);
    }
}

function cerrarPomodoro() {
    const widget = document.getElementById('pomodoro-widget');
    if (widget) widget.classList.add('hidden');
}

function asegurarDentroDePantalla(widget) {
    if (!widget || widget.classList.contains('hidden')) return;

    const rect = widget.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let newLeft = widget.offsetLeft;
    let newTop = widget.offsetTop;

    if (rect.right > windowWidth) newLeft = windowWidth - rect.width - 10;
    if (rect.left < 0) newLeft = 10;
    if (rect.bottom > windowHeight) newTop = windowHeight - rect.height - 10;
    if (rect.top < 0) newTop = 10;

    widget.style.left = `${Math.max(10, newLeft)}px`;
    widget.style.top = `${Math.max(10, newTop)}px`;
}

function hacerArrastrable(widget) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = widget.querySelector('.widget-header');
    
    if (header) {
        header.onmousedown = arrastrarMouseDown;
    }

    function arrastrarMouseDown(e) {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;

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

        let nuevoTop = widget.offsetTop - pos2;
        let nuevoLeft = widget.offsetLeft - pos1;

        const maxLeft = window.innerWidth - widget.offsetWidth;
        const maxTop = window.innerHeight - widget.offsetHeight;

        nuevoLeft = Math.max(0, Math.min(nuevoLeft, maxLeft));
        nuevoTop = Math.max(0, Math.min(nuevoTop, maxTop));

        widget.style.top = `${nuevoTop}px`;
        widget.style.left = `${nuevoLeft}px`;
    }

    function cerrarArrastre() {
        document.onmousemove = null;
        document.onmouseup = null;
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const widget = document.getElementById('pomodoro-widget');

    if (widget) {
        hacerArrastrable(widget);
    }
    actualizarAparienciaModo();
    actualizarPantalla();

    if (nextBtn) {
        nextBtn.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            siguientePasoTutorial();
        });
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            cerrarTutorial();
        });
    }

    if (document.getElementById('tour-overlay')) {
        iniciarTutorialSiHaceFalta();
    }

    window.addEventListener('resize', () => {
        if (widget) {
            asegurarDentroDePantalla(widget);
        }
    });
});
/* ==========================================
   LÓGICA DEL TOUR PASO A PASO (FOKU)
   ========================================== */

// Configuración de los pasos del tour
const listaPasosTour = [
    {
        elementoId: 'tour-documentos',
        titulo: 'Documentos',
        descripcion: 'Aquí podrás gestionar, organizar y acceder a todos tus archivos de estudio.'
    },
    {
        elementoId: 'btn-pomodoro',
        titulo: 'Pomodoro',
        descripcion: 'Utiliza esta herramienta para mantener tus sesiones de concentración y descansos.'
    },
    {
        elementoId: 'tour-tareas',
        titulo: 'Tareas',
        descripcion: 'Organiza tus pendientes día a día para no olvidar nada importante.'
    },
    {
        elementoId: 'tour-calendario',
        titulo: 'Calendario',
        descripcion: 'Visualiza tus entrega de trabajos, exámenes y eventos importantes.'
    },
    {
        elementoId: 'tour-racha',
        titulo: 'Racha',
        descripcion: '¡Tu constancia suma! Aquí verás los días seguidos que has estado activo.'
    }
];

let indicePasoActual = 0;

function iniciarTour() {
    // Verificar si el usuario ya completó o salteó el tour
    if (localStorage.getItem('foku_tour_completado') === 'true') {
        return;
    }

    const overlay = document.getElementById('tour-overlay');
    if (overlay) {
        overlay.classList.add('visible');
    }

    indicePasoActual = 0;
    mostrarPasoActual();
}

function mostrarPasoActual() {
    // Quitar resaltado del paso previo
    const elementoPrevio = document.querySelector('.tour-resaltado');
    if (elementoPrevio) {
        elementoPrevio.classList.remove('tour-resaltado');
    }

    // Obtener datos del paso actual
    const pasoInfo = listaPasosTour[indicePasoActual];
    const elementoActual = document.getElementById(pasoInfo.elementoId);
    const tarjeta = document.getElementById('tour-card');
    const tituloEl = document.getElementById('tour-titulo');
    const descEl = document.getElementById('tour-descripcion');

    if (!elementoActual || !tarjeta) return;

    // Resaltar elemento objetivo
    elementoActual.classList.add('tour-resaltado');

    // Cargar contenido
    tituloEl.innerText = pasoInfo.titulo;
    descEl.innerText = pasoInfo.descripcion;

    // Mostrar tarjeta
    tarjeta.classList.remove('hidden');

    // Posicionar la tarjeta al lado o cerca del elemento
    posicionarTarjeta(elementoActual, tarjeta);
}

function posicionarTarjeta(elemento, tarjeta) {
    const rect = elemento.getBoundingClientRect();

    // Posicionamiento lateral (por defecto a la derecha o ajustado si es la racha)
    let left = rect.right + 15;
    let top = rect.top;

    // Si la tarjeta se sale a la derecha, la colocamos debajo o a la izquierda
    if (left + 320 > window.innerWidth) {
        left = rect.left - 330;
        if (left < 10) {
            left = 20;
            top = rect.bottom + 15;
        }
    }

    tarjeta.style.left = `${left}px`;
    tarjeta.style.top = `${top}px`;
}

function siguientePaso() {
    indicePasoActual++;

    // Si llegamos al final, cerramos
    if (indicePasoActual >= listaPasosTour.length) {
        finalizarTour();
    } else {
        mostrarPasoActual();
    }
}

function saltearTour() {
    finalizarTour();
}

function finalizarTour() {
    // Ocultar tarjeta y overlay
    const tarjeta = document.getElementById('tour-card');
    const overlay = document.getElementById('tour-overlay');
    const elementoResaltado = document.querySelector('.tour-resaltado');

    if (tarjeta) tarjeta.classList.add('hidden');
    if (overlay) overlay.classList.remove('visible');
    if (elementoResaltado) elementoResaltado.classList.remove('tour-resaltado');

    // Marcar en almacenamiento local para no volver a mostrarlo en este navegador
    localStorage.setItem('foku_tour_completado', 'true');
}

// Evento al cargar el DOM para inicializar componentes y el tour
document.addEventListener('DOMContentLoaded', () => {
    const widget = document.getElementById('pomodoro-widget');

    if (widget) {
        hacerArrastrable(widget);
        actualizarAparienciaModo();
        actualizarPantalla();
    }

    // Iniciar el tour
    iniciarTour();
});