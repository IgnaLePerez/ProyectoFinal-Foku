let calendarEventosRaw = [];

function formatISODateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function setCalendarEventos() {
    calendarEventosRaw = Array.isArray(window.calendarEventosRaw) ? window.calendarEventosRaw : [];
}

let calendarState = {
    month: new Date().getMonth(),
    year: new Date().getFullYear()
};

function abrirCalendario() {
    const widget = document.getElementById('calendar-popup');
    if (!widget) return;

    widget.classList.remove('hidden');
    widget.style.display = 'flex';
    widget.style.position = 'fixed';
    widget.style.transform = 'none';
    widget.style.zIndex = '1001';

    const width = widget.offsetWidth || 600;
    const height = widget.offsetHeight || 620;
    widget.style.left = `${Math.max(10, (window.innerWidth - width) / 2)}px`;
    widget.style.top = `${Math.max(10, (window.innerHeight - height) / 2)}px`;
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';

    asegurarDentroDePantallaCalendario(widget);
    renderCalendar();
}

function cerrarCalendario() {
    const widget = document.getElementById('calendar-popup');
    if (widget) {
        widget.classList.add('hidden');
        widget.style.display = 'none';
    }
}

function getCalendarMonthName(monthIndex) {
    return new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(2024, monthIndex, 1));
}

function populateCalendarSelectors() {
    const monthSelect = document.getElementById('calendar-month');
    const yearInput = document.getElementById('calendar-year');
    if (!monthSelect || !yearInput) return;

    monthSelect.innerHTML = Array.from({ length: 12 }, (_, index) =>
        `<option value="${index}">${getCalendarMonthName(index)}</option>`
    ).join('');

    yearInput.min = '2006';
    yearInput.value = String(calendarState.year);
    yearInput.onchange = (event) => {
        const nuevoAnio = Number(event.target.value);
        if (!Number.isFinite(nuevoAnio) || nuevoAnio < 2006) {
            yearInput.value = String(calendarState.year);
            return;
        }
        calendarState.year = nuevoAnio;
        renderCalendar();
    };

    monthSelect.value = String(calendarState.month);

    monthSelect.onchange = (event) => {
        calendarState.month = Number(event.target.value);
        renderCalendar();
    };
}

function normalizeEventDate(dateValue) {
    if (!dateValue) return null;

    if (typeof dateValue === 'string') {
        const iso = dateValue.trim();
        if (!iso) return null;

        if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
            return new Date(`${iso}T00:00:00`);
        }

        const parsed = new Date(iso);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (dateValue instanceof Date) {
        return Number.isNaN(dateValue.getTime()) ? null : dateValue;
    }

    return null;
}

function getEventDateKeys(event) {
    const start = normalizeEventDate(event.start);
    const end = normalizeEventDate(event.end);
    const fallback = start || end;

    if (!fallback) return [];

    const dates = [];
    const firstDate = new Date(start || fallback);
    const lastDate = end ? new Date(end) : new Date(start || fallback);

    if (start && end && start.getTime() !== end.getTime()) {
        const cursor = new Date(firstDate);
        while (cursor <= lastDate) {
            dates.push(formatISODateLocal(cursor));
            cursor.setDate(cursor.getDate() + 1);
        }
    } else {
        dates.push(formatISODateLocal(new Date(firstDate)));
    }

    return dates;
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    const firstDayOfMonth = new Date(calendarState.year, calendarState.month, 1);
    const startDay = new Date(firstDayOfMonth);
    startDay.setDate(startDay.getDate() - firstDayOfMonth.getDay());

    const eventMap = new Map();
    calendarEventosRaw.forEach((event) => {
        const keys = getEventDateKeys(event);
        keys.forEach((key) => {
            eventMap.set(key, (eventMap.get(key) || []).concat(event));
        });
    });

    const cells = [];
    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDay);
        currentDate.setDate(startDay.getDate() + i);
        const key = formatISODateLocal(currentDate);
        const inCurrentMonth = currentDate.getMonth() === calendarState.month;
        const isToday = currentDate.toDateString() === new Date().toDateString();
        const events = eventMap.get(key) || [];

        const dayEvents = events.slice(0, 2).map((event) => {
            const title = (event.title || 'Evento').slice(0, 16);
            return `<div class="calendar-event" title="${escapeHtml(event.title || 'Evento')}">${escapeHtml(title)}</div>`;
        }).join('');

        const extraCount = events.length > 2 ? `<span class="calendar-more">+${events.length - 2}</span>` : '';

        cells.push(`
            <div class="calendar-day ${inCurrentMonth ? '' : 'calendar-day-other'} ${isToday ? 'calendar-day-today' : ''}">
                <span class="calendar-number">${currentDate.getDate()}</span>
                <div class="calendar-events">${dayEvents}${extraCount}</div>
            </div>
        `);
    }

    grid.innerHTML = cells.join('');
    document.getElementById('calendar-month')?.setAttribute('value', String(calendarState.month));
    document.getElementById('calendar-year')?.setAttribute('value', String(calendarState.year));
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
    setCalendarEventos();
    populateCalendarSelectors();
    renderCalendar();

    const calendarWidget = document.getElementById('calendar-popup');
    if (calendarWidget && typeof hacerArrastrableCalendario === 'function') {
        hacerArrastrableCalendario(calendarWidget);
    }
});

function asegurarDentroDePantallaCalendario(widget) {
    if (!widget || widget.classList.contains('hidden')) return;

    const rect = widget.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const sidebar = document.querySelector('main aside');
    const header = document.querySelector('header');

    const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
    const headerRect = header ? header.getBoundingClientRect() : null;

    const minLeft = sidebarRect ? Math.max(10, sidebarRect.right + 10) : 10;
    const maxLeft = Math.max(minLeft, windowWidth - rect.width - 10);
    const minTop = headerRect ? Math.max(10, headerRect.bottom + 10) : 10;
    const maxTop = Math.max(minTop, windowHeight - rect.height - 10);

    let newLeft = widget.offsetLeft;
    let newTop = widget.offsetTop;

    if (rect.right > windowWidth) newLeft = maxLeft;
    if (rect.left < minLeft) newLeft = minLeft;
    if (rect.bottom > windowHeight) newTop = maxTop;
    if (rect.top < minTop) newTop = minTop;

    widget.style.left = `${Math.min(Math.max(newLeft, minLeft), maxLeft)}px`;
    widget.style.top = `${Math.min(Math.max(newTop, minTop), maxTop)}px`;
}

function hacerArrastrableCalendario(widget) {
    let dragging = false;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = widget.querySelector('.widget-header');

    if (header) {
        header.onmousedown = arrastrarMouseDown;
    }

    function arrastrarMouseDown(e) {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;

        dragging = true;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmousemove = elementoArrastrado;
        document.onmouseup = cerrarArrastre;
    }

    function elementoArrastrado(e) {
        if (!dragging) return;

        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        const currentLeft = widget.offsetLeft;
        const currentTop = widget.offsetTop;
        const sidebar = document.querySelector('main aside');
        const header = document.querySelector('header');

        const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
        const headerRect = header ? header.getBoundingClientRect() : null;

        const minLeft = sidebarRect ? Math.max(10, sidebarRect.right + 10) : 10;
        const maxLeft = Math.max(minLeft, window.innerWidth - widget.offsetWidth - 10);
        const minTop = headerRect ? Math.max(10, headerRect.bottom + 10) : 10;
        const maxTop = Math.max(minTop, window.innerHeight - widget.offsetHeight - 10);

        const nuevoTop = Math.min(Math.max(currentTop - pos2, minTop), maxTop);
        const nuevoLeft = Math.min(Math.max(currentLeft - pos1, minLeft), maxLeft);

        widget.style.left = `${nuevoLeft}px`;
        widget.style.top = `${nuevoTop}px`;

        asegurarDentroDePantallaCalendario(widget);
    }

    function cerrarArrastre() {
        dragging = false;
        document.onmousemove = null;
        document.onmouseup = null;
        asegurarDentroDePantallaCalendario(widget);
    }
}