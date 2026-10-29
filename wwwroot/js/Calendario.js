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

        for (let year = currentYear - 5; year <= currentYear + 10; year++) {
            const option = document.createElement('option');
            option.value = String(year);
            option.textContent = String(year);
            if (year === currentYear) option.selected = true;
            yearSelect.appendChild(option);
        }

        monthSelect.value = String(currentDate.getMonth());

        if (window.FullCalendar) {
            const calendar = new FullCalendar.Calendar(calendarContainer, {
                initialView: 'dayGridMonth',
                locale: 'es',
                headerToolbar: {
                    left: 'prev,next',
                    center: 'title',
                    right: 'today'
                },
                buttonText: {
                    today: 'Hoy'
                },
                fixedWeekCount: false,
                height: 'auto',
                dayMaxEvents: true,
                events: [],
                dateClick: function (info) {
                    const clickedDate = new Date(info.date);
                    const selectedDate = clickedDate.toISOString().slice(0, 10);
                    const existing = calendar.getEventById(selectedDate);

                    if (existing) {
                        existing.remove();
                        return;
                    }

                    calendar.addEvent({
                        id: selectedDate,
                        title: 'Evento',
                        start: selectedDate,
                        allDay: true,
                        backgroundColor: '#FF9509',
                        borderColor: '#FF9509'
                    });
                }
            });

            calendar.render();
            actualizarCalendarioMes(calendar, monthSelect, yearSelect);
            monthSelect.addEventListener('change', () => actualizarCalendarioMes(calendar, monthSelect, yearSelect));
            yearSelect.addEventListener('change', () => actualizarCalendarioMes(calendar, monthSelect, yearSelect));
            hacerArrastrableCalendario(widget);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupCalendar);
    } else {
        setupCalendar();
    }
})();

function actualizarCalendarioMes(calendar, monthSelect, yearSelect) {
    if (!calendar || !monthSelect || !yearSelect) return;

    const mesSeleccionado = parseInt(monthSelect.value, 10);
    const anioSeleccionado = parseInt(yearSelect.value, 10);
    const fecha = new Date(anioSeleccionado, mesSeleccionado, 1);
    calendar.gotoDate(fecha);
}

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
