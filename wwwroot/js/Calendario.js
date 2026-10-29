(function () {
    function setupCalendar() {
        const widget = document.getElementById('calendar-widget');
        if (!widget) return;

        const monthSelect = document.getElementById('mesCalendario');
        const yearSelect = document.getElementById('anioCalendario');
        const calendarContainer = document.getElementById('calendar-container');

        if (!monthSelect || !yearSelect || !calendarContainer) return;

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();

        // Llenar selector de años
        for (let year = currentYear - 5; year <= currentYear + 10; year++) {
            const option = document.createElement('option');
            option.value = String(year);
            option.textContent = String(year);
            if (year === currentYear) option.selected = true;
            yearSelect.appendChild(option);
        }

        monthSelect.value = String(currentDate.getMonth());

        // Obtener tareas desde el ViewBag (suponiendo que están en formato JSON en un atributo data-)
        const tareasDesdeVista = (() => {
            try {
                const raw = widget.dataset.tareas || '[]';
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                return [];
            }
        })();

        // Función para renderizar la lista vertical de todos los días del mes
        function renderizarCalendarioVertical() {
            const mes = parseInt(monthSelect.value, 10);
            const anio = parseInt(yearSelect.value, 10);

            // Obtener el total de días del mes seleccionado
            const diasEnMes = new Date(anio, mes + 1, 0).getDate();
            
            const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

            let html = '<div class="calendario-vertical-list">';

            for (let dia = 1; dia <= diasEnMes; dia++) {
                const fechaObj = new Date(anio, mes, dia);
                const nombreDia = diasSemana[fechaObj.getDay()];
                
                // Formato de fecha ISO: YYYY-MM-DD
                const mesStr = String(mes + 1).padStart(2, '0');
                const diaStr = String(dia).padStart(2, '0');
                const fechaClave = `${anio}-${mesStr}-${diaStr}`;

                // Filtrar tareas del día correspondiente
                const tareasDelDia = tareasDesdeVista.filter((tarea) => tarea.start === fechaClave);

                html += `
                    <div class="fila-dia" data-fecha="${fechaClave}">
                        <div class="col-fecha">
                            <span class="num-dia">${diaStr}</span>
                            <span class="nom-dia">${nombreDia}</span>
                        </div>
                        <div class="col-tareas">
                            ${tareasDelDia.length ? tareasDelDia.map((tarea) => `
                                <div class="badge-tarea" data-id="${tarea.id}" style="background:${tarea.backgroundColor}; border-color:${tarea.borderColor};">
                                    ${tarea.title}
                                </div>
                            `).join('') : '<span class="sin-tareas">Sin tareas</span>'}
                        </div>
                    </div>
                `;
            }

            html += '</div>';
            calendarContainer.innerHTML = html;
        }

        // Eventos de selección de mes y año
        monthSelect.addEventListener('change', renderizarCalendarioVertical);
        yearSelect.addEventListener('change', renderizarCalendarioVertical);

        // Inicializar renderizado
        renderizarCalendarioVertical();
        hacerArrastrableCalendario(widget);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupCalendar);
    } else {
        setupCalendar();
    }
})();

function abrirCalendario() {
    const widget = document.getElementById('calendar-widget');
    if (!widget) return;
    widget.classList.remove('hidden');
    widget.style.left = '40px';
    widget.style.top = '40px';
    asegurarDentroDePantalla(widget);
}

function cerrarCalendario() {
    const widget = document.getElementById('calendar-widget');
    if (widget) widget.classList.add('hidden');
}

function asegurarDentroDePantalla(widget) {
    if (!widget || widget.classList.contains('hidden')) return;
    const rect = widget.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left = widget.offsetLeft;
    let top = widget.offsetTop;

    if (rect.right > windowWidth) left = windowWidth - rect.width - 10;
    if (rect.left < 0) left = 10;
    if (rect.bottom > windowHeight) top = windowHeight - rect.height - 10;
    if (rect.top < 0) top = 10;

    widget.style.left = `${Math.max(10, left)}px`;
    widget.style.top = `${Math.max(10, top)}px`;
}

function hacerArrastrableCalendario(widget) {
    if (!widget) return;

    let pos3 = 0;
    let pos4 = 0;
    const header = widget.querySelector('.widget-header');

    if (!header) return;

    header.onmousedown = function (event) {
        if (event.target.closest('button')) return;
        event.preventDefault();
        pos3 = event.clientX;
        pos4 = event.clientY;
        document.onmousemove = arrastrarCalendario;
        document.onmouseup = detenerArrastreCalendario;
    };

    function arrastrarCalendario(event) {
        event.preventDefault();
        const pos1 = pos3 - event.clientX;
        const pos2 = pos4 - event.clientY;
        pos3 = event.clientX;
        pos4 = event.clientY;

        const nuevoTop = widget.offsetTop - pos2;
        const nuevoLeft = widget.offsetLeft - pos1;
        const maxLeft = window.innerWidth - widget.offsetWidth;
        const maxTop = window.innerHeight - widget.offsetHeight;

        widget.style.top = `${Math.max(0, Math.min(nuevoTop, maxTop))}px`;
        widget.style.left = `${Math.max(0, Math.min(nuevoLeft, maxLeft))}px`;
    }

    function detenerArrastreCalendario() {
        document.onmousemove = null;
        document.onmouseup = null;
    }
}