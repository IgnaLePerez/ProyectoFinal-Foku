let documentosCache = [];

function abrirModalDocumentos() {
  const modal = document.getElementById('documentos-modal');
  const visor = document.getElementById('pdf-viewer');
  visor?.classList.add('hidden');
  modal?.classList.remove('hidden');
  modal?.setAttribute('aria-hidden', 'false');
  cargarDocumentos();
}

function cerrarModalDocumentos() {
  const modal = document.getElementById('documentos-modal');
  modal?.classList.add('hidden');
  modal?.setAttribute('aria-hidden', 'true');
}

async function cargarDocumentos() {
  const container = document.getElementById('documentos-lista');
  const searchInput = document.getElementById('documentos-search');
  if (!container) return;
  try {
    const termino = searchInput ? encodeURIComponent(searchInput.value.trim()) : '';
    const response = await fetch(`/Home/GetDocumentos?buscar=${termino}`, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error('No se pudieron cargar los documentos');
    documentosCache = await response.json();
    renderDocumentos();
  } catch (error) {
    document.getElementById('documentos-lista').innerHTML = '<p class="documentos-vacio">No se pudieron cargar los documentos.</p>';
  }
}

function renderDocumentos() {
  const lista = document.getElementById('documentos-lista');
  if (!lista) return;
  const searchInput = document.getElementById('documentos-search');
  // termino es if abreviado para ver si existe el input en pantalla
  const termino = searchInput ? searchInput.value.trim().toLowerCase() : ''; //trim saca espacios inicio y final
  // arma array nuevo de docs q filtramos
  const filtrados = documentosCache.filter(doc => 
    doc.nombre.toLowerCase().includes(termino)
  );
  //para los destacados, pone los destacados arriba
  const ordenados = filtrados.sort((a, b) => 
    Number(b.destacado) - Number(a.destacado) || a.nombre.localeCompare(b.nombre)
  );
  // ve si dsp de filtrar esta vacio y ve por que para mostrar msj
  if (ordenados.length === 0) {
    lista.innerHTML = termino 
      ? '<p class="documentos-vacio">No se encontraron documentos con ese nombre.</p>'
      : '<p class="documentos-vacio">Aún no tienes documentos PDF.</p>';
    return;
  }

  lista.innerHTML = ordenados.map(documento => `
    <article class="documentos-item${documento.destacado ? ' destacado' : ''}" data-id="${documento.id}">
      <button type="button" class="documentos-nombre" title="Abrir ${escapeHtml(documento.nombre)}" onclick="abrirDocumento(${documento.id})">${escapeHtml(documento.nombre)}</button>
      <div class="documentos-actions">
        <button type="button" title="Destacar" onclick="toggleDestacadoDocumento(${documento.id})">${documento.destacado ? '★' : '☆'}</button>
        <button type="button" title="Renombrar" onclick="renombrarDocumento(${documento.id})">✎</button>
        <button type="button" title="Eliminar" onclick="eliminarDocumento(${documento.id})">×</button>
      </div>
    </article>`).join('');
}

async function toggleDestacadoDocumento(id) {
  try {
    const response = await fetch('/Home/ToggleDocumento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (!response.ok) throw new Error();
    const actualizado = await response.json();
    documentosCache = documentosCache.map(d => d.id === id ? actualizado : d);
    renderDocumentos();
  } catch (_) {
    alert('No se pudo cambiar el destacado.');
  }
}

function renombrarDocumento(id) {
  const actual = documentosCache.find(d => d.id === id);
  if (!actual) return;

  const item = document.querySelector(`.documentos-item[data-id="${id}"]`);
  const nombreActual = item?.querySelector('.documentos-nombre');
  if (!item || !nombreActual) return;

  nombreActual.outerHTML = `
    <div class="documentos-rename">
      <input type="text" class="documentos-rename-input" maxlength="255" value="${escapeHtml(actual.nombre)}" aria-label="Nuevo nombre del documento" />
      <p class="documentos-rename-error" role="alert"></p>
    </div>`;

  const input = item.querySelector('.documentos-rename-input');
  input.focus();
  input.select();

  const acciones = item.querySelector('.documentos-actions');
  acciones.innerHTML = `
    <button type="button" title="Guardar nombre" onclick="guardarRenombreDocumento(${id})">✓</button>
    <button type="button" title="Cancelar" onclick="renderDocumentos()">×</button>`;

  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') guardarRenombreDocumento(id);
    if (event.key === 'Escape') renderDocumentos();
  });
}

async function guardarRenombreDocumento(id) {
  const item = document.querySelector(`.documentos-item[data-id="${id}"]`);
  const input = item?.querySelector('.documentos-rename-input');
  const error = item?.querySelector('.documentos-rename-error');
  if (!input) return;

  const nuevoNombre = input.value.trim();
  if (!nuevoNombre) {
    if (error) error.textContent = 'El nombre no puede estar vacío.';
    input.focus();
    return;
  }

  try {
    const response = await fetch('/Home/RenombrarDocumento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, nombre: nuevoNombre })
    });
    if (!response.ok) throw new Error();

    const actualizado = await response.json();
    documentosCache = documentosCache.map(d => d.id === id ? actualizado : d);
    renderDocumentos();
  } catch (_) {
    if (error) error.textContent = 'No se pudo guardar el nombre.';
  }
}

async function eliminarDocumento(id) {
  const item = document.querySelector(`.documentos-item[data-id="${id}"]`);
  if (!item) return;

  item.innerHTML = `
    <div class="documentos-delete-confirm">
      <span>¿Seguro que querés eliminar este documento?</span>
      <div class="documentos-delete-actions">
        <button type="button" class="documentos-delete-accept" onclick="confirmarEliminarDocumento(${id})">Eliminar</button>
        <button type="button" class="documentos-delete-cancel" onclick="renderDocumentos()">Cancelar</button>
      </div>
    </div>`;
}

async function confirmarEliminarDocumento(id) {
  const item = document.querySelector(`.documentos-item[data-id="${id}"]`);
  if (!item) return;

  try {
    const response = await fetch('/Home/EliminarDocumento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (!response.ok) throw new Error();
    documentosCache = documentosCache.filter(d => d.id !== id);
    renderDocumentos();
  } catch (_) {
    item.innerHTML = '<p class="documentos-delete-error">No se pudo eliminar el documento.</p>';
  }
}

// Configurar worker de PDF.js
if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

let documentoActualId = null;
let marcadoresCache = [];
let resaltadosCache = [];
let seleccionPendiente = null;

// Configurar worker de PDF.js
if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('documentos-search')?.addEventListener('input', () => cargarDocumentos());

  document.getElementById('documentos-add-button')?.addEventListener('click', () => {
    document.getElementById('documentos-file-input')?.click();
  });

  document.getElementById('documentos-file-input')?.addEventListener('change', async event => {
    const archivo = event.target.files[0];
    if (!archivo) return;
    if (!archivo.name.toLowerCase().endsWith('.pdf')) {
      alert('Solo se permiten archivos .pdf');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('archivo', archivo);
    try {
      const response = await fetch('/Home/UploadDocumento', { method: 'POST', body: formData });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'No se pudo subir el PDF');
      }
      await cargarDocumentos();
    } catch (error) {
      alert(error.message);
    } finally {
      event.target.value = '';
    }
  });

  document.querySelector('[data-cerrar-documentos="true"]')?.removeAttribute('data-cerrar-documentos');
});


// ================= GESTIÓN DE ETIQUETAS (MARCADORES) =================

async function cargarMarcadoresPdf() {
    const res = await fetch('/Home/GetMarcadores');
    if (res.ok) {
        marcadoresCache = await res.json();
        renderListaMarcadoresPdf();
    }
}

function renderListaMarcadoresPdf() {
    const lista = document.getElementById('lista-marcadores-pdf');
    if (!lista) return;

    lista.innerHTML = marcadoresCache.map(m => `
        <div style="display:flex; align-items:center; justify-content:space-between; background:#2b2b3d; padding:6px 8px; border-radius:4px;">
            <div style="display:flex; align-items:center; gap:6px; overflow:hidden;">
                <span style="width:14px; height:14px; border-radius:50%; background:${m.color}; flex-shrink:0;"></span>
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(m.nombre)}</span>
            </div>
            <div style="display:flex; gap:4px;">
                <button type="button" title="Editar" onclick="editarMarcadorPdf(${m.id})" style="cursor:pointer;">✎</button>
                <button type="button" title="Borrar" onclick="borrarMarcadorPdf(${m.id})" style="cursor:pointer; color:#ff6b6b;">×</button>
            </div>
        </div>
    `).join('');
}

async function crearMarcadorPdf() {
    const inputNombre = document.getElementById('nuevo-marcador-nombre');
    const inputColor = document.getElementById('nuevo-marcador-color');
    const nombre = inputNombre.value.trim();
    const color = inputColor.value;
    if (!nombre) return;

    const res = await fetch('/Home/CrearMarcador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, color })
    });

    if (res.ok) {
        inputNombre.value = '';
        await cargarMarcadoresPdf();
    }
}

async function editarMarcadorPdf(id) {
    const actual = marcadoresCache.find(m => m.id === id);
    if (!actual) return;

    const nuevoNombre = prompt('Nuevo nombre de la etiqueta:', actual.nombre);
    if (!nuevoNombre || !nuevoNombre.trim()) return;

    const nuevoColor = prompt('Nuevo color hexadecimal (ej: #ff5733 o #76c893):', actual.color) || actual.color;

    const res = await fetch('/Home/UpdateMarcador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, nombre: nuevoNombre.trim(), color: nuevoColor.trim() })
    });

    if (res.ok) {
        await cargarMarcadoresPdf();
        await cargarResaltadosPdf(documentoActualId); // Actualiza el color de los resaltados existentes
        dibujarTodosLosResaltados();
    }
}

async function borrarMarcadorPdf(id) {
    if (!confirm('¿Borrar esta etiqueta? Se eliminarán también todos los textos resaltados con ella.')) return;

    const res = await fetch('/Home/DeleteMarcador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });

    if (res.ok) {
        await cargarMarcadoresPdf();
        await cargarResaltadosPdf(documentoActualId);
        dibujarTodosLosResaltados();
    }
}

// ================= CREAR, DIBUJAR Y QUITAR RESALTADOS =================

async function cargarResaltadosPdf(idDocumento) {
    const res = await fetch(`/Home/GetResaltados?idDocumento=${idDocumento}`);
    if (res.ok) {
        resaltadosCache = await res.json();
        renderListaResaltadosLateral();
    }
}

function dibujarTodosLosResaltados() {
    // Limpiar capas actuales
    document.querySelectorAll('.pdf-highlight-layer').forEach(layer => layer.innerHTML = '');

    resaltadosCache.forEach(resaltado => {
        const pageWrapper = document.querySelector(`.pdf-page-wrapper[data-pagina="${resaltado.pagina}"]`);
        if (!pageWrapper) return;

        const layer = pageWrapper.querySelector('.pdf-highlight-layer');
        const rects = JSON.parse(resaltado.coordenadas || '[]');

        rects.forEach(r => {
            const box = document.createElement('div');
            box.style.position = 'absolute';
            box.style.top = `${r.top}%`;
            box.style.left = `${r.left}%`;
            box.style.width = `${r.width}%`;
            box.style.height = `${r.height}%`;
            box.style.backgroundColor = resaltado.color;
            box.style.opacity = '0.38';
            box.style.mixBlendMode = 'multiply';
            box.style.pointerEvents = 'auto'; // Permite hacer clic para borrarlo
            box.style.cursor = 'pointer';
            box.title = `${resaltado.nombreMarcador}: "${resaltado.textoResaltado}" (Clic para quitar)`;

            box.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`¿Quitar este resaltado (${resaltado.nombreMarcador})?`)) {
                    eliminarResaltadoPdf(resaltado.id);
                }
            });

            layer.appendChild(box);
        });
    });

    renderListaResaltadosLateral();
}

function renderListaResaltadosLateral() {
    const lista = document.getElementById('lista-resaltados-pdf');
    if (!lista) return;

    if (resaltadosCache.length === 0) {
        lista.innerHTML = '<p style="color:#aaa;">Seleccioná texto en el PDF para resaltarlo.</p>';
        return;
    }

    lista.innerHTML = resaltadosCache.map(r => `
        <div style="background:#2b2b3d; padding:6px; border-left: 4px solid ${r.color}; border-radius:4px;">
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:0.75rem; color:#ccc;">
                <span>${escapeHtml(r.nombreMarcador)} (Pág. ${r.pagina})</span>
                <button type="button" onclick="eliminarResaltadoPdf(${r.id})" style="color:#ff6b6b; cursor:pointer;">×</button>
            </div>
            <p style="margin:4px 0 0 0; font-style:italic; color:#eee;">"${escapeHtml(r.textoResaltado)}"</p>
        </div>
    `).join('');
}

// Detectar cuando el usuario termina de seleccionar texto en el PDF
document.addEventListener('mouseup', (e) => {
    const container = document.getElementById('pdf-pages-container');
    if (!container || !container.contains(e.target)) return;

    const selection = window.getSelection();
    const texto = selection.toString().trim();
    if (!texto || selection.rangeCount === 0) {
        ocultarTooltipResaltado();
        return;
    }

    const range = selection.getRangeAt(0);
    const pageWrapper = range.commonAncestorContainer.nodeType === 1
        ? range.commonAncestorContainer.closest('.pdf-page-wrapper')
        : range.commonAncestorContainer.parentElement?.closest('.pdf-page-wrapper');

    if (!pageWrapper) return;

    const pageRect = pageWrapper.getBoundingClientRect();
    const clientRects = Array.from(range.getClientRects());

    // Convertir cada renglón seleccionado a porcentajes relativos a la página
    const coordenadasPorcentaje = clientRects
        .filter(r => r.width > 0 && r.height > 0)
        .map(r => ({
            top: ((r.top - pageRect.top) / pageRect.height) * 100,
            left: ((r.left - pageRect.left) / pageRect.width) * 100,
            width: (r.width / pageRect.width) * 100,
            height: (r.height / pageRect.height) * 100
        }));

    seleccionPendiente = {
        idDocumento: documentoActualId,
        textoResaltado: texto,
        pagina: parseInt(pageWrapper.dataset.pagina, 10),
        coordenadas: JSON.stringify(coordenadasPorcentaje)
    };

    mostrarTooltipResaltado(e.clientX, e.clientY);
});

function mostrarTooltipResaltado(x, y) {
    const tooltip = document.getElementById('pdf-highlight-tooltip');
    if (!tooltip) return;

    if (marcadoresCache.length === 0) {
        tooltip.innerHTML = '<span style="font-size:0.8rem;">Creá una etiqueta a la izquierda primero</span>';
    } else {
        tooltip.innerHTML = marcadoresCache.map(m => `
            <button type="button" onclick="confirmarGuardarResaltado(${m.id})" 
                style="background:${m.color}; color:#000; border:none; padding:4px 8px; border-radius:4px; font-weight:bold; cursor:pointer;">
                ${escapeHtml(m.nombre)}
            </button>
        `).join('');
    }

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y - 45}px`;
    tooltip.classList.remove('hidden');
}

function ocultarTooltipResaltado() {
    const tooltip = document.getElementById('pdf-highlight-tooltip');
    tooltip?.classList.add('hidden');
    seleccionPendiente = null;
}

async function confirmarGuardarResaltado(idMarcador) {
    if (!seleccionPendiente) return;

    const payload = {
        ...seleccionPendiente,
        idMarcador
    };

    const res = await fetch('/Home/GuardarResaltado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    window.getSelection()?.removeAllRanges();
    ocultarTooltipResaltado();

    if (res.ok) {
        const nuevoResaltado = await res.json();
        resaltadosCache.push(nuevoResaltado);
        dibujarTodosLosResaltados();
    }
}

async function eliminarResaltadoPdf(idResaltado) {
    const res = await fetch('/Home/EliminarResaltado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idResaltado })
    });

    if (res.ok) {
        resaltadosCache = resaltadosCache.filter(r => r.id !== idResaltado);
        dibujarTodosLosResaltados();
    }
}
async function abrirDocumento(id) {
    const documento = documentosCache.find(d => d.id === id);
    if (!documento) return;

    documentoActualId = id;
    cerrarModalDocumentos();

    document.getElementById('pdf-viewer-title').textContent = documento.nombre;
    document.getElementById('pdf-viewer').classList.remove('hidden');
    // Abrimos el modal de etiquetas junto con el documento
    document.getElementById('pdf-marcadores-modal')?.classList.remove('hidden');

    // Renderizamos el PDF primero para que nunca quede en blanco
    await renderizarPdfConCapas(documento.ruta);

    // Luego cargamos etiquetas y resaltados guardados
    await cargarMarcadoresPdf();
    await cargarResaltadosPdf(id);
    dibujarTodosLosResaltados();
}

function volverAlModalDocumentos() {
    cerrarVisorDocumento();
    abrirModalDocumentos();
}

function cerrarVisorDocumento() {
    document.getElementById('pdf-viewer').classList.add('hidden');
    // Cerramos el modal de etiquetas al cerrar el documento
    document.getElementById('pdf-marcadores-modal')?.classList.add('hidden');
    document.getElementById('pdf-pages-container').innerHTML = '';
    ocultarTooltipResaltado();
    documentoActualId = null;
}

async function renderizarPdfConCapas(urlPdf) {
    const container = document.getElementById('pdf-pages-container');
    if (!container) return;

    if (!window.pdfjsLib) {
        container.innerHTML = '<p class="documentos-vacio">Error: No se cargó la librería PDF.js en Workspace.cshtml.</p>';
        return;
    }

    container.innerHTML = '<p class="documentos-vacio">Cargando documento...</p>';

    try {
        const pdf = await pdfjsLib.getDocument(urlPdf).promise;
        container.innerHTML = '';

        for (let numPagina = 1; numPagina <= pdf.numPages; numPagina++) {
            const page = await pdf.getPage(numPagina);
            const scale = 1.35;
            const viewport = page.getViewport({ scale });

            const pageWrapper = document.createElement('div');
            pageWrapper.className = 'pdf-page-wrapper';
            pageWrapper.dataset.pagina = numPagina;
            pageWrapper.style.position = 'relative';
            pageWrapper.style.width = `${viewport.width}px`;
            pageWrapper.style.height = `${viewport.height}px`;
            pageWrapper.style.background = '#fff';
            pageWrapper.style.boxShadow = '0 2px 10px rgba(33, 34, 37, 0.12)';
            pageWrapper.style.flexShrink = '0';

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;

            const highlightLayer = document.createElement('div');
            highlightLayer.className = 'pdf-highlight-layer';
            highlightLayer.style.position = 'absolute';
            highlightLayer.style.inset = '0';
            highlightLayer.style.pointerEvents = 'none';

            const textLayerDiv = document.createElement('div');
            textLayerDiv.className = 'textLayer';
            textLayerDiv.style.width = `${viewport.width}px`;
            textLayerDiv.style.height = `${viewport.height}px`;

            const textContent = await page.getTextContent();
            await pdfjsLib.renderTextLayer({
                textContentSource: textContent,
                container: textLayerDiv,
                viewport: viewport,
                textDivs: []
            }).promise;

            pageWrapper.appendChild(canvas);
            pageWrapper.appendChild(highlightLayer);
            pageWrapper.appendChild(textLayerDiv);
            container.appendChild(pageWrapper);
        }
    } catch (error) {
        console.error('Error renderizando PDF:', error);
        container.innerHTML = `<p class="documentos-vacio">No se pudo mostrar el PDF (${escapeHtml(urlPdf)}).</p>`;
    }
}