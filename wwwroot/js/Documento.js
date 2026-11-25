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

function abrirDocumento(id) {
  const documento = documentosCache.find(d => d.id === id);
  if (!documento) return;
  cerrarModalDocumentos();

  document.getElementById('pdf-viewer-title').textContent = documento.nombre;
  document.getElementById('pdf-viewer-frame').src = documento.ruta + '#toolbar=0&navpanes=0&scrollbar=1&view=FitH';
  document.getElementById('pdf-viewer').classList.remove('hidden');
}

function volverAlModalDocumentos() {
  document.getElementById('pdf-viewer').classList.add('hidden');
  document.getElementById('pdf-viewer-frame').src = 'about:blank';
  abrirModalDocumentos();
}

function cerrarVisorDocumento() {
  document.getElementById('pdf-viewer').classList.add('hidden');
  document.getElementById('pdf-viewer-frame').src = 'about:blank';
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
