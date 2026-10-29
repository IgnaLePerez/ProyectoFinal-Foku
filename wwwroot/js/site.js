// CONFIGURACIÓN Y ESTADO DEL POMODORO
let modesConfig = {
    'concentracion': { min: 25, sec: 0 },
    'pausaCorta': { min: 5, sec: 0 },
    'pausalarga': { min: 15, sec: 0 }
};

let modoActual = 'concentracion';
let tiempoRestante = getModeSeconds('concentracion');
let timerId = null;
let enEjecucion = false;
let contadorPomodoros = 0;
let modoConfiguracion = 'concentracion';

function getModeSeconds(mode) {
    return (modesConfig[mode].min * 60) + modesConfig[mode].sec;
}

function formatDurationText(min, sec) {
    let parts = [];
    if (min > 0) parts.push(`${min} minuto${min > 1 ? 's' : ''}`);
    if (sec > 0 || min === 0) parts.push(`${sec} segundo${sec !== 1 ? 's' : ''}`);
    return parts.join(' y ');
}

// CÁLCULO Y MOSTRADO DE LA RECOMENDACIÓN (20% Pausa Corta y 4x Pausa corta para Pausa Larga)
function calcularYMostrarRecomendacion() {
    const recElem = document.getElementById('config-recommendation');
    if (!recElem) return;

    // Obtener duración total de concentración en segundos
    const concTotalSec = getModeSeconds('concentracion');

    // Recreo corto = 20% (una quinta parte)
    const recCortaTotalSec = Math.round(concTotalSec * 0.20);
    const recCortaMin = Math.floor(recCortaTotalSec / 60);
    const recCortaSec = recCortaTotalSec % 60;

    // Recreo largo = suma de 4 veces el recreo corto
    const recLargaTotalSec = recCortaTotalSec * 4;
    const recLargaMin = Math.floor(recLargaTotalSec / 60);
    const recLargaSec = recLargaTotalSec % 60;

    recElem.innerText = `Recomendación: Pausa corta ${recCortaMin}m ${recCortaSec}s | Pausa larga ${recLargaMin}m ${recLargaSec}s`;
}

// PERSONALIZACIÓN VÍA DESPLEGABLE COMPACTO
function toggleConfigPanel() {
    const panel = document.getElementById('configPanel');
    if (panel) {
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) {
            seleccionarModoConfiguracion(modoConfiguracion);
            calcularYMostrarRecomendacion();
        }
    }
}

function seleccionarModoConfiguracion(modo) {
    if (!modesConfig[modo]) return;

    modoConfiguracion = modo;
    document.querySelectorAll('.config-mode-btn').forEach(button => {
        const seleccionado = button.dataset.mode === modo;
        button.classList.toggle('active', seleccionado);
        button.setAttribute('aria-pressed', seleccionado);
    });
    cargarTiempoEnInputs();
}

function cargarTiempoEnInputs() {
    const config = modesConfig[modoConfiguracion];
    const inputMinutos = document.getElementById('input-custom-min');
    const inputSegundos = document.getElementById('input-custom-sec');
    if (!config || !inputMinutos || !inputSegundos) return;

    inputMinutos.value = config.min;
    inputSegundos.value = config.sec;
}

function updateCustomDurations() {
    const modoSeleccionado = modoConfiguracion;
    const min = parseInt(document.getElementById('input-custom-min').value) || 0;
    const sec = parseInt(document.getElementById('input-custom-sec').value) || 0;

    modesConfig[modoSeleccionado].min = min;
    modesConfig[modoSeleccionado].sec = sec;

    // Calcular y actualizar la recomendación cuando cambia cualquier valor
    calcularYMostrarRecomendacion();

    if (!enEjecucion && modoActual === modoSeleccionado) {
        tiempoRestante = getModeSeconds(modoActual);
        actualizarPantalla();
    }
    actualizarIndicadorProximo();
}

// FUNCIONES DE INTERFAZ Y ACTUALIZACIÓN
function actualizarPantalla() {
    const minutos = Math.floor(tiempoRestante / 60);
    const segundos = tiempoRestante % 60;
    const textoTiempo = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    
    const display = document.getElementById('timer-display');
    if (display) {
        display.innerText = textoTiempo;
    }

    actualizarBarraProgreso();
}

function actualizarBarraProgreso() {
    const progressFill = document.getElementById('timer-progress-fill');
    if (!progressFill) return;

    const totalSegundos = getModeSeconds(modoActual);
    const progreso = totalSegundos === 0 ? 0 : ((totalSegundos - tiempoRestante) / totalSegundos) * 100;
    const porcentaje = Math.min(Math.max(progreso, 0), 100);

    const esModoDescanso = modoActual === 'pausaCorta' || modoActual === 'pausalarga';
    const colorInicio = esModoDescanso ? '#4F6D9A' : '#FF9509';
    const colorFinal = esModoDescanso ? '#6C8EC2' : '#FFAD42';

    progressFill.style.width = `${porcentaje}%`;
    progressFill.style.background = `linear-gradient(90deg, ${colorInicio} 0%, ${colorFinal} 100%)`;
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
        const targetMode = proximoEsLargo ? 'pausalarga' : 'pausaCorta';
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

    if (modoActual === 'pausaCorta' || modoActual === 'pausalarga') {
        widget.classList.add('modo-descanso');
    } else {
        widget.classList.remove('modo-descanso');
    }

    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));

    let activeTabId = 'mode-concentracion';
    if (modoActual === 'pausaCorta') activeTabId = 'mode-pausaCorta';
    if (modoActual === 'pausalarga') activeTabId = 'mode-pausalarga';

    const activeElem = document.getElementById(activeTabId);
    if (activeElem) activeElem.classList.add('active');

    actualizarIndicadorProximo();
}

// CONTROLES Y LÓGICA DE TEMPORIZADOR
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
            modoActual = 'pausalarga';
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

// VENTANA Y ARRASTRE CON LÍMITES
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

function minimizarPomodoro() {
    const widget = document.getElementById('pomodoro-widget');
    const panel = document.getElementById('configPanel');
    if (!widget) return;

    if (panel) panel.classList.remove('open');

    widget.classList.add('minimized');
    asegurarDentroDePantalla(widget);
}

function restaurarPomodoro() {
    const widget = document.getElementById('pomodoro-widget');
    if (!widget) return;

    widget.classList.remove('minimized');
    asegurarDentroDePantalla(widget);
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

/* ==========================================
   LÓGICA DEL TOUR PASO A PASO POR USUARIO
   ========================================== */

const listaPasosTour = [
    {
        elementoId: 'tour-documentos',
        titulo: 'Documentos',
        descripcion: 'Acá podrás gestionar, organizar y acceder a todos tus archivos de estudio y trabajo.'
    },
    {
        elementoId: 'btn-pomodoro',
        titulo: 'Pomodoro',
        descripcion: 'Utiliza esta herramienta para mantener tus sesiones de concentración y descansos controlados.'
    },
    {
        elementoId: 'tour-tareas',
        titulo: 'Tareas',
        descripcion: 'Organizá tus pendientes día a día para no olvidar nada importante. Podrás anotar, borar, agregar o eliminar las tareas que necesites. ¡También podrás agregar etiquetas en las tareas para tenerlas más organizadas!.'
    },
    {
        elementoId: 'tour-calendario',
        titulo: 'Calendario',
        descripcion: 'Visualiza tus entregas de trabajos, exámenes y eventos importantes.'
    },
    {
        elementoId: 'tour-racha',
        titulo: 'Racha',
        descripcion: '¡Tu constancia suma! Aquí verás los días seguidos que has estado activo.'
    }
];

let indicePasoActual = 0;

// Obtiene la clave única del usuario logueado
function obtenerClaveUsuarioTour() {
    const overlay = document.getElementById('tour-overlay');
    const usuario = overlay ? overlay.getAttribute('data-usuario') : 'invitado';
    return `foku_tour_completado_${usuario}`;
}

// Inicia el tour si el usuario actual no lo vio
function iniciarTour() {
    const claveTour = obtenerClaveUsuarioTour();

    // Comprueba si el tour ya fue completado con el ID actual
    if (localStorage.getItem(claveTour) === 'true') {
        return;
    }

    // Recupera el progreso guardado con el nombre de usuario anterior
    const claveAnterior = 'foku_tour_completado_CamiTesteoPerfil3';

    if (localStorage.getItem(claveAnterior) === 'true') {
        localStorage.setItem(claveTour, 'true');
        return;
    }

    const overlay = document.getElementById('tour-overlay');

    if (overlay) overlay.classList.add('visible');

    indicePasoActual = 0;
    mostrarPasoActual();
}
// Muestra la tarjeta y resalta el elemento del paso actual
function mostrarPasoActual() {
    // Quitar resaltado del paso anterior
    const elementoPrevio = document.querySelector('.tour-resaltado');
    if (elementoPrevio) {
        elementoPrevio.classList.remove('tour-resaltado');
    }

    const pasoInfo = listaPasosTour[indicePasoActual];
    const elementoActual = document.getElementById(pasoInfo.elementoId);
    const tarjeta = document.getElementById('tour-card');
    const tituloEl = document.getElementById('tour-titulo');
    const descEl = document.getElementById('tour-descripcion');
    const btnAnterior = document.getElementById('btn-anterior-tour');

    if (!elementoActual || !tarjeta) return;

    // Resaltar elemento activo
    elementoActual.classList.add('tour-resaltado');

    // Actualizar textos
    tituloEl.innerText = pasoInfo.titulo;
    descEl.innerText = pasoInfo.descripcion;

    // Ocultar botón Anterior en el primer paso (paso 0) y mostrarlo en los demás
    if (btnAnterior) {
        if (indicePasoActual > 0) {
            btnAnterior.classList.remove('hidden');
        } else {
            btnAnterior.classList.add('hidden');
        }
    }

    // Mostrar tarjeta
    tarjeta.classList.remove('hidden');

    // Posicionar tarjeta cerca del elemento
    posicionarTarjeta(elementoActual, tarjeta);
}

// Calcula la posición de la tarjeta para que no se salga de la pantalla
function posicionarTarjeta(elemento, tarjeta) {
    const rect = elemento.getBoundingClientRect();

    let left = rect.right + 15;
    let top = rect.top;

    if (left + 330 > window.innerWidth) {
        left = rect.left - 330;
        if (left < 10) {
            left = 20;
            top = rect.bottom + 15;
        }
    }

    tarjeta.style.left = `${Math.max(10, left)}px`;
    tarjeta.style.top = `${Math.max(10, top)}px`;
}

// Avanzar al siguiente paso o finalizar
function siguientePaso() {
    indicePasoActual++;

    if (indicePasoActual >= listaPasosTour.length) {
        finalizarTour();
    } else {
        mostrarPasoActual();
    }
}
// Volver al paso anterior
function pasoAnterior() {
    if (indicePasoActual > 0) {
        indicePasoActual--;
        mostrarPasoActual();
    }
}
function saltearTour() {
    finalizarTour();
}

// Cierra el tour y guarda la preferencia en localStorage para este usuario
function finalizarTour() {
    const tarjeta = document.getElementById('tour-card');
    const overlay = document.getElementById('tour-overlay');
    const elementoResaltado = document.querySelector('.tour-resaltado');

    if (tarjeta) tarjeta.classList.add('hidden');
    if (overlay) overlay.classList.remove('visible');
    if (elementoResaltado) elementoResaltado.classList.remove('tour-resaltado');

    const claveTour = obtenerClaveUsuarioTour();
    localStorage.setItem(claveTour, 'true');
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const widget = document.getElementById('pomodoro-widget');

    if (widget) {
        hacerArrastrable(widget);
        actualizarAparienciaModo();
        actualizarPantalla();

        const restaurarAlInteractuar = () => {
            if (widget.classList.contains('minimized')) restaurarPomodoro();
        };
        const display = document.getElementById('timer-display');
        const progress = widget.querySelector('.timer-progress');
        if (display) display.addEventListener('click', restaurarAlInteractuar);
        if (progress) {
            progress.addEventListener('click', restaurarAlInteractuar);
            progress.addEventListener('pointerup', restaurarAlInteractuar);
        }
    }

    iniciarTour();
});