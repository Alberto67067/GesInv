/* =========================================================================
   views/productos.js · Catálogo de productos: filtros, orden, CRUD y export
   ========================================================================= */
window.Inventario = window.Inventario || {};
(function (App) {
  'use strict';

  var U = App.utils;
  var ui = App.ui;
  App.views = App.views || {};

  var UNIDADES = ['unidad', 'caja', 'paquete', 'kg', 'litro', 'metro', 'rollo', 'par'];

  /* Estado de la vista (se conserva entre re-renderizados) */
  var vista = {
    q: '',
    categoria: '',
    proveedor: '',
    estado: '',
    orden: 'nombre',
    dir: 'asc',
    pagina: 1,
    porPagina: 10,
    seleccion: {}
  };

  function resetVista() {
    vista.q = ''; vista.categoria = ''; vista.proveedor = ''; vista.estado = '';
    vista.orden = 'nombre'; vista.dir = 'asc'; vista.pagina = 1; vista.seleccion = {};
  }

  /* ------------------------------ Filtrado ------------------------------- */
  function filtrar() {
    var store = App.store;
    var q = U.normalize(vista.q);
    var lista = store.listProductos().filter(function (p) {
      if (vista.categoria && p.categoriaId !== vista.categoria) return false;
      if (vista.proveedor && p.proveedorId !== vista.proveedor) return false;
      if (vista.estado) {
        var st = store.estadoStock(p);
        if (vista.estado === 'bajo') { if (st === 'ok') return false; }
        else if (vista.estado === 'inactivo') { if (p.activo !== false) return false; }
        else if (st !== vista.estado) return false;
      }
      if (q) {
        var texto = U.normalize([p.nombre, p.sku, p.ubicacion, p.descripcion, store.nombreCategoria(p.categoriaId)].join(' '));
        if (texto.indexOf(q) === -1) return false;
      }
      return true;
    });

    var claves = {
      nombre: function (p) { return U.normalize(p.nombre); },
      sku: function (p) { return U.normalize(p.sku); },
      categoria: function (p) { return U.normalize(store.nombreCategoria(p.categoriaId)); },
      stock: function (p) { return U.toNumber(p.stock); },
      precioVenta: function (p) { return U.toNumber(p.precioVenta); },
      valor: function (p) { return U.toNumber(p.stock) * U.toNumber(p.precioCompra); }
    };
    return U.sortBy(lista, claves[vista.orden] || claves.nombre, vista.dir);
  }

  /* ------------------------------ Render --------------------------------- */
  function render(cont, params) {
    if (params && params.estado) vista.estado = params.estado;
    if (params && params.categoria) vista.categoria = params.categoria;
    if (params && params.proveedor) vista.proveedor = params.proveedor;
    if (params && params.q !== undefined) vista.q = params.q;

    var store = App.store;
    var productos = store.listProductos();
    var total = store.valorInventario(productos);
    var unidades = store.unidadesTotales(productos);
    var bajo = store.productosBajoStock().length;

    var opcionesCat = [{ value: '', label: 'Todas las categorías' }].concat(
      store.listCategorias().map(function (c) { return { value: c.id, label: c.nombre }; })
    );
    var opcionesProv = [{ value: '', label: 'Todos los proveedores' }].concat(
      store.listProveedores().map(function (p) { return { value: p.id, label: p.nombre }; })
    );
    var opcionesEstado = [
      { value: '', label: 'Cualquier estado' },
      { value: 'ok', label: 'Disponible' },
      { value: 'bajo', label: 'Stock bajo' },
      { value: 'critico', label: 'Crítico' },
      { value: 'agotado', label: 'Agotado' },
      { value: 'inactivo', label: 'Inactivos' }
    ];

    cont.innerHTML =
      ui.pageHead({
        titulo: 'Productos',
        texto: U.num(productos.length) + ' registros · ' + U.num(unidades) + ' unidades · valor ' + U.money(total) +
          (bajo ? ' · <span style="color:var(--warn);font-weight:600">' + bajo + ' con stock bajo</span>' : ''),
        acciones:
          '<button type="button" class="btn btn-outline" data-action="exportar">' + ui.icon('download') + '<span>CSV</span></button>' +
          '<button type="button" class="btn btn-outline" data-action="importar">' + ui.icon('upload') + '<span>Importar</span></button>' +
          '<button type="button" class="btn btn-primary" data-action="nuevo">' + ui.icon('plus') + '<span>Nuevo producto</span></button>'
      }) +

      '<section class="card">' +
      '<div class="card-body" style="padding-bottom:14px">' +
      '<div class="filters">' +
      '<div class="field is-search"><label for="fq">Buscar</label>' +
      '<input class="input" id="fq" type="search" placeholder="Nombre, SKU, ubicación…" value="' + U.escapeHtml(vista.q) + '"></div>' +
      ui.campo({ etiqueta: 'Categoría', tipo: 'select', valor: vista.categoria, opciones: opcionesCat, name: 'fc' }) +
      ui.campo({ etiqueta: 'Proveedor', tipo: 'select', valor: vista.proveedor, opciones: opcionesProv, name: 'fp' }) +
      ui.campo({ etiqueta: 'Estado', tipo: 'select', valor: vista.estado, opciones: opcionesEstado, name: 'fe' }) +
      ui.campo({
        etiqueta: 'Ordenar por', tipo: 'select', valor: vista.orden, name: 'fo', opciones: [
          { value: 'nombre', label: 'Nombre' },
          { value: 'sku', label: 'SKU' },
          { value: 'categoria', label: 'Categoría' },
          { value: 'stock', label: 'Stock' },
          { value: 'precioVenta', label: 'Precio venta' },
          { value: 'valor', label: 'Valor en inventario' }
        ]
      }) +
      '<button type="button" class="btn btn-outline" data-action="limpiar">' + ui.icon('refresh') + '<span>Limpiar</span></button>' +
      '</div>' +

      '<div id="barraSeleccion" class="note" style="margin-top:14px" hidden>' +
      ui.icon('check') +
      '<div class="grow" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span id="textoSeleccion" style="font-weight:600"></span>' +
      '<button type="button" class="btn btn-sm btn-outline" data-action="exportar-sel">Exportar</button>' +
      '<button type="button" class="btn btn-sm btn-outline" data-action="desactivar-sel">Activar / desactivar</button>' +
      '<button type="button" class="btn btn-sm btn-danger" data-action="eliminar-sel">Eliminar</button>' +
      '<button type="button" class="btn btn-sm btn-ghost" data-action="quitar-sel">Cancelar</button>' +
      '</div></div>' +
      '</div>' +

      '<div class="table-wrap con-tabla-escritorio"><table class="tbl">' +
      '<thead><tr>' +
      '<th style="width:34px" class="center"><input type="checkbox" id="chkTodos" aria-label="Seleccionar todo"></th>' +
      th('sku', 'SKU') + th('nombre', 'Producto') + th('categoria', 'Categoría') +
      '<th>Proveedor</th>' +
      th('stock', 'Stock', 'num') + '<th style="width:110px">Nivel</th>' +
      th('precioVenta', 'P. venta', 'num') + th('valor', 'Valor', 'num') +
      '<th class="center">Estado</th><th style="width:120px"></th>' +
      '</tr></thead>' +
      '<tbody id="tbody"></tbody>' +
      '</table></div>' +

      /* Vista de tarjetas: se muestra en su lugar en pantallas pequeñas */
      '<div class="solo-movil-lista" id="listaMovil"></div>' +

      '<div class="card-foot"><div id="paginacion"></div></div>' +
      '</section>';

    pintarTabla();
    montar(cont);
  }

  function th(clave, texto, cls) {
    var activo = vista.orden === clave;
    var ind = activo ? (vista.dir === 'asc' ? '▲' : '▼') : '';
    return '<th class="sortable ' + (cls || '') + '" data-orden="' + clave + '">' + texto +
      '<span class="sort-ind">' + ind + '</span></th>';
  }

  /* --------------------------- Tabla + paginación ------------------------ */
  function pintarTabla() {
    var store = App.store;
    var tbody = document.getElementById('tbody');
    if (!tbody) return;

    var lista = filtrar();
    var totalPaginas = Math.max(1, Math.ceil(lista.length / vista.porPagina));
    if (vista.pagina > totalPaginas) vista.pagina = totalPaginas;
    var desde = (vista.pagina - 1) * vista.porPagina;
    var pagina = lista.slice(desde, desde + vista.porPagina);

    if (!lista.length) {
      tbody.innerHTML = '<tr><td colspan="11">' + ui.vacio({
        icono: 'search',
        titulo: 'Sin productos que coincidan',
        texto: 'Ajusta los filtros de búsqueda o registra un producto nuevo.',
        accion: '<button type="button" class="btn btn-primary" data-action="nuevo">' + ui.icon('plus') + '<span>Nuevo producto</span></button>'
      }) + '</td></tr>';
    } else {
      tbody.innerHTML = pagina.map(function (p) {
        var valor = U.toNumber(p.stock) * U.toNumber(p.precioCompra);
        var sel = !!vista.seleccion[p.id];
        var inactivo = p.activo === false;
        return '<tr data-id="' + p.id + '" class="' + (sel ? 'is-selected' : '') + '">' +
          '<td class="center"><input type="checkbox" data-chk="' + p.id + '"' + (sel ? ' checked' : '') + ' aria-label="Seleccionar"></td>' +
          '<td class="mono">' + U.escapeHtml(p.sku) + '</td>' +
          '<td><div class="cell-main">' + U.escapeHtml(p.nombre) + (inactivo ? ' <span class="badge no-dot">Inactivo</span>' : '') + '</div>' +
          '<div class="cell-sub">' + (p.ubicacion ? 'Ubic. ' + U.escapeHtml(p.ubicacion) : 'Sin ubicación') + '</div></td>' +
          '<td><span class="chip">' + U.escapeHtml(store.nombreCategoria(p.categoriaId)) + '</span></td>' +
          '<td><div class="cell-sub">' + U.escapeHtml(store.nombreProveedor(p.proveedorId)) + '</div></td>' +
          '<td class="num"><strong>' + U.num(p.stock) + '</strong> <span class="cell-sub">' + U.escapeHtml(p.unidad) + '</span></td>' +
          '<td>' + ui.barraStock(p) + '</td>' +
          '<td class="num">' + U.money(p.precioVenta) + '</td>' +
          '<td class="num">' + U.money(valor) + '</td>' +
          '<td class="center">' + ui.estadoBadge(p) + '</td>' +
          '<td><div class="actions">' +
          ui.accion({ accion: 'entrada', id: p.id, icono: 'arrowDown', title: 'Registrar entrada' }) +
          ui.accion({ accion: 'salida', id: p.id, icono: 'arrowUp', title: 'Registrar salida' }) +
          ui.accion({ accion: 'editar', id: p.id, icono: 'edit', title: 'Editar producto' }) +
          ui.accion({ accion: 'mas', id: p.id, icono: 'adjust', title: 'Más acciones' }) +
          '</div></td>' +
          '</tr>';
      }).join('');
    }

    var pag = document.getElementById('paginacion');
    if (pag) {
      pag.innerHTML = '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">' +
        '<label class="checkbox"><input type="checkbox" id="chkTodos2"' + (pagina.length && pagina.every(function (p) { return vista.seleccion[p.id]; }) ? ' checked' : '') + '> Seleccionar página</label>' +
        '<div class="field" style="display:flex;align-items:center;gap:8px;margin-left:auto">' +
        '<span class="muted" style="font-size:12.5px">Por página</span>' +
        '<select class="select" id="porPagina" style="width:auto;padding:5px 30px 5px 10px">' +
        [10, 25, 50, 100].map(function (n) {
          return '<option value="' + n + '"' + (n === vista.porPagina ? ' selected' : '') + '>' + n + '</option>';
        }).join('') + '</select></div>' +
        ui.paginacion({ total: lista.length, pagina: vista.pagina, porPagina: vista.porPagina }) +
        '</div>';
    }

    pintarListaMovil(lista, pagina);
    actualizarBarraSeleccion();
  }

  /** Vista de tarjetas para móvil: misma información, sin scroll horizontal. */
  function pintarListaMovil(lista, pagina) {
    var host = document.getElementById('listaMovil');
    if (!host) return;
    var store = App.store;

    if (!lista.length) {
      host.innerHTML = ui.vacio({
        icono: 'search',
        titulo: 'Sin productos que coincidan',
        texto: 'Ajusta los filtros o registra un producto nuevo.',
        accion: '<button type="button" class="btn btn-primary" data-action="nuevo">' + ui.icon('plus') + '<span>Nuevo producto</span></button>'
      });
      return;
    }

    host.innerHTML = pagina.map(function (p) {
      var valor = U.toNumber(p.stock) * U.toNumber(p.precioCompra);
      var sel = !!vista.seleccion[p.id];
      var st = store.estadoStock(p);
      var tono = st === 'ok' ? 'var(--success)' : st === 'bajo' ? 'var(--warn)' : 'var(--danger)';
      return '<article class="ficha-card' + (sel ? ' is-selected' : '') + '" style="' + (sel ? 'border-color:var(--accent);background:var(--accent-soft)' : '') + '">' +
        '<div class="ficha-card-top">' +
        '<label class="checkbox" style="margin-top:2px"><input type="checkbox" data-chk="' + p.id + '"' + (sel ? ' checked' : '') + ' aria-label="Seleccionar"></label>' +
        '<div class="grow">' +
        '<h4>' + U.escapeHtml(p.nombre) + '</h4>' +
        '<p class="sub mono">' + U.escapeHtml(p.sku) + ' · ' + U.escapeHtml(store.nombreCategoria(p.categoriaId)) + '</p>' +
        '</div>' +
        '<span class="badge ' + (st === 'ok' ? 'success' : st === 'bajo' ? 'warn' : 'danger') + '">' + store.ETIQUETA_ESTADO[st] + '</span>' +
        '</div>' +

        '<div class="ficha-datos">' +
        '<div class="ficha-dato"><span>Stock</span><span class="mono" style="color:' + tono + '">' + U.num(p.stock) + ' ' + U.escapeHtml(p.unidad) + '</span></div>' +
        '<div class="ficha-dato"><span>Mínimo</span><span class="mono">' + U.num(p.stockMinimo) + '</span></div>' +
        '<div class="ficha-dato"><span>P. venta</span><span class="mono">' + U.money(p.precioVenta) + '</span></div>' +
        '<div class="ficha-dato"><span>Valor</span><span class="mono">' + U.money(valor) + '</span></div>' +
        '<div class="ficha-dato" style="grid-column:1/-1"><span>Proveedor</span><span>' + U.escapeHtml(store.nombreProveedor(p.proveedorId)) + '</span></div>' +
        (p.ubicacion ? '<div class="ficha-dato" style="grid-column:1/-1"><span>Ubicación</span><span class="mono">' + U.escapeHtml(p.ubicacion) + '</span></div>' : '') +
        '</div>' +

        '<div style="margin-bottom:10px">' + ui.barraStock(p) + '</div>' +

        '<div class="ficha-acciones">' +
        ui.boton({ accion: 'entrada', id: p.id, icono: 'arrowDown', texto: 'Entrada', clase: 'btn-outline', sm: true }) +
        ui.boton({ accion: 'salida', id: p.id, icono: 'arrowUp', texto: 'Salida', clase: 'btn-outline', sm: true }) +
        ui.boton({ accion: 'editar', id: p.id, icono: 'edit', texto: 'Editar', clase: 'btn-outline', sm: true }) +
        ui.boton({ accion: 'mas', id: p.id, icono: 'adjust', clase: 'btn-ghost', sm: true, title: 'Más acciones' }) +
        '</div>' +
        '</article>';
    }).join('');
  }

  function actualizarBarraSeleccion() {
    var ids = Object.keys(vista.seleccion).filter(function (k) { return vista.seleccion[k]; });
    var barra = document.getElementById('barraSeleccion');
    var texto = document.getElementById('textoSeleccion');
    if (!barra) return;
    barra.hidden = ids.length === 0;
    if (ids.length) {
      var valor = U.sumBy(ids, function (id) {
        var p = App.store.getProducto(id);
        return p ? U.toNumber(p.stock) * U.toNumber(p.precioCompra) : 0;
      });
      texto.textContent = ids.length + ' seleccionado(s) · ' + U.money(valor);
    }
  }

  /* ------------------------------ Eventos -------------------------------- */
  function montar(cont) {
    var debounced = U.debounce(function () { vista.pagina = 1; pintarTabla(); }, 200);

    cont.addEventListener('input', function (e) {
      if (e.target.id === 'fq') { vista.q = e.target.value; debounced(); return; }
      if (e.target.id === 'porPagina') { vista.porPagina = parseInt(e.target.value, 10) || 10; vista.pagina = 1; pintarTabla(); return; }
      if (e.target.matches('[data-chk]')) {
        var id = e.target.getAttribute('data-chk');
        vista.seleccion[id] = e.target.checked;
        pintarTabla();
      }
    });

    cont.addEventListener('change', function (e) {
      if (e.target.id === 'chkTodos' || e.target.id === 'chkTodos2') {
        var lista = filtrar();
        var desde = (vista.pagina - 1) * vista.porPagina;
        var pagina = e.target.id === 'chkTodos2' ? lista.slice(desde, desde + vista.porPagina) : lista;
        pagina.forEach(function (p) { vista.seleccion[p.id] = e.target.checked; });
        pintarTabla();
        return;
      }
      var name = e.target.name;
      if (name === 'fc') { vista.categoria = e.target.value; vista.pagina = 1; pintarTabla(); }
      if (name === 'fp') { vista.proveedor = e.target.value; vista.pagina = 1; pintarTabla(); }
      if (name === 'fe') { vista.estado = e.target.value; vista.pagina = 1; pintarTabla(); }
      if (name === 'fo') { vista.orden = e.target.value; pintarTabla(); }
    });

    cont.addEventListener('click', function (e) {
      var ordenTh = e.target.closest('[data-orden]');
      if (ordenTh) {
        var clave = ordenTh.getAttribute('data-orden');
        if (vista.orden === clave) vista.dir = vista.dir === 'asc' ? 'desc' : 'asc';
        else { vista.orden = clave; vista.dir = clave === 'nombre' || clave === 'sku' || clave === 'categoria' ? 'asc' : 'desc'; }
        cont.querySelectorAll('[data-orden]').forEach(function (el) { el.classList.remove('is-sorted'); });
        pintarTabla();
        /* Refrescamos los indicadores de orden sin perder el foco. */
        var cabecera = cont.querySelector('thead');
        if (cabecera) {
          var ths = U.qsa('th[data-orden]', cabecera);
          ths.forEach(function (el) {
            var ind = el.querySelector('.sort-ind');
            if (!ind) return;
            ind.textContent = el.getAttribute('data-orden') === vista.orden ? (vista.dir === 'asc' ? '▲' : '▼') : '';
          });
        }
        return;
      }

      var pageBtn = e.target.closest('[data-page]');
      if (pageBtn && !pageBtn.disabled) {
        vista.pagina = U.clamp(parseInt(pageBtn.getAttribute('data-page'), 10) || 1, 1, 1e6);
        pintarTabla();
        cont.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var accion = btn.getAttribute('data-action');
      var id = btn.getAttribute('data-id');

      if (accion === 'nuevo') abrirFormulario();
      else if (accion === 'editar') abrirFormulario(id);
      else if (accion === 'entrada') App.views.movimientos.abrirRegistro({ productoId: id, tipo: 'entrada' });
      else if (accion === 'salida') App.views.movimientos.abrirRegistro({ productoId: id, tipo: 'salida' });
      else if (accion === 'mas') menuAcciones(id, btn);
      else if (accion === 'limpiar') { resetVista(); App.router.refrescar(); }
      else if (accion === 'exportar') exportarCSV(filtrar(), 'productos');
      else if (accion === 'exportar-sel') exportarCSV(idsSeleccionados(), 'productos-seleccion');
      else if (accion === 'quitar-sel') { vista.seleccion = {}; pintarTabla(); }
      else if (accion === 'eliminar-sel') eliminarSeleccion();
      else if (accion === 'desactivar-sel') alternarSeleccion();
      else if (accion === 'importar') abrirImportar();
    });
  }

  function idsSeleccionados() {
    return Object.keys(vista.seleccion).filter(function (k) { return vista.seleccion[k]; });
  }

  /* --------------------------- Menú de acciones -------------------------- */
  function menuAcciones(id, boton) {
    var p = App.store.getProducto(id);
    if (!p) return;
    var existente = document.querySelector('.menu-panel');
    if (existente) existente.remove();

    var panel = U.el(
      '<div class="menu-panel">' +
      '<button type="button" data-m="ficha">' + ui.icon('eye') + 'Ver ficha</button>' +
      '<button type="button" data-m="ajuste">' + ui.icon('adjust') + 'Ajustar stock</button>' +
      '<button type="button" data-m="copiar">' + ui.icon('copy') + 'Copiar SKU</button>' +
      '<hr>' +
      '<button type="button" data-m="estado">' + ui.icon('refresh') + (p.activo === false ? 'Activar producto' : 'Desactivar producto') + '</button>' +
      '<button type="button" class="is-danger" data-m="eliminar">' + ui.icon('trash') + 'Eliminar</button>' +
      '</div>'
    );
    boton.parentNode.style.position = 'relative';
    boton.parentNode.appendChild(panel);

    var cerrar = function (ev) {
      if (ev && panel.contains(ev.target)) return;
      panel.remove();
      document.removeEventListener('mousedown', cerrar);
    };
    setTimeout(function () { document.addEventListener('mousedown', cerrar); }, 0);

    panel.addEventListener('click', function (e) {
      var b = e.target.closest('[data-m]');
      if (!b) return;
      var m = b.getAttribute('data-m');
      panel.remove();
      if (m === 'ficha') abrirFicha(id);
      else if (m === 'ajuste') abrirAjuste(id);
      else if (m === 'copiar') ui.copiar(p.sku, 'SKU copiado: ' + p.sku);
      else if (m === 'estado') {
        try {
          var r = App.store.toggleActivoProducto(id);
          ui.toast(r.activo === false ? 'Producto desactivado' : 'Producto activado', 'info', r.nombre);
          App.router.refrescar();
        } catch (err) { ui.toast('No se pudo cambiar el estado', 'error', err.message); }
      } else if (m === 'eliminar') eliminarProducto(id);
    });
  }

  /* ------------------------------ Formulario ----------------------------- */
  function abrirFormulario(id) {
    var store = App.store;
    var editando = !!id;
    var p = editando ? store.getProducto(id) : null;
    if (editando && !p) { ui.toast('Producto no encontrado', 'error'); return; }

    var cats = store.listCategorias();
    if (!cats.length) {
      ui.toast('Primero crea una categoría', 'warn', 'Los productos necesitan una categoría.');
      App.router.navegar('categorias');
      return;
    }

    var datos = p || {
      sku: store.siguienteSKU(), nombre: '', descripcion: '', categoriaId: cats[0].id,
      proveedorId: '', precioCompra: '', precioVenta: '', stock: 0,
      stockMinimo: store.getEmpresa().stockMinimoDefault, unidad: 'unidad', ubicacion: '', activo: true
    };

    var cuerpo = '<form id="formProducto" class="form-grid" novalidate>' +
      ui.campo({ etiqueta: 'SKU / Código', name: 'sku', valor: datos.sku, requerido: true, placeholder: 'SKU-1001' }) +
      ui.campo({
        etiqueta: 'Categoría', name: 'categoriaId', tipo: 'select', valor: datos.categoriaId, requerido: true,
        opciones: cats.map(function (c) { return { value: c.id, label: c.nombre }; })
      }) +
      ui.campo({ etiqueta: 'Nombre del producto', name: 'nombre', valor: datos.nombre, requerido: true, span: true, placeholder: 'Ej. Monitor LED 24"' }) +
      ui.campo({ etiqueta: 'Descripción', name: 'descripcion', tipo: 'textarea', valor: datos.descripcion, span: true, placeholder: 'Detalles, marca, modelo…' }) +
      ui.campo({
        etiqueta: 'Proveedor', name: 'proveedorId', tipo: 'select', valor: datos.proveedorId,
        opciones: [{ value: '', label: '— Sin proveedor —' }].concat(
          store.listProveedores().map(function (pr) { return { value: pr.id, label: pr.nombre }; })
        )
      }) +
      ui.campo({
        etiqueta: 'Unidad de medida', name: 'unidad', tipo: 'select', valor: datos.unidad,
        opciones: UNIDADES.map(function (u) { return { value: u, label: u.charAt(0).toUpperCase() + u.slice(1) }; })
      }) +
      ui.campo({ etiqueta: 'Costo de compra', name: 'precioCompra', tipo: 'number', paso: '0.01', min: 0, valor: datos.precioCompra, hint: 'Precio unitario de adquisición' }) +
      ui.campo({ etiqueta: 'Precio de venta', name: 'precioVenta', tipo: 'number', paso: '0.01', min: 0, valor: datos.precioVenta }) +
      ui.campo({
        etiqueta: editando ? 'Stock actual' : 'Stock inicial', name: 'stock', tipo: 'number', paso: '1', min: 0, valor: datos.stock,
        hint: editando ? 'Si lo cambias se registrará un ajuste auditado.' : 'Se registrará como movimiento de entrada.'
      }) +
      ui.campo({ etiqueta: 'Stock mínimo', name: 'stockMinimo', tipo: 'number', paso: '1', min: 0, valor: datos.stockMinimo, hint: 'Alerta de reposición' }) +
      ui.campo({ etiqueta: 'Ubicación en almacén', name: 'ubicacion', valor: datos.ubicacion, span: true, placeholder: 'Ej. Pasillo A - Estante 3' }) +
      '<div class="field span-2"><label class="checkbox"><input type="checkbox" name="activo"' + (datos.activo !== false ? ' checked' : '') + '> Producto activo (visible en operaciones)</label></div>' +
      '</form>';

    var m = ui.modal({
      titulo: editando ? 'Editar producto' : 'Nuevo producto',
      subtitulo: editando ? p.sku + ' · ' + p.nombre : 'Completa los datos del producto',
      tamano: 'lg',
      cuerpo: cuerpo,
      pie: '<button type="button" class="btn btn-outline" data-close>Cancelar</button>' +
        '<button type="submit" form="formProducto" class="btn btn-primary">' + (editando ? 'Guardar cambios' : 'Crear producto') + '</button>'
    });

    var form = m.cuerpo.querySelector('#formProducto');

    /* Sugerencia automática de precio de venta (margen 35%). */
    var costo = form.querySelector('[name="precioCompra"]');
    var venta = form.querySelector('[name="precioVenta"]');
    costo.addEventListener('blur', function () {
      if (!venta.value && U.toNumber(costo.value) > 0) {
        venta.value = U.round2(U.toNumber(costo.value) * 1.35).toFixed(2);
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var datosForm = ui.leerFormulario(form);
      if (editando) datosForm.id = id;
      try {
        var res = App.store.guardarProducto(datosForm);
        m.cerrar();
        ui.toast(editando ? 'Producto actualizado' : 'Producto creado', 'success', res.producto.nombre);
        res.avisos.forEach(function (a) { ui.toast('Movimiento registrado', 'info', a); });
        App.router.refrescar();
      } catch (err) {
        ui.marcarErrores(form, err.campos);
        ui.toast(err.message, 'error', err.campos ? 'Revisa los campos resaltados.' : '');
      }
    });
  }

  /* --------------------------- Ajuste de stock --------------------------- */
  function abrirAjuste(id) {
    var p = App.store.getProducto(id);
    if (!p) return;
    var m = ui.modal({
      titulo: 'Ajustar stock',
      subtitulo: p.nombre + ' · stock actual ' + U.num(p.stock) + ' ' + p.unidad,
      tamano: 'sm',
      cuerpo: '<form id="formAjuste" class="stack">' +
        ui.campo({ etiqueta: 'Stock real contado', name: 'stock', tipo: 'number', paso: '1', min: 0, valor: p.stock, requerido: true }) +
        ui.campo({ etiqueta: 'Motivo', name: 'motivo', tipo: 'textarea', valor: 'Conteo físico de inventario' }) +
        '<div class="note">' + ui.icon('info') + '<div>El sistema calculará la diferencia y dejará el ajuste registrado en el historial.</div></div>' +
        '</form>',
      pie: '<button type="button" class="btn btn-outline" data-close>Cancelar</button>' +
        '<button type="submit" form="formAjuste" class="btn btn-primary">Aplicar ajuste</button>'
    });
    var form = m.cuerpo.querySelector('#formAjuste');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = ui.leerFormulario(form);
      try {
        var r = App.store.registrarMovimiento({
          productoId: id, tipo: 'ajuste', cantidad: d.stock, motivo: d.motivo, referencia: 'AJUSTE'
        });
        m.cerrar();
        ui.toast('Stock ajustado', 'success', 'Nuevo stock: ' + U.num(r.producto.stock) + ' ' + r.producto.unidad);
        App.router.refrescar();
      } catch (err) {
        ui.toast(err.message, err.codigo === 'SIN_CAMBIOS' ? 'info' : 'error');
      }
    });
  }

  /* -------------------------------- Ficha -------------------------------- */
  function abrirFicha(id) {
    var store = App.store;
    var p = store.getProducto(id);
    if (!p) return;
    var movs = store.movimientosDeProducto(id).slice(0, 12);
    var valor = U.toNumber(p.stock) * U.toNumber(p.precioCompra);
    var margen = U.toNumber(p.precioVenta) - U.toNumber(p.precioCompra);
    var margenPct = U.toNumber(p.precioCompra) > 0 ? (margen / U.toNumber(p.precioCompra)) * 100 : 0;
    var prov = store.getProveedor(p.proveedorId);

    var cuerpo = '<div class="grid grid-2" style="gap:16px">' +
      '<div class="stack" style="gap:12px">' +
      dato('SKU', '<span class="mono">' + U.escapeHtml(p.sku) + '</span>') +
      dato('Categoría', U.escapeHtml(store.nombreCategoria(p.categoriaId))) +
      dato('Ubicación', U.escapeHtml(p.ubicacion || '—')) +
      dato('Unidad', U.escapeHtml(p.unidad)) +
      '</div>' +
      '<div class="stack" style="gap:12px">' +
      dato('Costo de compra', U.money(p.precioCompra)) +
      dato('Precio de venta', U.money(p.precioVenta)) +
      dato('Margen unitario', U.money(margen) + ' <span class="badge ' + (margen >= 0 ? 'success' : 'danger') + '">' + U.formatPercent(margenPct) + '</span>') +
      dato('Valor en stock', U.money(valor)) +
      '</div>' +
      '</div>' +
      '<div class="grid grid-3" style="gap:12px;margin-top:18px">' +
      ui.kpi({ etiqueta: 'Stock actual', icono: 'box', valor: U.num(p.stock), sub: 'mínimo ' + U.num(p.stockMinimo) }) +
      ui.kpi({ etiqueta: 'Estado', icono: 'alert', tono: store.estadoStock(p) === 'ok' ? 'is-success' : 'is-warn', valor: store.ETIQUETA_ESTADO[store.estadoStock(p)], sub: ui.barraStock(p) }) +
      ui.kpi({ etiqueta: 'Movimientos', icono: 'clock', tono: 'is-info', valor: U.num(store.movimientosDeProducto(id).length), sub: 'histórico registrado' }) +
      '</div>' +
      '<h4 style="margin:20px 0 8px;font-size:13.5px">Últimos movimientos</h4>' +
      (movs.length ? '<div class="list" style="border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden">' +
        movs.map(function (mv) {
          var signo = mv.tipo === 'entrada' ? '+' : mv.tipo === 'salida' ? '−' : '±';
          return '<div class="list-item" style="padding:9px 14px">' +
            '<div class="grow"><div style="font-size:13px">' + U.escapeHtml(mv.motivo) + '</div>' +
            '<div class="cell-sub">' + U.formatDateTime(mv.fecha) + ' · ' + U.escapeHtml(mv.usuario) + '</div></div>' +
            '<span class="mono" style="font-weight:700">' + signo + U.num(mv.cantidad) + '</span>' +
            '<span class="cell-sub mono" style="min-width:56px;text-align:right">→ ' + U.num(mv.stockResultante) + '</span>' +
            '</div>';
        }).join('') + '</div>'
        : '<p class="muted" style="font-size:13px">Sin movimientos registrados.</p>') +
      (prov ? '<h4 style="margin:20px 0 8px;font-size:13.5px">Proveedor</h4>' +
        '<div class="note">' + ui.icon('truck') + '<div><strong>' + U.escapeHtml(prov.nombre) + '</strong><br>' +
        U.escapeHtml(prov.contacto || '') + (prov.telefono ? ' · ' + U.escapeHtml(prov.telefono) : '') + '</div></div>' : '') +
      (p.descripcion ? '<h4 style="margin:20px 0 8px;font-size:13.5px">Descripción</h4><p style="font-size:13.5px;color:var(--text-2)">' + U.escapeHtml(p.descripcion) + '</p>' : '');

    ui.modal({
      titulo: p.nombre,
      subtitulo: store.ETIQUETA_ESTADO[store.estadoStock(p)],
      tamano: 'lg',
      cuerpo: cuerpo,
      pie: '<button type="button" class="btn btn-outline" data-close>Cerrar</button>' +
        '<button type="button" class="btn btn-outline" data-ficha="entrada">' + ui.icon('arrowDown') + '<span>Entrada</span></button>' +
        '<button type="button" class="btn btn-primary" data-ficha="editar">' + ui.icon('edit') + '<span>Editar</span></button>',
      onMount: function (cuerpo, cerrar, pie) {
        pie.addEventListener('click', function (e) {
          var b = e.target.closest('[data-ficha]');
          if (!b) return;
          var a = b.getAttribute('data-ficha');
          cerrar();
          if (a === 'editar') abrirFormulario(id);
          else App.views.movimientos.abrirRegistro({ productoId: id, tipo: a });
        });
      }
    });

    function dato(etiqueta, valorHtml) {
      return '<div style="display:flex;justify-content:space-between;gap:12px;font-size:13.5px;padding:6px 0;border-bottom:1px dashed var(--border)">' +
        '<span class="muted">' + U.escapeHtml(etiqueta) + '</span><span style="font-weight:600;text-align:right">' + valorHtml + '</span></div>';
    }
  }

  /* ------------------------------- Eliminar ------------------------------ */
  function eliminarProducto(id) {
    var p = App.store.getProducto(id);
    if (!p) return;
    ui.confirmar({
      titulo: 'Eliminar producto',
      mensaje: '¿Seguro que quieres eliminar "' + p.nombre + '"?',
      detalle: 'También se borrarán sus <strong>' + App.store.movimientosDeProducto(id).length + '</strong> movimientos asociados. Esta acción no se puede deshacer.',
      confirmar: 'Eliminar',
      peligro: true
    }).then(function (ok) {
      if (!ok) return;
      App.store.eliminarProducto(id);
      delete vista.seleccion[id];
      ui.toast('Producto eliminado', 'success', p.nombre);
      App.router.refrescar();
    });
  }

  function eliminarSeleccion() {
    var ids = idsSeleccionados();
    if (!ids.length) return;
    ui.confirmar({
      titulo: 'Eliminar ' + ids.length + ' producto(s)',
      mensaje: 'Se eliminarán permanentemente los productos seleccionados y su historial de movimientos.',
      confirmar: 'Eliminar todo',
      peligro: true
    }).then(function (ok) {
      if (!ok) return;
      App.store.eliminarProductos(ids);
      vista.seleccion = {};
      ui.toast(ids.length + ' producto(s) eliminados', 'success');
      App.router.refrescar();
    });
  }

  function alternarSeleccion() {
    var ids = idsSeleccionados();
    if (!ids.length) return;
    ids.forEach(function (id) { App.store.toggleActivoProducto(id); });
    vista.seleccion = {};
    ui.toast('Estado actualizado', 'info', ids.length + ' producto(s) modificados.');
    App.router.refrescar();
  }

  /* ------------------------------- Exportar ------------------------------ */
  function exportarCSV(lista, nombre) {
    if (!lista.length) { ui.toast('Nada que exportar', 'warn', 'No hay productos en la selección actual.'); return; }
    var store = App.store;
    var filas = [['SKU', 'Producto', 'Categoría', 'Proveedor', 'Unidad', 'Stock', 'Stock mínimo',
      'Costo', 'Precio venta', 'Valor inventario', 'Ubicación', 'Estado']];
    lista.forEach(function (p) {
      filas.push([
        p.sku, p.nombre, store.nombreCategoria(p.categoriaId), store.nombreProveedor(p.proveedorId),
        p.unidad, p.stock, p.stockMinimo, p.precioCompra, p.precioVenta,
        U.round2(U.toNumber(p.stock) * U.toNumber(p.precioCompra)),
        p.ubicacion, store.ETIQUETA_ESTADO[store.estadoStock(p)]
      ]);
    });
    U.download(nombre + '-' + U.dateKey(new Date().toISOString()) + '.csv', '\uFEFF' + U.toCSV(filas), 'text/csv');
    ui.toast('Exportación lista', 'success', filas.length - 1 + ' producto(s) exportados.');
  }

  function abrirImportar() {
    var m = ui.modal({
      titulo: 'Importar productos desde CSV',
      subtitulo: 'Formato: SKU;Nombre;Categoría;Costo;Precio venta;Stock;Stock mínimo',
      cuerpo: '<div class="stack">' +
        '<div class="note">' + ui.icon('info') +
        '<div>Las categorías que no existan se crearán automáticamente. Los SKU repetidos se omitirán.</div></div>' +
        '<div class="field"><label for="archivoCSV">Archivo CSV</label>' +
        '<input class="input" type="file" id="archivoCSV" accept=".csv,text/csv"></div>' +
        '<div class="field"><label for="pegarCSV">…o pega las filas aquí</label>' +
        '<textarea class="textarea" id="pegarCSV" style="min-height:130px;font-family:var(--font-mono);font-size:12.5px" placeholder="SKU-2001;Teclado USB;Categoría nueva;25.00;45.00;30;5"></textarea></div>' +
        '</div>',
      pie: '<button type="button" class="btn btn-outline" data-close>Cancelar</button>' +
        '<button type="button" class="btn btn-primary" data-importar>Importar</button>'
    });

    m.pie.querySelector('[data-importar]').addEventListener('click', function () {
      var archivo = m.cuerpo.querySelector('#archivoCSV').files[0];
      var pegado = m.cuerpo.querySelector('#pegarCSV').value;
      var promesa = archivo ? U.leerArchivo(archivo) : Promise.resolve(pegado);
      promesa.then(function (texto) {
        var res = importarTexto(texto);
        m.cerrar();
        if (res.creados || res.omitidos) {
          ui.toast('Importación finalizada', 'success', res.creados + ' creados · ' + res.omitidos + ' omitidos · ' + res.categorias + ' categorías nuevas.');
          App.router.refrescar();
        } else {
          ui.toast('No se encontraron filas válidas', 'warn', 'Revisa el separador (; o ,) y las columnas.');
        }
      }).catch(function (err) { ui.toast('Error al leer el archivo', 'error', err.message); });
    });
  }

  function importarTexto(texto) {
    var store = App.store;
    var lineas = String(texto).split(/\r?\n/).filter(function (l) { return l.trim(); });
    var res = { creados: 0, omitidos: 0, categorias: 0 };
    if (!lineas.length) return res;
    var sep = lineas[0].indexOf(';') >= 0 ? ';' : ',';
    var inicio = /sku|nombre/i.test(lineas[0]) ? 1 : 0;

    for (var i = inicio; i < lineas.length; i++) {
      var c = lineas[i].split(sep).map(function (v) { return v.trim().replace(/^"|"$/g, ''); });
      if (c.length < 2 || !c[0] || !c[1]) { res.omitidos++; continue; }
      if (store.getProductoPorSku(c[0])) { res.omitidos++; continue; }

      var catId = '';
      var nombreCat = c[2] || 'General';
      var cat = store.listCategorias().filter(function (x) {
        return U.normalize(x.nombre) === U.normalize(nombreCat);
      })[0];
      if (!cat) {
        cat = store.guardarCategoria({ nombre: nombreCat, descripcion: 'Creada por importación' });
        res.categorias++;
      }
      catId = cat.id;

      try {
        store.guardarProducto({
          sku: c[0], nombre: c[1], categoriaId: catId,
          precioCompra: U.toNumber(c[3]), precioVenta: U.toNumber(c[4]),
          stock: U.toNumber(c[5]), stockMinimo: U.toNumber(c[6], 5),
          unidad: 'unidad', activo: true
        });
        res.creados++;
      } catch (e) { res.omitidos++; }
    }
    return res;
  }

  App.views.productos = {
    titulo: 'Productos',
    subtitulo: 'Catálogo, existencias y valorización',
    render: render,
    abrirFormulario: abrirFormulario,
    abrirFicha: abrirFicha,
    abrirAjuste: abrirAjuste,
    resetVista: resetVista
  };
})(window.Inventario);
