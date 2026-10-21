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
    const nextBtn = document.getElementById('tour-next');
    const skipBtn = document.getElementById('tour-skip');

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

const tourSteps = [
    {
        target: '#tour-header-brand',
        text: 'Este es el nombre de tu espacio. Aquí ves a qué proyecto estás entrando.'
    },
    {
        target: '#tour-header-user',
        text: 'Aquí aparece tu usuario y tu racha. Es un resumen rápido de tu progreso.'
    },
    {
        target: '#tour-sidebar',
        text: 'Este menú te lleva a las secciones del workspace, como documentos y tareas.'
    },
    {
        target: '#btn-pomodoro',
        text: 'Este botón abre el temporizador para ayudarte a concentrarte.'
    },
    {
        target: '#pomodoro-widget',
        text: 'Aquí puedes empezar, pausar o reiniciar el temporizador y cambiar el modo de trabajo.'
    }
];

let currentTourStep = 0;
let tourStarted = false;

function actualizarPasoTutorial() {
    const popover = document.getElementById('tour-popover');
    const textEl = document.getElementById('tour-text');
    const nextBtn = document.getElementById('tour-next');
    const badge = document.querySelector('.tour-step-badge');
    const activeTarget = document.querySelector(tourSteps[currentTourStep].target);

    if (!popover || !textEl || !nextBtn || !activeTarget) return;

    const allTargets = document.querySelectorAll('.tour-target');
    allTargets.forEach((element) => {
        element.classList.remove('is-highlighted', 'is-dimmed');
        const tip = element.querySelector('.tour-step-tip');
        if (tip) tip.remove();
    });

    allTargets.forEach((element) => {
        if (element !== activeTarget) {
            element.classList.add('is-dimmed');
        }
    });

    activeTarget.classList.add('is-highlighted');

    const tip = document.createElement('div');
    tip.className = 'tour-step-tip';
    tip.textContent = tourSteps[currentTourStep].text;
    activeTarget.appendChild(tip);

    const isLastStep = currentTourStep === tourSteps.length - 1;
    nextBtn.textContent = isLastStep ? 'Comenzar' : 'Siguiente';
    textEl.textContent = tourSteps[currentTourStep].text;

    if (badge) {
        badge.textContent = `Paso ${currentTourStep + 1}`;
    }

    const rect = activeTarget.getBoundingClientRect();
    const popoverWidth = popover.offsetWidth || 320;
    const left = Math.min(window.innerWidth - popoverWidth - 24, Math.max(20, rect.left + rect.width + 18));
    const top = Math.max(20, rect.top + 10);
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
}

function iniciarTutorial() {
    const overlay = document.getElementById('tour-overlay');
    const popover = document.getElementById('tour-popover');

    if (!overlay || !popover) return;

    tourStarted = true;
    currentTourStep = 0;
    document.body.classList.add('tour-active');
    overlay.classList.add('active');
    popover.classList.add('visible');
    actualizarPasoTutorial();
}

function siguientePasoTutorial() {
    if (!tourStarted) {
        iniciarTutorial();
        return;
    }

    if (currentTourStep < tourSteps.length - 1) {
        currentTourStep += 1;
        actualizarPasoTutorial();
        return;
    }

    cerrarTutorial();
}

function cerrarTutorial() {
    const overlay = document.getElementById('tour-overlay');
    const popover = document.getElementById('tour-popover');
    const allTargets = document.querySelectorAll('.tour-target');

    allTargets.forEach((element) => {
        element.classList.remove('is-highlighted', 'is-dimmed');
        const tip = element.querySelector('.tour-step-tip');
        if (tip) tip.remove();
    });

    document.body.classList.remove('tour-active');
    if (overlay) overlay.classList.remove('active');
    if (popover) popover.classList.remove('visible');

    tourStarted = false;
    currentTourStep = 0;
    localStorage.setItem('foku-tour-closed', 'true');
}

function iniciarTutorialSiHaceFalta() {
    const yaSeCerro = localStorage.getItem('foku-tour-closed');
    if (yaSeCerro === 'true') return;

    iniciarTutorial();
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const widget = document.getElementById('pomodoro-widget');
    const nextBtn = document.getElementById('tour-next');
    const skipBtn = document.getElementById('tour-skip');

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