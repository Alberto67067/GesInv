/* =========================================================================
   views/movimientos.js · Registro y historial de entradas, salidas y ajustes
   ========================================================================= */
window.Inventario = window.Inventario || {};
(function (App) {
  'use strict';

  var U = App.utils;
  var ui = App.ui;
  App.views = App.views || {};

  var vista = { q: '', tipo: '', desde: '', hasta: '', pagina: 1, porPagina: 15 };

  function resetVista() {
    vista.q = ''; vista.tipo = ''; vista.desde = ''; vista.hasta = ''; vista.pagina = 1;
  }

  /* ------------------------------ Filtrado ------------------------------- */
  function filtrar() {
    var store = App.store;
    var q = U.normalize(vista.q);
    return store.listMovimientos().filter(function (m) {
      if (vista.tipo && m.tipo !== vista.tipo) return false;
      if (vista.desde && new Date(m.fecha) < new Date(vista.desde + 'T00:00:00')) return false;
      if (vista.hasta && new Date(m.fecha) > new Date(vista.hasta + 'T23:59:59')) return false;
      if (q) {
        var p = store.getProducto(m.productoId);
        var texto = U.normalize([m.motivo, m.referencia, m.usuario, p ? p.nombre : '', p ? p.sku : ''].join(' '));
        if (texto.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  /* -------------------------------- Render ------------------------------- */
  function render(cont) {
    var store = App.store;
    var todos = store.listMovimientos();
    var hoy = store.movimientosDelDia();

    cont.innerHTML =
      ui.pageHead({
        titulo: 'Movimientos',
        texto: U.num(todos.length) + ' registros históricos · ' + U.num(hoy.length) + ' hoy',
        acciones:
          '<button type="button" class="btn btn-outline" data-action="exportar">' + ui.icon('download') + '<span>Exportar CSV</span></button>' +
          '<button type="button" class="btn btn-primary" data-action="registrar">' + ui.icon('plus') + '<span>Registrar movimiento</span></button>'
      }) +

      /* Panel de registro rápido */
      '<section class="grid grid-3" style="margin-bottom:18px">' +
      tarjetaRapida('entrada', 'Registrar entrada', 'Compras, reposiciones y devoluciones', 'arrowDown', 'is-success') +
      tarjetaRapida('salida', 'Registrar salida', 'Ventas, consumo interno y despachos', 'arrowUp', 'is-danger') +
      tarjetaRapida('ajuste', 'Ajustar inventario', 'Conteo físico y correcciones', 'adjust', 'is-info') +
      '</section>' +

      '<section class="card">' +
      ui.cardHead('Historial de movimientos', 'Filtra por tipo, producto o rango de fechas') +
      '<div class="card-body" style="padding-bottom:14px">' +
      '<div class="filters">' +
      '<div class="field is-search"><label for="mq">Buscar</label>' +
      '<input class="input" id="mq" type="search" placeholder="Producto, SKU, motivo, referencia…" value="' + U.escapeHtml(vista.q) + '"></div>' +
      ui.campo({
        etiqueta: 'Tipo', name: 'mt', tipo: 'select', valor: vista.tipo, opciones: [
          { value: '', label: 'Todos' },
          { value: 'entrada', label: 'Entradas' },
          { value: 'salida', label: 'Salidas' },
          { value: 'ajuste', label: 'Ajustes' }
        ]
      }) +
      ui.campo({ etiqueta: 'Desde', name: 'md', tipo: 'date', valor: vista.desde }) +
      ui.campo({ etiqueta: 'Hasta', name: 'mh', tipo: 'date', valor: vista.hasta }) +
      '<button type="button" class="btn btn-outline" data-action="limpiar">' + ui.icon('refresh') + '<span>Limpiar</span></button>' +
      '</div></div>' +

      '<div class="table-wrap con-tabla-escritorio"><table class="tbl">' +
      '<thead><tr>' +
      '<th style="width:150px">Fecha</th>' +
      '<th style="width:110px">Tipo</th>' +
      '<th>Producto</th>' +
      '<th>Motivo</th>' +
      '<th>Referencia</th>' +
      '<th>Usuario</th>' +
      '<th class="num">Cantidad</th>' +
      '<th class="num">Antes</th>' +
      '<th class="num">Después</th>' +
      '<th style="width:60px"></th>' +
      '</tr></thead>' +
      '<tbody id="tbody"></tbody>' +
      '</table></div>' +
      '<div class="solo-movil-lista" id="listaMovil"></div>' +
      '<div class="card-foot"><div id="paginacion"></div></div>' +
      '</section>';

    pintar();
    montar(cont);
  }

  function tarjetaRapida(tipo, titulo, texto, icono, tono) {
    return '<button type="button" class="card" data-action="registrar" data-tipo="' + tipo + '" ' +
      'style="text-align:left;padding:18px;display:flex;gap:14px;align-items:center;cursor:pointer;border-color:var(--border)">' +
      '<span class="kpi-ico ' + tono + '" style="width:44px;height:44px;border-radius:12px">' + ui.icon(icono) + '</span>' +
      '<span class="grow"><span style="display:block;font-weight:650;font-size:14.5px">' + titulo + '</span>' +
      '<span class="muted" style="font-size:12.5px">' + texto + '</span></span>' +
      '<span class="muted">' + ui.icon('plus') + '</span>' +
      '</button>';
  }

  /* --------------------------- Tabla + paginación ------------------------ */
  function pintar() {
    var store = App.store;
    var tbody = document.getElementById('tbody');
    if (!tbody) return;

    var lista = filtrar();
    var totalPaginas = Math.max(1, Math.ceil(lista.length / vista.porPagina));
    if (vista.pagina > totalPaginas) vista.pagina = totalPaginas;
    var desde = (vista.pagina - 1) * vista.porPagina;
    var pagina = lista.slice(desde, desde + vista.porPagina);

    if (!lista.length) {
      tbody.innerHTML = '<tr><td colspan="10">' + ui.vacio({
        icono: 'clock',
        titulo: 'Sin movimientos',
        texto: 'No hay registros con los filtros actuales.',
        accion: '<button type="button" class="btn btn-primary" data-action="registrar">' + ui.icon('plus') + '<span>Registrar movimiento</span></button>'
      }) + '</td></tr>';
    } else {
      tbody.innerHTML = pagina.map(function (m) {
        var p = store.getProducto(m.productoId);
        var delta = m.delta !== undefined ? m.delta
          : (m.tipo === 'salida' ? -U.toNumber(m.cantidad) : U.toNumber(m.cantidad));
        var color = delta > 0 ? 'var(--success)' : delta < 0 ? 'var(--danger)' : 'var(--muted)';
        var signo = delta > 0 ? '+' : '';
        return '<tr>' +
          '<td><div style="font-size:13px">' + U.formatDate(m.fecha) + '</div>' +
          '<div class="cell-sub">' + U.formatTime(m.fecha) + ' · ' + U.relativeTime(m.fecha) + '</div></td>' +
          '<td>' + ui.tipoBadge(m.tipo) + '</td>' +
          '<td><div class="cell-main">' + U.escapeHtml(p ? p.nombre : 'Producto eliminado') + '</div>' +
          '<div class="cell-sub mono">' + U.escapeHtml(p ? p.sku : '—') + '</div></td>' +
          '<td><span style="font-size:13px">' + U.escapeHtml(m.motivo) + '</span></td>' +
          '<td class="mono">' + U.escapeHtml(m.referencia || '—') + '</td>' +
          '<td><span style="font-size:13px">' + U.escapeHtml(m.usuario || '—') + '</span></td>' +
          '<td class="num"><strong style="color:' + color + '">' + signo + U.num(delta) + '</strong></td>' +
          '<td class="num muted">' + (m.stockPrevio !== undefined ? U.num(m.stockPrevio) : '—') + '</td>' +
          '<td class="num">' + (m.stockResultante !== undefined ? U.num(m.stockResultante) : '—') + '</td>' +
          '<td>' + ui.accion({ accion: 'eliminar', id: m.id, icono: 'trash', title: 'Anular movimiento', peligro: true }) + '</td>' +
          '</tr>';
      }).join('');
    }

    var pag = document.getElementById('paginacion');
    if (pag) {
      pag.innerHTML = '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">' +
        '<span class="muted" style="font-size:12.5px">' +
        'Entradas: ' + U.num(U.sumBy(lista.filter(function (m) { return m.tipo === 'entrada'; }), function (m) { return m.cantidad; })) +
        ' · Salidas: ' + U.num(U.sumBy(lista.filter(function (m) { return m.tipo === 'salida'; }), function (m) { return m.cantidad; })) +
        ' · Ajustes: ' + lista.filter(function (m) { return m.tipo === 'ajuste'; }).length +
        '</span>' +
        '<div class="field" style="display:flex;align-items:center;gap:8px;margin-left:auto">' +
        '<span class="muted" style="font-size:12.5px">Por página</span>' +
        '<select class="select" id="porPagina" style="width:auto;padding:5px 30px 5px 10px">' +
        [15, 25, 50, 100].map(function (n) {
          return '<option value="' + n + '"' + (n === vista.porPagina ? ' selected' : '') + '>' + n + '</option>';
        }).join('') + '</select></div>' +
        ui.paginacion({ total: lista.length, pagina: vista.pagina, porPagina: vista.porPagina }) +
        '</div>';
    }

    pintarListaMovil(lista, pagina);
  }

  /** Vista de tarjetas para móvil. */
  function pintarListaMovil(lista, pagina) {
    var host = document.getElementById('listaMovil');
    if (!host) return;
    var store = App.store;

    if (!lista.length) {
      host.innerHTML = ui.vacio({
        icono: 'clock',
        titulo: 'Sin movimientos',
        texto: 'No hay registros con los filtros actuales.',
        accion: '<button type="button" class="btn btn-primary" data-action="registrar">' + ui.icon('plus') + '<span>Registrar movimiento</span></button>'
      });
      return;
    }

    host.innerHTML = pagina.map(function (m) {
      var p = store.getProducto(m.productoId);
      var delta = m.delta !== undefined ? m.delta
        : (m.tipo === 'salida' ? -U.toNumber(m.cantidad) : U.toNumber(m.cantidad));
      var color = delta > 0 ? 'var(--success)' : delta < 0 ? 'var(--danger)' : 'var(--muted)';
      var signo = delta > 0 ? '+' : '';
      return '<article class="ficha-card">' +
        '<div class="ficha-card-top">' +
        '<div class="grow">' +
        '<h4>' + U.escapeHtml(p ? p.nombre : 'Producto eliminado') + '</h4>' +
        '<p class="sub mono">' + U.escapeHtml(p ? p.sku : '—') + '</p>' +
        '</div>' +
        ui.tipoBadge(m.tipo) +
        '</div>' +

        '<div style="display:flex;align-items:baseline;gap:10px;margin-bottom:10px">' +
        '<span class="mono" style="font-size:22px;font-weight:700;color:' + color + '">' + signo + U.num(delta) + '</span>' +
        '<span class="muted" style="font-size:12.5px">' + U.escapeHtml(p ? p.unidad : '') +
        (m.stockPrevio !== undefined ? ' · ' + U.num(m.stockPrevio) + ' → ' + U.num(m.stockResultante) : '') + '</span>' +
        '</div>' +

        '<div class="ficha-datos">' +
        '<div class="ficha-dato" style="grid-column:1/-1"><span>Motivo</span><span>' + U.escapeHtml(m.motivo) + '</span></div>' +
        '<div class="ficha-dato" style="grid-column:1/-1"><span>Fecha</span><span>' + U.formatDateTime(m.fecha) + '</span></div>' +
        '<div class="ficha-dato"><span>Referencia</span><span class="mono">' + U.escapeHtml(m.referencia || '—') + '</span></div>' +
        '<div class="ficha-dato"><span>Responsable</span><span>' + U.escapeHtml(m.usuario || '—') + '</span></div>' +
        '</div>' +

        '<div class="ficha-acciones">' +
        ui.boton({ accion: 'eliminar', id: m.id, icono: 'trash', texto: 'Anular movimiento', clase: 'btn-outline', sm: true }) +
        '</div>' +
        '</article>';
    }).join('');
  }

  /* -------------------------------- Eventos ------------------------------ */
  function montar(cont) {
    var debounced = U.debounce(function () { vista.pagina = 1; pintar(); }, 200);

    cont.addEventListener('input', function (e) {
      if (e.target.id === 'mq') { vista.q = e.target.value; debounced(); }
      if (e.target.id === 'porPagina') { vista.porPagina = parseInt(e.target.value, 10) || 15; vista.pagina = 1; pintar(); }
    });

    cont.addEventListener('change', function (e) {
      if (e.target.name === 'mt') { vista.tipo = e.target.value; vista.pagina = 1; pintar(); }
      if (e.target.name === 'md') { vista.desde = e.target.value; vista.pagina = 1; pintar(); }
      if (e.target.name === 'mh') { vista.hasta = e.target.value; vista.pagina = 1; pintar(); }
    });

    cont.addEventListener('click', function (e) {
      var pageBtn = e.target.closest('[data-page]');
      if (pageBtn && !pageBtn.disabled) {
        vista.pagina = parseInt(pageBtn.getAttribute('data-page'), 10) || 1;
        pintar();
        return;
      }
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var accion = btn.getAttribute('data-action');
      if (accion === 'registrar') abrirRegistro({ tipo: btn.getAttribute('data-tipo') || 'entrada' });
      else if (accion === 'limpiar') { resetVista(); App.router.refrescar(); }
      else if (accion === 'exportar') exportar();
      else if (accion === 'eliminar') anular(btn.getAttribute('data-id'));
    });
  }

  /* --------------------------- Modal de registro ------------------------- */
  /**
   * @param {{productoId?:string, tipo?:'entrada'|'salida'|'ajuste'}} opts
   */
  function abrirRegistro(opts) {
    opts = opts || {};
    var store = App.store;
    var productos = store.listProductos().filter(function (p) { return p.activo !== false; });

    if (!productos.length) {
      ui.toast('No hay productos activos', 'warn', 'Crea un producto antes de registrar movimientos.');
      return;
    }

    var tipoInicial = opts.tipo || 'entrada';
    var prodInicial = opts.productoId || '';

    var cuerpo = '<form id="formMov" class="stack" novalidate>' +
      /* Selector de tipo */
      '<div class="field"><label>Tipo de movimiento</label>' +
      '<div class="segmented" style="width:100%;display:grid;grid-template-columns:repeat(3,1fr)" data-tipo-mov>' +
      '<button type="button" data-t="entrada" class="' + (tipoInicial === 'entrada' ? 'is-active' : '') + '">' + ui.icon('arrowDown') + ' Entrada</button>' +
      '<button type="button" data-t="salida" class="' + (tipoInicial === 'salida' ? 'is-active' : '') + '">' + ui.icon('arrowUp') + ' Salida</button>' +
      '<button type="button" data-t="ajuste" class="' + (tipoInicial === 'ajuste' ? 'is-active' : '') + '">' + ui.icon('adjust') + ' Ajuste</button>' +
      '</div></div>' +

      '<div class="form-grid">' +
      ui.campo({
        etiqueta: 'Producto', name: 'productoId', tipo: 'select', valor: prodInicial, requerido: true, span: true,
        opciones: [{ value: '', label: '— Selecciona un producto —' }].concat(
          productos.map(function (p) {
            return { value: p.id, label: p.sku + ' · ' + p.nombre + ' (stock ' + p.stock + ')' };
          })
        )
      }) +
      ui.campo({ etiqueta: 'Cantidad', name: 'cantidad', tipo: 'number', paso: '1', min: 0, valor: 1, requerido: true }) +
      ui.campo({
        etiqueta: 'Motivo', name: 'motivo', tipo: 'select', valor: '',
        opciones: [{ value: '', label: '— Selecciona o escribe —' }]
      }) +
      ui.campo({ etiqueta: 'Referencia / documento', name: 'referencia', valor: '', placeholder: 'FAC-00123, OC-45…' }) +
      ui.campo({ etiqueta: 'Responsable', name: 'usuario', valor: 'Administrador' }) +
      '</div>' +

      '<div id="infoProducto"></div>' +
      '<div id="avisoMov"></div>' +
      '</form>';

    var m = ui.modal({
      titulo: 'Registrar movimiento',
      subtitulo: 'Actualiza el stock y deja constancia en el historial',
      tamano: 'lg',
      cuerpo: cuerpo,
      pie: '<button type="button" class="btn btn-outline" data-close>Cancelar</button>' +
        '<button type="submit" form="formMov" class="btn btn-primary" id="btnGuardarMov">Registrar</button>'
    });

    var form = m.cuerpo.querySelector('#formMov');
    var tipo = tipoInicial;
    var selProducto = form.querySelector('[name="productoId"]');
    var inputCantidad = form.querySelector('[name="cantidad"]');
    var selMotivo = form.querySelector('[name="motivo"]');
    var info = form.querySelector('#infoProducto');
    var aviso = form.querySelector('#avisoMov');
    var etiquetaCantidad = form.querySelector('[name="cantidad"]').closest('.field').querySelector('label');
    etiquetaCantidad.textContent = tipoInicial === 'ajuste' ? 'Stock real contado *' : 'Cantidad *';

    var MOTIVOS = {
      entrada: ['Compra a proveedor', 'Reposición de stock', 'Devolución de cliente', 'Transferencia entre almacenes', 'Stock inicial'],
      salida: ['Venta mostrador', 'Venta online', 'Consumo interno', 'Pedido corporativo', 'Merma o pérdida'],
      ajuste: ['Conteo físico de inventario', 'Corrección de error', 'Producto dañado', 'Vencimiento']
    };

    function refrescarMotivos() {
      selMotivo.innerHTML = [{ value: '', label: '— Selecciona o escribe —' }].concat(
        MOTIVOS[tipo].map(function (x) { return { value: x, label: x }; })
      ).map(function (o) {
        return '<option value="' + U.escapeHtml(o.value) + '">' + U.escapeHtml(o.label) + '</option>';
      }).join('');
    }

    function refrescarInfo() {
      var p = store.getProducto(selProducto.value);
      if (!p) {
        info.innerHTML = '<div class="note">' + ui.icon('info') + '<div>Selecciona un producto para ver su stock disponible y validar la operación.</div></div>';
        aviso.innerHTML = '';
        return;
      }
      var st = store.estadoStock(p);
      info.innerHTML = '<div class="grid grid-3" style="gap:12px">' +
        ui.kpi({ etiqueta: 'Stock actual', icono: 'box', valor: U.num(p.stock), sub: p.unidad }) +
        ui.kpi({ etiqueta: 'Stock mínimo', icono: 'alert', tono: 'is-warn', valor: U.num(p.stockMinimo), sub: 'alerta de reposición' }) +
        ui.kpi({
          etiqueta: 'Estado', icono: 'shield', tono: st === 'ok' ? 'is-success' : 'is-danger',
          valor: store.ETIQUETA_ESTADO[st], sub: 'ubic. ' + (U.escapeHtml(p.ubicacion) || '—')
        }) +
        '</div>';
      validar();
    }

    function validar() {
      var p = store.getProducto(selProducto.value);
      if (!p) { aviso.innerHTML = ''; return true; }
      var cant = U.toNumber(inputCantidad.value);
      if (tipo === 'salida' && cant > U.toNumber(p.stock)) {
        aviso.innerHTML = '<div class="note warn">' + ui.icon('alert') + '<div><strong>Stock insuficiente.</strong> Disponible: ' +
          U.num(p.stock) + ' ' + p.unidad + '. Puedes reducir la cantidad o registrar una entrada primero.</div></div>';
        return false;
      }
      if (tipo === 'ajuste') {
        var dif = cant - U.toNumber(p.stock);
        aviso.innerHTML = '<div class="note">' + ui.icon('info') + '<div>El stock pasará de <strong>' + U.num(p.stock) +
          '</strong> a <strong>' + U.num(cant) + '</strong> (' + (dif >= 0 ? '+' : '') + U.num(dif) + ' ' + p.unidad + ').</div></div>';
        return true;
      }
      aviso.innerHTML = '<div class="note">' + ui.icon('info') + '<div>Nuevo stock: <strong>' +
        U.num(U.toNumber(p.stock) + (tipo === 'entrada' ? cant : -cant)) + ' ' + p.unidad + '</strong></div></div>';
      return true;
    }

    refrescarMotivos();
    refrescarInfo();

    form.addEventListener('change', function (e) {
      if (e.target === selProducto) refrescarInfo();
      if (e.target === inputCantidad) validar();
    });
    form.addEventListener('input', function (e) {
      if (e.target === inputCantidad) validar();
    });

    form.querySelector('[data-tipo-mov]').addEventListener('click', function (e) {
      var b = e.target.closest('[data-t]');
      if (!b) return;
      tipo = b.getAttribute('data-t');
      U.qsa('[data-tipo-mov] button', form).forEach(function (x) { x.classList.remove('is-active'); });
      b.classList.add('is-active');
      etiquetaCantidad.textContent = tipo === 'ajuste' ? 'Stock real contado *' : 'Cantidad *';
      refrescarMotivos();
      refrescarInfo();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = ui.leerFormulario(form);
      if (!d.productoId) { ui.toast('Selecciona un producto', 'warn'); return; }
      if (tipo === 'salida' && !validar()) { ui.toast('Stock insuficiente', 'error', 'Reduce la cantidad o registra una entrada.'); return; }
      try {
        var r = store.registrarMovimiento({
          productoId: d.productoId, tipo: tipo, cantidad: d.cantidad,
          motivo: d.motivo, referencia: d.referencia, usuario: d.usuario
        });
        m.cerrar();
        var etiqueta = tipo === 'entrada' ? 'Entrada registrada' : tipo === 'salida' ? 'Salida registrada' : 'Ajuste aplicado';
        ui.toast(etiqueta, 'success', r.producto.nombre + ' · nuevo stock ' + U.num(r.producto.stock) + ' ' + r.producto.unidad);
        App.router.refrescar();
      } catch (err) {
        ui.toast(err.message, 'error');
      }
    });
  }

  /* -------------------------------- Anular ------------------------------- */
  function anular(id) {
    var m = App.store.listMovimientos().filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    var p = App.store.getProducto(m.productoId);
    ui.confirmar({
      titulo: 'Anular movimiento',
      mensaje: 'Se eliminará el registro del historial y se revertirá su efecto sobre el stock.',
      detalle: (p ? '<strong>' + U.escapeHtml(p.nombre) + '</strong><br>' : '') +
        'Tipo: ' + m.tipo + ' · Cantidad: ' + U.num(m.cantidad) + ' · ' + U.formatDateTime(m.fecha),
      confirmar: 'Anular movimiento',
      peligro: true
    }).then(function (ok) {
      if (!ok) return;
      try {
        App.store.eliminarMovimiento(id);
        ui.toast('Movimiento anulado', 'success');
        App.router.refrescar();
      } catch (err) { ui.toast(err.message, 'error'); }
    });
  }

  /* ------------------------------- Exportar ------------------------------ */
  function exportar() {
    var lista = filtrar();
    if (!lista.length) { ui.toast('Nada que exportar', 'warn'); return; }
    var store = App.store;
    var filas = [['Fecha', 'Tipo', 'SKU', 'Producto', 'Cantidad', 'Stock antes', 'Stock después', 'Motivo', 'Referencia', 'Responsable']];
    lista.forEach(function (m) {
      var p = store.getProducto(m.productoId);
      filas.push([
        U.formatDateTime(m.fecha), m.tipo, p ? p.sku : '', p ? p.nombre : 'Producto eliminado',
        m.cantidad, m.stockPrevio === undefined ? '' : m.stockPrevio,
        m.stockResultante === undefined ? '' : m.stockResultante,
        m.motivo, m.referencia, m.usuario
      ]);
    });
    U.download('movimientos-' + U.dateKey(new Date().toISOString()) + '.csv', '\uFEFF' + U.toCSV(filas), 'text/csv');
    ui.toast('Exportación lista', 'success', (filas.length - 1) + ' movimiento(s).');
  }

  App.views.movimientos = {
    titulo: 'Movimientos',
    subtitulo: 'Entradas, salidas y ajustes de inventario',
    render: render,
    abrirRegistro: abrirRegistro,
    resetVista: resetVista
  };
})(window.Inventario);
