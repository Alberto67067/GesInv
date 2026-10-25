/* =========================================================================
   views/configuracion.js · Datos de la empresa, preferencias y respaldos
   ========================================================================= */
window.Inventario = window.Inventario || {};
(function (App) {
  'use strict';

  var U = App.utils;
  var ui = App.ui;
  App.views = App.views || {};

  var MONEDAS = [
    { value: 'PEN', label: 'Sol peruano (S/)' },
    { value: 'USD', label: 'Dólar estadounidense ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'MXN', label: 'Peso mexicano ($)' },
    { value: 'COP', label: 'Peso colombiano ($)' },
    { value: 'CLP', label: 'Peso chileno ($)' },
    { value: 'ARS', label: 'Peso argentino ($)' },
    { value: 'BRL', label: 'Real brasileño (R$)' }
  ];

  var LOCALES = [
    { value: 'es-PE', label: 'Español (Perú)' },
    { value: 'es-MX', label: 'Español (México)' },
    { value: 'es-CO', label: 'Español (Colombia)' },
    { value: 'es-CL', label: 'Español (Chile)' },
    { value: 'es-AR', label: 'Español (Argentina)' },
    { value: 'es-ES', label: 'Español (España)' },
    { value: 'en-US', label: 'Inglés (EE. UU.)' }
  ];

  function render(cont) {
    var store = App.store;
    var e = store.getEmpresa();
    var m = store.metricas();

    cont.innerHTML =
      ui.pageHead({
        titulo: 'Configuración',
        texto: 'Datos de la empresa, preferencias regionales y gestión de la información',
        acciones: '<button type="button" class="btn btn-primary" data-action="guardar-empresa">' + ui.icon('check') + '<span>Guardar cambios</span></button>'
      }) +

      '<div class="grid grid-2-1">' +
      '<div class="stack">' +

      /* ---------------------------- Empresa ---------------------------- */
      '<section class="card">' +
      ui.cardHead('Datos de la empresa', 'Aparecen en los reportes y exportaciones') +
      '<div class="card-body"><form id="formEmpresa" class="form-grid">' +
      ui.campo({ etiqueta: 'Razón social', name: 'nombre', valor: e.nombre, span: true, requerido: true }) +
      ui.campo({ etiqueta: 'RUC / NIT', name: 'ruc', valor: e.ruc }) +
      ui.campo({ etiqueta: 'Dirección', name: 'direccion', valor: e.direccion }) +
      ui.campo({
        etiqueta: 'Moneda', name: 'moneda', tipo: 'select', valor: e.moneda,
        opciones: MONEDAS, hint: 'Se usa para formatear todos los importes'
      }) +
      ui.campo({ etiqueta: 'Formato regional', name: 'locale', tipo: 'select', valor: e.locale, opciones: LOCALES }) +
      ui.campo({
        etiqueta: 'Stock mínimo por defecto', name: 'stockMinimoDefault', tipo: 'number', paso: '1', min: 0,
        valor: e.stockMinimoDefault, hint: 'Se propone al crear productos nuevos'
      }) +
      '</form></div></section>' +

      /* --------------------------- Apariencia -------------------------- */
      '<section class="card">' +
      ui.cardHead('Apariencia', 'Tema de la interfaz') +
      '<div class="card-body">' +
      '<div class="segmented" data-tema>' +
      '<button type="button" data-t="light" class="' + (e.tema !== 'dark' ? 'is-active' : '') + '">Claro</button>' +
      '<button type="button" data-t="dark" class="' + (e.tema === 'dark' ? 'is-active' : '') + '">Oscuro</button>' +
      '</div>' +
      '<p class="muted" style="font-size:12.5px;margin-top:10px">La preferencia se guarda junto con tus datos.</p>' +
      '</div></section>' +

      /* ----------------------------- Datos ----------------------------- */
      '<section class="card">' +
      ui.cardHead('Copia de seguridad', 'Tus datos viven en este dispositivo: respáldalos con frecuencia') +
      '<div class="card-body stack">' +
      '<div id="estadoRespaldo"></div>' +
      '<div class="toolbar">' +
      '<button type="button" class="btn btn-outline" data-action="backup">' + ui.icon('download') + '<span>Descargar respaldo</span></button>' +
      '<button type="button" class="btn btn-outline" data-action="compartir">' + ui.icon('upload') + '<span>Compartir respaldo</span></button>' +
      '<button type="button" class="btn btn-outline" data-action="restaurar">' + ui.icon('refresh') + '<span>Restaurar</span></button>' +
      '<button type="button" class="btn btn-outline" data-action="demo">' + ui.icon('layers') + '<span>Datos de ejemplo</span></button>' +
      '<button type="button" class="btn btn-danger" data-action="vaciar">' + ui.icon('trash') + '<span>Borrar todo</span></button>' +
      '</div>' +
      '<div class="note">' + ui.icon('shield') +
      '<div><strong>Cada dispositivo tiene su propio inventario.</strong> El respaldo es la forma de moverlo: ' +
      'expórtalo aquí y usa <em>Restaurar</em> en el otro teléfono. Compartir funciona con WhatsApp, Drive, ' +
      'Correo o Archivos.</div>' +
      '</div></div></section>' +

      '</div>' +

      /* --------------------------- Lateral ---------------------------- */
      '<div class="stack">' +

      '<section class="card">' +
      ui.cardHead('Aplicación en el móvil', 'Estado de instalación') +
      '<div class="card-body stack">' +
      '<div id="estadoInstalacion"></div>' +
      '<button type="button" class="btn btn-primary btn-block" data-action="instalar">' + ui.icon('download') + '<span>Instalar en la pantalla de inicio</span></button>' +
      '<div class="note warn">' + ui.icon('alert') +
      '<div><strong>iPhone:</strong> si usas la app solo desde Safari, iOS puede borrar los datos ' +
      'tras 7 días sin abrirla. Instalada en la pantalla de inicio, tus datos quedan a salvo.</div>' +
      '</div></div></section>' +

      '<section class="card">' +
      ui.cardHead('Resumen del sistema') +
      '<div class="card-body">' +
      resumen('Productos', U.num(m.totalProductos), 'box') +
      resumen('Movimientos', U.num(m.totalMovimientos), 'clock') +
      resumen('Categorías', U.num(m.categorias), 'tag') +
      resumen('Proveedores', U.num(m.proveedores), 'truck') +
      resumen('Valor del inventario', U.money(m.valorCompra), 'coins') +
      '</div></section>' +

      '<section class="card">' +
      ui.cardHead('Almacenamiento') +
      '<div class="card-body">' +
      '<div style="display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:8px">' +
      '<span class="muted">Tamaño de la base local</span>' +
      '<strong id="tamanoDB">—</strong>' +
      '</div>' +
      '<div class="progress"><span id="barraDB" style="width:0%"></span></div>' +
      '<p class="muted" style="font-size:12px;margin-top:8px">Límite típico del navegador: ~5 MB</p>' +
      '<div class="divider" style="margin:14px 0"></div>' +
      '<div style="font-size:13px;color:var(--text-2)">' +
      '<div style="display:flex;justify-content:space-between;padding:4px 0"><span class="muted">Última modificación</span><span>' + U.relativeTime(store.getState().meta.actualizado) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:4px 0"><span class="muted">Creado</span><span>' + U.formatDate(store.getState().meta.creado) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:4px 0"><span class="muted">Datos de ejemplo</span><span>' + (store.isDemo() ? 'Sí' : 'No') + '</span></div>' +
      '</div>' +
      '</div></section>' +

      '<section class="card">' +
      ui.cardHead('Atajos de teclado') +
      '<div class="card-body stack" style="gap:10px">' +
      atajo('/', 'Enfocar la búsqueda global') +
      atajo('N', 'Nuevo producto') +
      atajo('M', 'Registrar movimiento') +
      atajo('Esc', 'Cerrar diálogos') +
      '</div></section>' +

      '</div></div>';

    pintarTamano();
    pintarEstadoRespaldo();
    pintarEstadoInstalacion();
    montar(cont);
  }

  /* -------------------- Estado del respaldo y la instalación ------------- */
  function pintarEstadoRespaldo() {
    var host = document.getElementById('estadoRespaldo');
    if (!host) return;
    var ultimo = App.store.getState().meta.ultimoRespaldo;
    var dias = ultimo ? Math.floor((Date.now() - new Date(ultimo).getTime()) / 86400000) : null;

    if (dias === null) {
      host.innerHTML = '<div class="note warn">' + ui.icon('alert') +
        '<div><strong>Todavía no has hecho ningún respaldo.</strong> Si borras los datos del navegador perderás el inventario.</div></div>';
    } else if (dias >= 7) {
      host.innerHTML = '<div class="note warn">' + ui.icon('alert') +
        '<div><strong>Hace ' + dias + ' días que no respaldas.</strong> Último respaldo: ' +
        U.formatDate(ultimo) + '. Te recomendamos hacerlo ahora.</div></div>';
    } else {
      host.innerHTML = '<div class="note">' + ui.icon('check') +
        '<div>Último respaldo: <strong>' + U.relativeTime(ultimo) + '</strong> (' + U.formatDate(ultimo) + ').</div></div>';
    }
  }

  function pintarEstadoInstalacion() {
    var host = document.getElementById('estadoInstalacion');
    if (!host) return;
    var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      navigator.standalone === true;
    host.innerHTML = standalone
      ? '<div class="note">' + ui.icon('check') + '<div><strong>Instalada.</strong> Estás usando la aplicación en modo pantalla completa.</div></div>'
      : '<div class="note">' + ui.icon('info') + '<div>Abriéndola como web normal. Instálala para tener icono propio, pantalla completa y datos protegidos.</div></div>';
  }

  function resumen(etiqueta, valor, icono) {
    return '<div style="display:flex;align-items:center;gap:11px;padding:9px 0;border-bottom:1px dashed var(--border)">' +
      '<span class="kpi-ico" style="width:30px;height:30px;border-radius:9px">' + ui.icon(icono) + '</span>' +
      '<span class="grow muted" style="font-size:13px">' + etiqueta + '</span>' +
      '<strong style="font-size:14px" class="mono">' + valor + '</strong></div>';
  }

  function atajo(tecla, descripcion) {
    return '<div style="display:flex;align-items:center;gap:10px;font-size:13px">' +
      '<kbd style="padding:2px 8px;border-radius:6px;border:1px solid var(--border);background:var(--surface-2);font-weight:600">' + tecla + '</kbd>' +
      '<span class="muted">' + descripcion + '</span></div>';
  }

  function pintarTamano() {
    var el = document.getElementById('tamanoDB');
    var barra = document.getElementById('barraDB');
    if (!el) return;
    var bytes = 0;
    try {
      var raw = localStorage.getItem(App.store.STORAGE_KEY) || '';
      bytes = new Blob([raw]).size;
    } catch (e) { /* ignore */ }
    el.textContent = U.bytes(bytes);
    var pct = U.clamp((bytes / (5 * 1024 * 1024)) * 100, 0.5, 100);
    if (barra) {
      barra.style.width = pct.toFixed(1) + '%';
      barra.className = pct > 80 ? '' : '';
      barra.style.background = pct > 80 ? 'var(--danger)' : pct > 50 ? 'var(--warn)' : 'var(--success)';
    }
  }

  function montar(cont) {
    cont.addEventListener('change', function (e) {
      if (e.target.name) {
        /* Los campos del formulario se guardan al pulsar "Guardar cambios". */
        return;
      }
    });

    cont.addEventListener('click', function (e) {
      var tema = e.target.closest('[data-tema] button');
      if (tema) {
        var t = tema.getAttribute('data-t');
        App.store.updateEmpresa({ tema: t });
        ui.aplicarTema(t);
        U.qsa('[data-tema] button', cont).forEach(function (b) { b.classList.remove('is-active'); });
        tema.classList.add('is-active');
        ui.toast('Tema actualizado', 'info', t === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado');
        return;
      }

      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var accion = btn.getAttribute('data-action');
      if (accion === 'guardar-empresa') guardarEmpresa();
      else if (accion === 'backup') backup();
      else if (accion === 'compartir') compartirRespaldo();
      else if (accion === 'instalar') abrirInstalacion();
      else if (accion === 'restaurar') restaurar();
      else if (accion === 'demo') cargarDemo();
      else if (accion === 'vaciar') vaciar();
    });
  }

  function guardarEmpresa() {
    var form = document.getElementById('formEmpresa');
    if (!form) return;
    var d = ui.leerFormulario(form);
    if (!String(d.nombre || '').trim()) {
      ui.marcarErrores(form, { nombre: 'Ingresa la razón social.' });
      ui.toast('Revisa el nombre de la empresa', 'error');
      return;
    }
    App.store.updateEmpresa({
      nombre: d.nombre.trim(), ruc: d.ruc, direccion: d.direccion,
      moneda: d.moneda, locale: d.locale,
      stockMinimoDefault: U.toNumber(d.stockMinimoDefault, 5)
    });
    ui.toast('Configuración guardada', 'success', 'Los importes se mostrarán en ' + d.moneda + '.');
    App.router.refrescar();
  }

  function nombreRespaldo() {
    return 'inventario-respaldo-' + U.dateKey(new Date().toISOString()) + '.json';
  }

  function marcarRespaldo() {
    App.store.marcarRespaldo();
  }

  function backup() {
    U.download(nombreRespaldo(), App.store.exportarJSON(), 'application/json');
    marcarRespaldo();
    pintarEstadoRespaldo();
    ui.toast('Respaldo descargado', 'success', 'Guárdalo en un lugar seguro.');
  }

  /** Comparte el respaldo con las apps del móvil (WhatsApp, Drive, Archivos…). */
  function compartirRespaldo() {
    var contenido = App.store.exportarJSON();
    var nombre = nombreRespaldo();

    if (navigator.canShare && window.File) {
      try {
        var archivo = new File([contenido], nombre, { type: 'application/json' });
        if (navigator.canShare({ files: [archivo] })) {
          navigator.share({
            files: [archivo],
            title: 'Respaldo de InventarioPro',
            text: 'Copia de seguridad del inventario del ' + U.formatDate(new Date().toISOString())
          }).then(function () {
            marcarRespaldo();
            pintarEstadoRespaldo();
            ui.toast('Respaldo compartido', 'success', 'Guárdalo en Drive, Notas o envíalo por correo.');
          }).catch(function (err) {
            if (err && err.name === 'AbortError') return;
            U.download(nombre, contenido, 'application/json');
            ui.toast('Respaldo descargado', 'success', 'Tu navegador no permite compartir archivos.');
          });
          return;
        }
      } catch (e) { /* continuamos con la descarga */ }
    }

    U.download(nombre, contenido, 'application/json');
    marcarRespaldo();
    pintarEstadoRespaldo();
    ui.toast('Respaldo descargado', 'success', 'Busca el archivo en tus Descargas.');
  }

  /** Reproduce las instrucciones de instalación desde Ajustes. */
  function abrirInstalacion() {
    var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      navigator.standalone === true;
    if (standalone) {
      ui.toast('Ya está instalada', 'info', 'La estás usando en modo aplicación.');
      return;
    }
    var ua = navigator.userAgent || '';
    var ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    ui.modal({
      titulo: 'Instalar en la pantalla de inicio',
      subtitulo: ios ? 'iPhone / iPad · Safari' : 'Android · Chrome',
      tamano: 'sm',
      cuerpo: '<ol style="font-size:14px;color:var(--text-2);padding-left:20px;display:grid;gap:10px">' +
        (ios
          ? '<li>Abre esta página en <strong>Safari</strong> (no en Chrome ni dentro de otra app).</li>' +
          '<li>Toca el botón <strong>Compartir</strong> (cuadro con flecha hacia arriba) abajo.</li>' +
          '<li>Elige <strong>“Añadir a pantalla de inicio”</strong> y confirma.</li>'
          : '<li>Abre el menú <strong>⋮</strong> de Chrome, arriba a la derecha.</li>' +
          '<li>Elige <strong>“Instalar aplicación”</strong> o <strong>“Añadir a pantalla de inicio”</strong>.</li>' +
          '<li>Confirma la instalación.</li>') +
        '</ol>' +
        '<div class="note" style="margin-top:16px">' + ui.icon('shield') +
        '<div>Instalada funciona <strong>sin conexión</strong>, a pantalla completa y con su propio icono. ' +
        'En iPhone además evita que iOS borre tus datos tras 7 días sin usarla.</div></div>',
      pie: '<button type="button" class="btn btn-primary" data-close>Entendido</button>'
    });
  }

  function restaurar() {
    var m = ui.modal({
      titulo: 'Restaurar respaldo',
      subtitulo: 'Reemplaza todos los datos actuales',
      cuerpo: '<div class="stack">' +
        '<div class="note warn">' + ui.icon('alert') +
        '<div>Al restaurar se <strong>sobrescribirá</strong> el inventario actual. Te recomendamos descargar un respaldo antes.</div></div>' +
        '<div class="field"><label for="archivoBackup">Archivo JSON</label>' +
        '<input class="input" type="file" id="archivoBackup" accept=".json,application/json"></div>' +
        '<div class="field"><label for="pegarBackup">…o pega el contenido</label>' +
        '<textarea class="textarea" id="pegarBackup" style="min-height:120px;font-family:var(--font-mono);font-size:12px" placeholder="{ ... }"></textarea></div>' +
        '</div>',
      pie: '<button type="button" class="btn btn-outline" data-close>Cancelar</button>' +
        '<button type="button" class="btn btn-primary" data-restaurar>Restaurar datos</button>'
    });

    m.pie.querySelector('[data-restaurar]').addEventListener('click', function () {
      var archivo = m.cuerpo.querySelector('#archivoBackup').files[0];
      var pegado = m.cuerpo.querySelector('#pegarBackup').value;
      var promesa = archivo ? U.leerArchivo(archivo) : Promise.resolve(pegado);
      promesa.then(function (texto) {
        if (!String(texto || '').trim()) { ui.toast('Selecciona un archivo o pega el contenido', 'warn'); return; }
        try {
          var res = App.store.importarJSON(texto);
          m.cerrar();
          ui.toast('Respaldo restaurado', 'success', res.productos + ' productos y ' + res.movimientos + ' movimientos.');
          App.router.refrescar();
        } catch (err) { ui.toast(err.message, 'error'); }
      }).catch(function (err) { ui.toast('Error al leer el archivo', 'error', err.message); });
    });
  }

  function cargarDemo() {
    ui.confirmar({
      titulo: 'Recargar datos de ejemplo',
      mensaje: 'Se reemplazará el inventario actual por un conjunto de datos de demostración.',
      detalle: 'Útil para explorar la aplicación. Tus datos actuales se perderán si no los has respaldado.',
      confirmar: 'Recargar ejemplo',
      peligro: true
    }).then(function (ok) {
      if (!ok) return;
      App.store.cargarDemo();
      ui.toast('Datos de ejemplo cargados', 'success', 'Explora el panel con información realista.');
      App.router.refrescar();
    });
  }

  function vaciar() {
    ui.confirmar({
      titulo: 'Borrar toda la información',
      mensaje: 'Se eliminarán productos, categorías, proveedores y movimientos.',
      detalle: 'Esta acción es <strong>irreversible</strong>. Descarga un respaldo antes de continuar.',
      confirmar: 'Sí, borrar todo',
      peligro: true
    }).then(function (ok) {
      if (!ok) return;
      App.store.vaciar();
      App.views.productos.resetVista();
      App.views.movimientos.resetVista();
      ui.toast('Inventario vaciado', 'info', 'Empieza registrando tus categorías y productos.');
      App.router.navegar('dashboard');
    });
  }

  App.views.configuracion = {
    titulo: 'Configuración',
    subtitulo: 'Empresa, preferencias y respaldos',
    render: render
  };
})(window.Inventario);
