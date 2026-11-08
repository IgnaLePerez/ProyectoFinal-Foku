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

    const limites = obtenerLimitesWidget(widget);
    widget.style.left = `${Math.min(Math.max(widget.offsetLeft, limites.minLeft), limites.maxLeft)}px`;
    widget.style.top = `${Math.min(Math.max(widget.offsetTop, limites.minTop), limites.maxTop)}px`;
}

function obtenerLimitesWidget(widget) {
    const contenedor = widget.offsetParent;
    const ancho = contenedor ? contenedor.clientWidth : window.innerWidth;
    const alto = contenedor ? contenedor.clientHeight : window.innerHeight;

    return {
        minLeft: 10,
        maxLeft: Math.max(10, ancho - widget.offsetWidth - 10),
        minTop: 10,
        maxTop: Math.max(10, alto - widget.offsetHeight - 10)
    };
}

function hacerArrastrable(widget) {
    let pointerId = null;
    let posX = 0;
    let posY = 0;
    const header = widget.querySelector('.widget-header');

    if (header) {
        header.onpointerdown = iniciarArrastre;
        header.onpointermove = elementoArrastrado;
        header.onpointerup = cerrarArrastre;
        header.onpointercancel = cerrarArrastre;
        header.onlostpointercapture = cerrarArrastre;
    }

    function iniciarArrastre(e) {
        if (e.button !== 0 || e.target.closest('button, select, input')) return;

        pointerId = e.pointerId;
        posX = e.clientX;
        posY = e.clientY;
        e.preventDefault();
        header.setPointerCapture(pointerId);
    }

    function elementoArrastrado(e) {
        if (e.pointerId !== pointerId) return;

        e.preventDefault();
        const limites = obtenerLimitesWidget(widget);
        const nuevoLeft = widget.offsetLeft + e.clientX - posX;
        const nuevoTop = widget.offsetTop + e.clientY - posY;
        posX = e.clientX;
        posY = e.clientY;

        widget.style.left = `${Math.min(Math.max(nuevoLeft, limites.minLeft), limites.maxLeft)}px`;
        widget.style.top = `${Math.min(Math.max(nuevoTop, limites.minTop), limites.maxTop)}px`;
        asegurarDentroDePantalla(widget);
    }

    function cerrarArrastre(e) {
        if (e.pointerId !== pointerId) return;

        pointerId = null;
        if (header.hasPointerCapture(e.pointerId)) {
            header.releasePointerCapture(e.pointerId);
        }
        asegurarDentroDePantalla(widget);
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

function abrirTareas() {
    const widget = document.getElementById('tasks-widget');
    if (widget) {
        widget.classList.remove('hidden');
        asegurarDentroDePantalla(widget);
        if (!widget.dataset.ready) {
            widget.dataset.ready = 'true';
            cargarEtiquetasTareas();
            cargarTareas();
        }
    }
}

function cerrarTareas() {
    const widget = document.getElementById('tasks-widget');
    if (widget) widget.classList.add('hidden');
}

async function cargarEtiquetasTareas() {
    const select = document.getElementById('task-tag-filter');
    if (!select) return;

    try {
        const response = await fetch('/Home/GetEtiquetasTareas');
        if (!response.ok) throw new Error('No se pudieron cargar las etiquetas');
        const etiquetas = await response.json();
        select.innerHTML = '<option value="">Etiquetas</option>' + etiquetas.map(tag =>
            `<option value="${tag.id}">${tag.nombre}</option>`
        ).join('');
    } catch (error) {
        console.error(error);
        select.innerHTML = '<option value="">Etiquetas</option>';
    }
}

async function cargarTareas() {
    const container = document.getElementById('tasks-list-container');
    const searchInput = document.getElementById('task-search');
    const etiquetaSelect = document.getElementById('task-tag-filter');
    const estadoSelect = document.getElementById('task-status-filter');

    if (!container) return;

    const params = new URLSearchParams();
    params.set('buscar', searchInput ? searchInput.value.trim() : '');
    params.set('idEtiqueta', etiquetaSelect ? (etiquetaSelect.value || '') : '');
    params.set('terminada', estadoSelect ? (estadoSelect.value || '') : '');

    try {
        const response = await fetch(`/Home/GetTareas?${params.toString()}`);
        if (!response.ok) throw new Error('No se pudieron cargar las tareas');
        const tareas = await response.json();
        window._fokuTareasCache = tareas;
        renderizarTareas(tareas);
    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="task-empty">No se pudieron cargar las tareas.</div>';
    }
}

function getTareaPorId(idTarea) {
    const tareas = Array.isArray(window._fokuTareasCache) ? window._fokuTareasCache : [];
    return tareas.find(t => Number(t.id) === Number(idTarea));
}

function formatearFechaLimite(fecha) {
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha || '');
    return coincidencia ? `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}` : '';
}

async function eliminarTarea(idTarea) {
    if (!idTarea || Number.isNaN(idTarea)) return;

    try {
        const response = await fetch('/Home/DeleteTarea', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idTarea })
        });

        if (!response.ok) {
            throw new Error('No se pudo eliminar la tarea');
        }

        await cargarTareas();
    } catch (error) {
        console.error(error);
        alert('No se pudo eliminar la tarea.');
    }
}

function renderizarTareas(tareas) {
    const container = document.getElementById('tasks-list-container');
    if (!container) return;

    if (!Array.isArray(tareas) || tareas.length === 0) {
        container.innerHTML = '<div class="task-empty">No hay tareas.</div>';
        return;
    }

    const tareasPendientes = tareas.filter(t => !t.terminada);
    const tareasTerminadas = tareas.filter(t => t.terminada);
    const grupos = [tareasPendientes, tareasTerminadas];

    const html = grupos.map((grupo, grupoIndex) => {
        if (grupo.length === 0) return '';

        const titulo = grupoIndex === 0 ? '' : '<div class="task-divider">Terminadas</div>';
        return `
            ${titulo}
            <div class="task-list-group">
                ${grupo.map(tarea => `
                    <div class="task-item ${tarea.terminada ? 'completed' : ''}" data-id="${tarea.id}">
                        <input type="checkbox" ${tarea.terminada ? 'checked' : ''} data-toggle-task="${tarea.id}" aria-label="Marcar tarea como ${tarea.terminada ? 'no terminada' : 'terminada'}" />
                        <div class="task-main">
                            <div class="task-title-row">
                                <span class="task-name">${escapeHtml(tarea.nombre || 'Sin nombre')}</span>
                            </div>
                            <div class="task-description">${escapeHtml(tarea.descripcion || 'Sin descripción')}</div>
                            ${tarea.fechaLimite ? `<span class="task-deadline">Fecha límite: ${formatearFechaLimite(tarea.fechaLimite)}</span>` : ''}
                            <div class="task-tags">
                                ${(tarea.tags || []).map(tag => `
                                    <span class="task-tag" style="background:${tag.color || '#e8e5e0'};">
                                        ${escapeHtml(tag.nombre)}
                                        <button type="button" class="task-tag-remove" data-remove-tag="${tag.id}" data-task-id="${tarea.id}" aria-label="Quitar etiqueta ${escapeHtml(tag.nombre)}">×</button>
                                    </span>
                                `).join('') || '<span class="task-tag" style="background:#e8e5e0;">Sin etiquetas</span>'}
                                <button type="button" class="task-tag-add" data-open-tag-modal="${tarea.id}" aria-label="Agregar etiquetas a la tarea">Agregar etiquetas</button>
                            </div>
                        </div>
                        <div class="task-item-actions">
                            <button type="button" class="task-edit-btn" data-edit-task="${tarea.id}" aria-label="Editar tarea">Editar</button>
                            <button type="button" class="task-delete-btn" data-delete-task="${tarea.id}" aria-label="Eliminar tarea">Eliminar</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');

    container.innerHTML = html;

    document.querySelectorAll('[data-delete-task]').forEach(button => {
        button.addEventListener('click', async (event) => {
            event.stopPropagation();
            const idTarea = Number(button.dataset.deleteTask);

            if (button.dataset.confirming === 'true') {
                button.dataset.confirming = 'false';
                await eliminarTarea(idTarea);
                return;
            }

            button.dataset.confirming = 'true';
            button.textContent = 'Confirmar';
            button.classList.add('task-delete-confirming');

            window.setTimeout(() => {
                if (button.dataset.confirming === 'true') {
                    button.dataset.confirming = 'false';
                    button.textContent = 'Eliminar';
                    button.classList.remove('task-delete-confirming');
                }
            }, 2000);
        });
    });

    document.querySelectorAll('[data-edit-task]').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            abrirFormularioEdicionTarea(Number(button.dataset.editTask));
        });
    });

    document.querySelectorAll('[data-open-tag-modal]').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            abrirModalEtiquetas(Number(button.dataset.openTagModal));
        });
    });

    document.querySelectorAll('[data-remove-tag]').forEach(button => {
        button.addEventListener('click', async (event) => {
            event.stopPropagation();
            const idTarea = Number(button.dataset.taskId);
            const idEtiqueta = Number(button.dataset.removeTag);
            await quitarEtiquetaDeTarea(idTarea, idEtiqueta);
        });
    });

    document.querySelectorAll('[data-toggle-task]').forEach(checkbox => {
        checkbox.addEventListener('change', async (event) => {
            const id = Number(event.target.dataset.toggleTask);
            const checked = event.target.checked;
            await fetch('/Home/ToggleTarea', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, terminada: checked })
            });
            await cargarTareas();
        });
    });
}

function abrirFormularioEdicionTarea(idTarea) {
    const form = document.getElementById('task-add-form');
    const nameInput = document.getElementById('new-task-name');
    const descInput = document.getElementById('new-task-description');
    const tarea = getTareaPorId(idTarea);

    if (!form || !nameInput || !descInput) return;

    limpiarErrorNombreTarea();
    form.dataset.mode = 'edit';
    form.dataset.taskId = String(idTarea);
    nameInput.value = tarea?.nombre || '';
    descInput.value = tarea?.descripcion || '';
    form.classList.remove('hidden');
    document.getElementById('tasks-widget')?.classList.add('task-form-open');
    nameInput.focus();
}

function cerrarFormularioTarea() {
    const form = document.getElementById('task-add-form');
    if (!form) return;
    limpiarErrorNombreTarea();
    form.classList.add('hidden');
    document.getElementById('tasks-widget')?.classList.remove('task-form-open');
    form.dataset.mode = 'create';
    form.dataset.taskId = '';

    const nameInput = document.getElementById('new-task-name');
    const descInput = document.getElementById('new-task-description');
    const deadlineInput = document.getElementById('new-task-deadline');
    if (nameInput) nameInput.value = '';
    if (descInput) descInput.value = '';
    if (deadlineInput) deadlineInput.value = '';
}

async function guardarNuevaTarea() {
    const form = document.getElementById('task-add-form');
    const isEdit = form && form.dataset.mode === 'edit';
    const idTarea = form ? Number(form.dataset.taskId) : 0;
    const nombre = document.getElementById('new-task-name')?.value?.trim();
    const descripcion = document.getElementById('new-task-description')?.value?.trim();
    const fechaLimite = document.getElementById('new-task-deadline')?.value || null;

    if (!nombre) {
        mostrarErrorNombreTarea();
        return;
    }

    limpiarErrorNombreTarea();

    try {
        const endpoint = isEdit ? '/Home/UpdateTarea' : '/Home/AddTarea';
        const payload = isEdit
            ? { idTarea, nombre, descripcion }
            : { nombre, descripcion, fechaLimite };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(isEdit ? 'No se pudo actualizar la tarea' : 'No se pudo crear la tarea');
        }

        cerrarFormularioTarea();
        await cargarTareas();
    } catch (error) {
        console.error(error);
        alert(isEdit ? 'No se pudo actualizar la tarea.' : 'No se pudo guardar la tarea.');
    }
}

function mostrarErrorNombreTarea() {
    const nameInput = document.getElementById('new-task-name');
    const error = document.getElementById('new-task-name-error');
    if (!nameInput || !error) return;

    nameInput.style.borderColor = 'red';
    nameInput.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
    nameInput.setAttribute('aria-invalid', 'true');
    error.textContent = 'Título de la tarea - Este campo es obligatorio';
    error.classList.remove('hidden');
    nameInput.focus();
}

function limpiarErrorNombreTarea() {
    const nameInput = document.getElementById('new-task-name');
    const error = document.getElementById('new-task-name-error');
    if (!nameInput || !error) return;

    nameInput.style.borderColor = '';
    nameInput.style.boxShadow = '';
    nameInput.removeAttribute('aria-invalid');
    error.textContent = '';
    error.classList.add('hidden');
}

function abrirFormularioTarea() {
    const form = document.getElementById('task-add-form');
    if (!form) return;
    limpiarErrorNombreTarea();
    form.dataset.mode = 'create';
    form.dataset.taskId = '';
    form.classList.remove('hidden');
    document.getElementById('tasks-widget')?.classList.add('task-form-open');
    const nameInput = document.getElementById('new-task-name');
    if (nameInput) nameInput.focus();
}

function inicializarWidgetTareas() {
    const widget = document.getElementById('tasks-widget');
    if (!widget) return;

    const searchInput = document.getElementById('task-search');
    const tagFilter = document.getElementById('task-tag-filter');
    const statusFilter = document.getElementById('task-status-filter');
    const addButton = document.getElementById('task-add-button');
    const cancelButton = document.querySelector('.task-form-cancel');
    const saveButton = document.querySelector('.task-form-save');
    const nameInput = document.getElementById('new-task-name');

    if (searchInput) {
        searchInput.addEventListener('input', () => cargarTareas());
    }

    if (tagFilter) {
        tagFilter.addEventListener('change', () => cargarTareas());
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', () => cargarTareas());
    }

    if (addButton) {
        addButton.addEventListener('click', abrirFormularioTarea);
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', cerrarFormularioTarea);
    }

    if (saveButton) {
        saveButton.addEventListener('click', guardarNuevaTarea);
    }

    if (nameInput) {
        nameInput.addEventListener('input', () => {
            if (nameInput.value.trim()) limpiarErrorNombreTarea();
        });
    }

    inicializarModalEtiquetas();
    hacerArrastrable(widget);
}

window.addEventListener('DOMContentLoaded', () => {
    inicializarWidgetTareas();
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

async function quitarEtiquetaDeTarea(idTarea, idEtiqueta) {
    try {
        const response = await fetch('/Home/RemoveEtiquetaTarea', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idTarea, idEtiqueta })
        });

        if (!response.ok) {
            throw new Error('No se pudo quitar la etiqueta');
        }

        await cargarTareas();
    } catch (error) {
        console.error(error);
    }
}

async function agregarEtiquetaATarea(idTarea, idEtiqueta) {
    try {
        const response = await fetch('/Home/AddEtiquetaTarea', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idTarea, idEtiqueta })
        });

        if (!response.ok) {
            throw new Error('No se pudo asociar la etiqueta');
        }

        await cargarTareas();
    } catch (error) {
        console.error(error);
    }
}

async function crearEtiquetaDesdeModal() {
    const inputNombre = document.getElementById('task-tag-new-name');
    const inputColor = document.getElementById('task-tag-new-color');
    const modal = document.getElementById('task-tag-modal');
    const taskId = modal ? Number(modal.dataset.taskId) : 0;

    if (!inputNombre || !inputColor || !taskId) return;

    const nombre = inputNombre.value.trim();
    const color = inputColor.value;
    if (!nombre) {
        inputNombre.focus();
        return;
    }

    try {
        const response = await fetch('/Home/CrearEtiqueta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, color })
        });

        if (!response.ok) {
            throw new Error('No se pudo crear la etiqueta');
        }

        const nuevaEtiqueta = await response.json();
        inputNombre.value = '';
        inputColor.value = '#7c5cff';

        await cargarOpcionesEtiquetasParaTarea(taskId);
    } catch (error) {
        console.error(error);
        alert('No se pudo crear la etiqueta.');
    }
}

function abrirEditorEtiqueta(idEtiqueta, nombre, color) {
    const panel = document.getElementById('task-tag-edit-panel');
    const inputNombre = document.getElementById('task-tag-edit-name');
    const inputColor = document.getElementById('task-tag-edit-color');
    if (!panel || !inputNombre || !inputColor) return;

    panel.dataset.idEtiqueta = String(idEtiqueta);
    inputNombre.value = nombre || '';
    inputColor.value = color || '#7c5cff';
    panel.classList.remove('hidden');
    inputNombre.focus();
}

function cerrarEditorEtiqueta() {
    const panel = document.getElementById('task-tag-edit-panel');
    const inputNombre = document.getElementById('task-tag-edit-name');
    const inputColor = document.getElementById('task-tag-edit-color');
    if (!panel) return;

    panel.classList.add('hidden');
    panel.dataset.idEtiqueta = '';
    if (inputNombre) inputNombre.value = '';
    if (inputColor) inputColor.value = '#7c5cff';
}

async function guardarEtiquetaEditada() {
    const panel = document.getElementById('task-tag-edit-panel');
    const inputNombre = document.getElementById('task-tag-edit-name');
    const inputColor = document.getElementById('task-tag-edit-color');
    const modal = document.getElementById('task-tag-modal');
    const idEtiqueta = panel ? Number(panel.dataset.idEtiqueta) : 0;

    if (!panel || !inputNombre || !inputColor || !idEtiqueta) return;

    const nombre = inputNombre.value.trim();
    const color = inputColor.value;
    if (!nombre) {
        inputNombre.focus();
        return;
    }

    try {
        const response = await fetch('/Home/UpdateEtiqueta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: idEtiqueta, nombre, color })
        });

        if (!response.ok) {
            throw new Error('No se pudo actualizar la etiqueta');
        }

        cerrarEditorEtiqueta();
        const taskId = modal ? Number(modal.dataset.taskId) : 0;
        if (taskId) {
            await cargarOpcionesEtiquetasParaTarea(taskId);
        }
        await cargarTareas();
    } catch (error) {
        console.error(error);
        alert('No se pudo actualizar la etiqueta.');
    }
}

function abrirModalEtiquetas(idTarea) {
    const modal = document.getElementById('task-tag-modal');
    const options = document.getElementById('task-tag-modal-options-list');
    if (!modal || !options) return;

    modal.dataset.taskId = String(idTarea);
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    cerrarEditorEtiqueta();

    cargarOpcionesEtiquetasParaTarea(idTarea);
}

function cerrarModalEtiquetas() {
    const modal = document.getElementById('task-tag-modal');
    if (!modal) return;

    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    modal.dataset.taskId = '';
    cerrarEditorEtiqueta();
}

async function cargarOpcionesEtiquetasParaTarea(idTarea) {
    const options = document.getElementById('task-tag-modal-options-list');
    if (!options) return;

    try {
        const response = await fetch('/Home/GetEtiquetasTareas');
        if (!response.ok) throw new Error('No se pudieron cargar las etiquetas');

        const etiquetas = await response.json();
        const tareaResponse = await fetch(`/Home/GetTareas`);
        if (!tareaResponse.ok) throw new Error('No se pudo obtener la tarea');

        const tareas = await tareaResponse.json();
        const tareaActual = tareas.find(t => Number(t.id) === Number(idTarea));
        const asignadas = new Set((tareaActual?.tags || []).map(tag => Number(tag.id)));

        options.innerHTML = etiquetas.map(tag => `
            <button type="button" class="task-tag-option ${asignadas.has(Number(tag.id)) ? 'selected' : ''}" data-tag-option-id="${tag.id}" data-tag-option-name="${escapeHtml(tag.nombre)}" data-tag-option-color="${tag.color || '#e8e5e0'}" data-tag-id="${tag.id}">
                <span class="task-tag-option-dot" style="background:${tag.color || '#e8e5e0'}; display:inline-block; width:12px; height:12px; border-radius:50%;"></span>
                <span>${escapeHtml(tag.nombre)}</span>
                <button type="button" class="task-tag-option-remove" data-delete-tag="${tag.id}" aria-label="Eliminar etiqueta ${escapeHtml(tag.nombre)}">Eliminar</button>
                <button type="button" class="task-tag-option-edit" data-edit-tag="${tag.id}" data-edit-tag-name="${escapeHtml(tag.nombre)}" data-edit-tag-color="${tag.color || '#7c5cff'}" aria-label="Editar etiqueta ${escapeHtml(tag.nombre)}">Editar</button>
            </button>
        `).join('');

        options.querySelectorAll('[data-tag-option-id]').forEach(button => {
            const tagId = Number(button.dataset.tagOptionId);
            const isSelected = asignadas.has(tagId);

            button.classList.toggle('selected', isSelected);
            if (isSelected) {
                button.style.outline = '2px solid rgba(89,183,107,0.5)';
                button.style.background = 'rgba(89,183,107,0.09)';
            } else {
                button.style.outline = '';
                button.style.background = '';
            }

            button.addEventListener('click', async (event) => {
                const editButton = event.target.closest('.task-tag-option-edit');
                if (editButton) {
                    event.stopPropagation();
                    const tag = etiquetas.find(item => Number(item.id) === Number(editButton.dataset.editTag));
                    abrirEditorEtiqueta(Number(editButton.dataset.editTag), tag?.nombre || '', tag?.color || '#7c5cff');
                    return;
                }

                if (event.target.closest('.task-tag-option-remove')) {
                    event.stopPropagation();
                    const removeButton = event.target.closest('.task-tag-option-remove');
                    const tagButton = removeButton?.closest('[data-tag-option-id]');

                    if (tagButton && tagButton.dataset.confirming === 'true') {
                        tagButton.dataset.confirming = 'false';
                        await eliminarEtiqueta(tagId);
                        return;
                    }

                    if (tagButton) {
                        tagButton.dataset.confirming = 'true';
                        removeButton.textContent = 'Confirmar';
                        tagButton.classList.add('task-delete-confirming');

                        window.setTimeout(() => {
                            if (tagButton.dataset.confirming === 'true') {
                                tagButton.dataset.confirming = 'false';
                                removeButton.textContent = 'Eliminar';
                                tagButton.classList.remove('task-delete-confirming');
                            }
                        }, 2000);
                    }
                    return;
                }

                if (asignadas.has(tagId)) {
                    await quitarEtiquetaDeTarea(idTarea, tagId);
                    asignadas.delete(tagId);
                } else {
                    await agregarEtiquetaATarea(idTarea, tagId);
                    asignadas.add(tagId);
                }

                await cargarOpcionesEtiquetasParaTarea(idTarea);
            });
        });
    } catch (error) {
        console.error(error);
        options.innerHTML = '<span class="task-empty">No se pudieron cargar las etiquetas.</span>';
    }
}

async function eliminarEtiqueta(idEtiqueta) {
    if (!idEtiqueta || Number.isNaN(idEtiqueta)) return;

    try {
        const response = await fetch('/Home/DeleteEtiqueta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idEtiqueta })
        });

        if (!response.ok) {
            throw new Error('No se pudo eliminar la etiqueta');
        }

        const modal = document.getElementById('task-tag-modal');
        if (modal && !modal.classList.contains('hidden')) {
            const taskId = Number(modal.dataset.taskId);
            await cargarOpcionesEtiquetasParaTarea(taskId);
        }
        await cargarTareas();
    } catch (error) {
        console.error(error);
        alert('No se pudo eliminar la etiqueta.');
    }
}

function inicializarModalEtiquetas() {
    document.addEventListener('click', (event) => {
        const modal = document.getElementById('task-tag-modal');
        if (!modal || modal.classList.contains('hidden')) return;

        const backdrop = event.target.closest('[data-close-tag-modal="true"]');
        const closeButton = event.target.closest('.task-tag-modal-close');
        const modalDialog = event.target.closest('.task-tag-modal-dialog');
        const tagCreatorButton = event.target.closest('#task-tag-create-button');
        const editSaveButton = event.target.closest('#task-tag-edit-save');
        const editCancelButton = event.target.closest('#task-tag-edit-cancel');

        if (tagCreatorButton) {
            crearEtiquetaDesdeModal();
            return;
        }

        if (editSaveButton) {
            guardarEtiquetaEditada();
            return;
        }

        if (editCancelButton) {
            cerrarEditorEtiqueta();
            return;
        }

        if (backdrop || closeButton || (!modalDialog && !event.target.closest('[data-open-tag-modal]'))) {
            cerrarModalEtiquetas();
        }
    });
}