/* =========================================================================
   ui.js · Componentes de interfaz reutilizables
   Modales, notificaciones, iconos, estados vacíos, paginación y helpers.
   ========================================================================= */
window.Inventario = window.Inventario || {};
(function (App) {
  'use strict';

  var U = App.utils;
  var ui = {};

  /* ============================== Iconos ================================= */
  var PATHS = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
    arrowDown: '<path d="M12 5v14"/><path d="M5 12l7 7 7-7"/>',
    arrowUp: '<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>',
    adjust: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 8l5-5 5 5"/><path d="M12 3v12"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>',
    refresh: '<path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v5h-5"/>',
    tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0l-7.2-7.2A2 2 0 013 12V5a2 2 0 012-2h7a2 2 0 011.4.6l7.2 7.2a2 2 0 010 2.6z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
    truck: '<path d="M1 4h14v11H1z"/><path d="M15 8h4l3 3v4h-7z"/><circle cx="5.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',
    chart: '<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>',
    coins: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    print: '<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 01-2-2v-5h20v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v7H6z"/>',
    filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
    eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
    building: '<path d="M3 21h18"/><path d="M5 21V5a2 2 0 012-2h6a2 2 0 012 2v16"/><path d="M15 21V9h4a2 2 0 012 2v10"/><path d="M9 7h2M9 11h2M9 15h2"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    layers: '<path d="M12 2l9 5-9 5-9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/>',
    bolt: '<path d="M13 2L3 14h7l-1 8 10-12h-7z"/>'
  };

  /** Devuelve el markup SVG de un icono. */
  ui.icon = function (name, cls) {
    var d = PATHS[name] || PATHS.info;
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  };

  /* ============================== Toasts ================================= */
  function toastHost() { return document.getElementById('toasts'); }

  ui.toast = function (mensaje, tipo, detalle) {
    var host = toastHost();
    if (!host) return;
    var t = tipo || 'success';
    var icono = t === 'error' ? 'alert' : t === 'warn' ? 'alert' : t === 'info' ? 'info' : 'check';
    var node = U.el(
      '<div class="toast ' + t + '" role="status">' +
      ui.icon(icono) +
      '<div><strong>' + U.escapeHtml(mensaje) + '</strong>' +
      (detalle ? '<small>' + U.escapeHtml(detalle) + '</small>' : '') +
      '</div></div>'
    );
    host.appendChild(node);
    var cerrar = function () {
      node.classList.add('out');
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 220);
    };
    node.addEventListener('click', cerrar);
    setTimeout(cerrar, tipo === 'error' ? 6200 : 3800);
  };

  /* ============================== Modales ================================ */
  var modalActivo = null;

  /**
   * Abre un modal.
   * @param {{titulo, subtitulo?, cuerpo, pie?, tamano?:'sm'|'lg', onMount?:Function}} opts
   * @returns {{root: HTMLElement, cerrar: Function, cuerpo: HTMLElement}}
   */
  ui.modal = function (opts) {
    ui.cerrarModal();
    var root = document.getElementById('modalRoot');

    var backdrop = U.el(
      '<div class="modal-backdrop" role="dialog" aria-modal="true">' +
      '<div class="modal ' + (opts.tamano === 'lg' ? 'is-lg' : opts.tamano === 'sm' ? 'is-sm' : '') + '">' +
      '<div class="modal-head">' +
      '<div class="grow"><h3>' + U.escapeHtml(opts.titulo || '') + '</h3>' +
      (opts.subtitulo ? '<p>' + U.escapeHtml(opts.subtitulo) + '</p>' : '') + '</div>' +
      '<button type="button" class="icon-btn is-sm" data-close aria-label="Cerrar">' + ui.icon('x') + '</button>' +
      '</div>' +
      '<div class="modal-body"></div>' +
      (opts.pie ? '<div class="modal-foot"></div>' : '') +
      '</div></div>'
    );

    var cuerpo = backdrop.querySelector('.modal-body');
    if (typeof opts.cuerpo === 'string') cuerpo.innerHTML = opts.cuerpo;
    else if (opts.cuerpo instanceof Node) cuerpo.appendChild(opts.cuerpo);

    var pie = backdrop.querySelector('.modal-foot');
    if (pie && opts.pie) {
      if (typeof opts.pie === 'string') pie.innerHTML = opts.pie;
      else pie.appendChild(opts.pie);
    }

    root.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    var cerrar = function () {
      document.body.style.overflow = '';
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      document.removeEventListener('keydown', onKey);
      modalActivo = null;
    };

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
    }

    backdrop.addEventListener('mousedown', function (e) {
      if (e.target === backdrop) cerrar();
    });
    backdrop.querySelectorAll('[data-close]').forEach(function (b) {
      b.addEventListener('click', cerrar);
    });
    document.addEventListener('keydown', onKey);

    modalActivo = { cerrar: cerrar, backdrop: backdrop };
    if (typeof opts.onMount === 'function') opts.onMount(cuerpo, cerrar, pie);

    var primerCampo = cuerpo.querySelector('input, select, textarea, button');
    if (primerCampo) setTimeout(function () { primerCampo.focus(); }, 60);

    return { root: backdrop, cerrar: cerrar, cuerpo: cuerpo, pie: pie };
  };

  ui.cerrarModal = function () {
    if (modalActivo) modalActivo.cerrar();
  };

  /** Confirmación asíncrona. @returns Promise<boolean> */
  ui.confirmar = function (opts) {
    return new Promise(function (resolve) {
      var resuelto = false;
      var terminar = function (valor) {
        if (resuelto) return;
        resuelto = true;
        resolve(valor);
      };

      var ref = ui.modal({
        titulo: opts.titulo || 'Confirmar acción',
        subtitulo: opts.subtitulo || '',
        tamano: 'sm',
        cuerpo: '<p style="font-size:14px;color:var(--text-2)">' + U.escapeHtml(opts.mensaje || '') + '</p>' +
          (opts.detalle ? '<div class="note ' + (opts.peligro ? 'warn' : '') + '" style="margin-top:14px">' +
            ui.icon(opts.peligro ? 'alert' : 'info') + '<div>' + opts.detalle + '</div></div>' : ''),
        pie: '<button type="button" class="btn btn-outline" data-cancelar>Cancelar</button>' +
          '<button type="button" class="btn ' + (opts.peligro ? 'btn-danger' : 'btn-primary') + '" data-ok>' +
          U.escapeHtml(opts.confirmar || 'Confirmar') + '</button>',
        onMount: function (cuerpo, cerrar, pie) {
          pie.querySelector('[data-ok]').addEventListener('click', function () { cerrar(); terminar(true); });
          pie.querySelector('[data-cancelar]').addEventListener('click', function () { cerrar(); terminar(false); });
        }
      });

      /* Si se cierra con Esc o clic fuera, la respuesta es negativa. */
      var host = document.getElementById('modalRoot');
      var observer = new MutationObserver(function () {
        if (!document.body.contains(ref.root)) {
          observer.disconnect();
          terminar(false);
        }
      });
      observer.observe(host, { childList: true });
    });
  };

  /* ======================== Piezas de interfaz =========================== */
  ui.estadoBadge = function (producto) {
    var st = App.store.estadoStock(producto);
    var clase = st === 'ok' ? 'success' : st === 'bajo' ? 'warn' : 'danger';
    return '<span class="badge ' + clase + '">' + App.store.ETIQUETA_ESTADO[st] + '</span>';
  };

  ui.tipoBadge = function (tipo) {
    var map = {
      entrada: { clase: 'success', texto: 'Entrada', icono: 'arrowDown' },
      salida: { clase: 'danger', texto: 'Salida', icono: 'arrowUp' },
      ajuste: { clase: 'info', texto: 'Ajuste', icono: 'adjust' }
    };
    var m = map[tipo] || { clase: '', texto: tipo, icono: 'info' };
    return '<span class="badge ' + m.clase + ' no-dot" style="gap:6px">' + ui.icon(m.icono, 'badge-ico') + m.texto + '</span>';
  };

  ui.vacio = function (opts) {
    return '<div class="empty">' + ui.icon(opts.icono || 'box') +
      '<strong>' + U.escapeHtml(opts.titulo || 'Sin resultados') + '</strong>' +
      '<p>' + U.escapeHtml(opts.texto || '') + '</p>' +
      (opts.accion || '') + '</div>';
  };

  ui.kpi = function (opts) {
    return '<article class="kpi ' + (opts.tono || '') + '">' +
      '<div class="kpi-top">' +
      '<span class="kpi-ico">' + ui.icon(opts.icono || 'box') + '</span>' +
      '<span class="kpi-label">' + U.escapeHtml(opts.etiqueta) + '</span>' +
      '</div>' +
      '<p class="kpi-value">' + (opts.valor) + '</p>' +
      '<p class="kpi-sub">' + (opts.sub || '') + '</p>' +
      '</article>';
  };

  /**
   * Paginación. Devuelve el HTML; el consumidor enlaza los botones con data-page.
   */
  ui.paginacion = function (opts) {
    var total = opts.total, pagina = opts.pagina, porPagina = opts.porPagina;
    var paginas = Math.max(1, Math.ceil(total / porPagina));
    var desde = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
    var hasta = Math.min(total, pagina * porPagina);

    var botones = [];
    var rango = [];
    for (var i = 1; i <= paginas; i++) {
      if (i === 1 || i === paginas || Math.abs(i - pagina) <= 1) rango.push(i);
      else if (rango[rango.length - 1] !== '…') rango.push('…');
    }
    rango.forEach(function (p) {
      if (p === '…') botones.push('<span class="page-btn" style="pointer-events:none;border-color:transparent;background:none">…</span>');
      else botones.push('<button type="button" class="page-btn' + (p === pagina ? ' is-active' : '') + '" data-page="' + p + '">' + p + '</button>');
    });

    return '<div class="pagination">' +
      '<span class="muted" style="font-size:12.5px">' + desde + '–' + hasta + ' de ' + U.formatInt(total) + '</span>' +
      '<div class="pages">' +
      '<button type="button" class="page-btn" data-page="' + (pagina - 1) + '"' + (pagina <= 1 ? ' disabled' : '') + '>‹</button>' +
      botones.join('') +
      '<button type="button" class="page-btn" data-page="' + (pagina + 1) + '"' + (pagina >= paginas ? ' disabled' : '') + '>›</button>' +
      '</div></div>';
  };

  /* ============================= Formularios ============================= */
  /** Genera el HTML de un campo de texto. */
  ui.campo = function (opts) {
    var id = opts.id || U.uid('f');
    var req = opts.requerido ? ' required' : '';
    var val = opts.valor === null || opts.valor === undefined ? '' : opts.valor;
    var control;
    if (opts.tipo === 'textarea') {
      control = '<textarea class="textarea" id="' + id + '" name="' + (opts.name || id) + '"' + req +
        (opts.placeholder ? ' placeholder="' + U.escapeHtml(opts.placeholder) + '"' : '') + '>' + U.escapeHtml(val) + '</textarea>';
    } else if (opts.tipo === 'select') {
      control = '<select class="select" id="' + id + '" name="' + (opts.name || id) + '"' + req + '>' +
        (opts.opciones || []).map(function (o) {
          return '<option value="' + U.escapeHtml(o.value) + '"' + (String(o.value) === String(val) ? ' selected' : '') +
            (o.disabled ? ' disabled' : '') + '>' + U.escapeHtml(o.label) + '</option>';
        }).join('') + '</select>';
    } else {
      control = '<input class="input" type="' + (opts.tipo || 'text') + '" id="' + id + '" name="' + (opts.name || id) + '"' +
        ' value="' + U.escapeHtml(val) + '"' + req +
        (opts.paso ? ' step="' + opts.paso + '"' : '') +
        (opts.min !== undefined ? ' min="' + opts.min + '"' : '') +
        (opts.placeholder ? ' placeholder="' + U.escapeHtml(opts.placeholder) + '"' : '') + '>';
    }
    return '<div class="field' + (opts.span ? ' span-2' : '') + '" data-field="' + (opts.name || id) + '">' +
      '<label for="' + id + '">' + U.escapeHtml(opts.etiqueta || '') + (opts.requerido ? ' *' : '') + '</label>' +
      control +
      (opts.hint ? '<span class="hint">' + U.escapeHtml(opts.hint) + '</span>' : '') +
      '<span class="error" hidden></span>' +
      '</div>';
  };

  /** Muestra errores de validación en un formulario del modal. */
  ui.marcarErrores = function (scope, errores) {
    U.qsa('[data-field]', scope).forEach(function (f) {
      var name = f.getAttribute('data-field');
      var err = f.querySelector('.error');
      var ctrl = f.querySelector('input, select, textarea');
      if (errores && errores[name]) {
        if (err) { err.textContent = errores[name]; err.hidden = false; }
        if (ctrl) ctrl.setAttribute('aria-invalid', 'true');
      } else {
        if (err) { err.hidden = true; err.textContent = ''; }
        if (ctrl) ctrl.removeAttribute('aria-invalid');
      }
    });
    var primero = scope.querySelector('[aria-invalid="true"]');
    if (primero) primero.focus();
  };

  /** Lee los valores de un formulario como objeto. */
  ui.leerFormulario = function (form) {
    var data = {};
    U.qsa('input, select, textarea', form).forEach(function (el) {
      if (!el.name) return;
      data[el.name] = el.type === 'checkbox' ? el.checked : el.value;
    });
    return data;
  };

  /** Bloque de filtros. */
  ui.filtros = function (campos) {
    return '<div class="filters">' + campos.join('') + '</div>';
  };

  /** Cabecera de tarjeta con acciones. */
  ui.cardHead = function (titulo, extra, acciones) {
    return '<div class="card-head">' +
      '<div class="grow"><h3>' + U.escapeHtml(titulo) + '</h3>' +
      (extra ? '<p class="muted" style="font-size:12.5px">' + extra + '</p>' : '') + '</div>' +
      (acciones || '') + '</div>';
  };

  /** Cabecera de página con botones. */
  ui.pageHead = function (opts) {
    return '<div class="page-head">' +
      '<div class="grow"><h2>' + U.escapeHtml(opts.titulo) + '</h2>' +
      (opts.texto ? '<p>' + opts.texto + '</p>' : '') + '</div>' +
      '<div class="toolbar">' + (opts.acciones || '') + '</div>' +
      '</div>';
  };

  /** Botón de acción con icono. */
  ui.boton = function (opts) {
    return '<button type="button" class="btn ' + (opts.clase || 'btn-outline') + (opts.sm ? ' btn-sm' : '') +
      '" data-action="' + (opts.accion || '') + '" data-id="' + (opts.id || '') + '"' +
      (opts.title ? ' title="' + U.escapeHtml(opts.title) + '"' : '') + '>' +
      (opts.icono ? ui.icon(opts.icono) : '') +
      (opts.texto ? '<span>' + U.escapeHtml(opts.texto) + '</span>' : '') +
      '</button>';
  };

  /** Icono-botón compacto para acciones de tabla. */
  ui.accion = function (opts) {
    return '<button type="button" class="icon-btn is-sm ' + (opts.peligro ? 'is-danger' : '') +
      '" data-action="' + opts.accion + '" data-id="' + (opts.id || '') + '"' +
      ' title="' + U.escapeHtml(opts.title || '') + '" aria-label="' + U.escapeHtml(opts.title || '') + '">' +
      ui.icon(opts.icono) + '</button>';
  };

  /** Barra de progreso proporcional al stock respecto al mínimo. */
  ui.barraStock = function (producto) {
    var st = App.store.estadoStock(producto);
    var min = U.toNumber(producto.stockMinimo) || 0;
    var stock = U.toNumber(producto.stock);
    var objetivo = Math.max(min * 2, min + 1, 1);
    var pct = U.clamp(Math.round((stock / objetivo) * 100), 0, 100);
    var tono = st === 'ok' ? 'success' : st === 'bajo' ? 'warn' : 'danger';
    return '<div class="progress ' + tono + '" style="min-width:70px"><span style="width:' + pct + '%"></span></div>';
  };

  /** Copia texto al portapapeles con aviso. */
  ui.copiar = function (texto, mensaje) {
    var done = function () { ui.toast(mensaje || 'Copiado al portapapeles', 'info'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(done, function () { ui.toast('No se pudo copiar', 'error'); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = texto; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { ui.toast('No se pudo copiar', 'error'); }
      document.body.removeChild(ta);
    }
  };

  /** Aplica el tema y sincroniza el color de la barra del navegador/móvil. */
  ui.aplicarTema = function (tema) {
    tema = tema === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', tema);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', tema === 'dark' ? '#0f172b' : '#f4f6fb');
    return tema;
  };

  App.ui = ui;
})(window.Inventario);
