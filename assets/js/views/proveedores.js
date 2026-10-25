/* =========================================================================
   views/proveedores.js · Catálogo de proveedores
   ========================================================================= */
window.Inventario = window.Inventario || {};
(function (App) {
  'use strict';

  var U = App.utils;
  var ui = App.ui;
  App.views = App.views || {};

  var vista = { q: '', orden: 'nombre', dir: 'asc' };

  function filtrar() {
    var store = App.store;
    var q = U.normalize(vista.q);
    var lista = store.listProveedores().filter(function (p) {
      if (!q) return true;
      return U.normalize([p.nombre, p.contacto, p.email, p.telefono, p.ruc, p.direccion].join(' ')).indexOf(q) !== -1;
    });
    var claves = {
      nombre: function (p) { return U.normalize(p.nombre); },
      productos: function (p) { return store.contarProductosProveedor(p.id); },
      valor: function (p) {
        return store.valorInventario(store.listProductos().filter(function (x) { return x.proveedorId === p.id; }));
      }
    };
    return U.sortBy(lista, claves[vista.orden] || claves.nombre, vista.dir);
  }

  function render(cont) {
    var store = App.store;
    var total = store.listProveedores().length;
    var sinProv = store.listProductos().filter(function (p) { return !store.getProveedor(p.proveedorId); }).length;

    cont.innerHTML =
      ui.pageHead({
        titulo: 'Proveedores',
        texto: U.num(total) + ' proveedores registrados' + (sinProv ? ' · ' + sinProv + ' producto(s) sin proveedor' : ''),
        acciones:
          '<button type="button" class="btn btn-outline" data-action="exportar">' + ui.icon('download') + '<span>CSV</span></button>' +
          '<button type="button" class="btn btn-primary" data-action="nuevo">' + ui.icon('plus') + '<span>Nuevo proveedor</span></button>'
      }) +

      '<section class="card">' +
      '<div class="card-body" style="padding-bottom:14px">' +
      '<div class="filters">' +
      '<div class="field is-search"><label for="pq">Buscar</label>' +
      '<input class="input" id="pq" type="search" placeholder="Nombre, contacto, RUC, correo…" value="' + U.escapeHtml(vista.q) + '"></div>' +
      ui.campo({
        etiqueta: 'Ordenar por', name: 'po', tipo: 'select', valor: vista.orden, opciones: [
          { value: 'nombre', label: 'Nombre' },
          { value: 'productos', label: 'N.º de productos' },
          { value: 'valor', label: 'Valor en inventario' }
        ]
      }) +
      '</div></div>' +

      '<div class="table-wrap"><table class="tbl">' +
      '<thead><tr>' +
      '<th>Proveedor</th><th>Contacto</th><th>Teléfono</th><th>RUC</th>' +
      '<th class="num">Productos</th><th class="num">Valor</th>' +
      '<th style="width:120px"></th>' +
      '</tr></thead>' +
      '<tbody id="tbody"></tbody>' +
      '</table></div>' +
      '</section>';

    pintar();
    montar(cont);
  }

  function pintar() {
    var store = App.store;
    var tbody = document.getElementById('tbody');
    if (!tbody) return;
    var lista = filtrar();

    if (!lista.length) {
      tbody.innerHTML = '<tr><td colspan="7">' + ui.vacio({
        icono: 'truck',
        titulo: vista.q ? 'Sin resultados' : 'Aún no hay proveedores',
        texto: vista.q ? 'Prueba con otro término de búsqueda.' : 'Registra tus proveedores para asociarlos a los productos.',
        accion: '<button type="button" class="btn btn-primary" data-action="nuevo">' + ui.icon('plus') + '<span>Nuevo proveedor</span></button>'
      }) + '</td></tr>';
      return;
    }

    tbody.innerHTML = lista.map(function (p) {
      var productos = store.listProductos().filter(function (x) { return x.proveedorId === p.id; });
      var valor = store.valorInventario(productos);
      var bajo = productos.filter(function (x) { return store.estadoStock(x) !== 'ok'; }).length;
      return '<tr>' +
        '<td><div style="display:flex;gap:10px;align-items:center">' +
        '<span class="avatar">' + U.initials(p.nombre) + '</span>' +
        '<div><div class="cell-main">' + U.escapeHtml(p.nombre) + '</div>' +
        '<div class="cell-sub">' + U.escapeHtml(U.truncate(p.direccion || 'Sin dirección', 42)) + '</div></div></div></td>' +
        '<td><div style="font-size:13px">' + U.escapeHtml(p.contacto || '—') + '</div>' +
        '<div class="cell-sub">' + U.escapeHtml(p.email || '') + '</div></td>' +
        '<td class="mono">' + U.escapeHtml(p.telefono || '—') + '</td>' +
        '<td class="mono">' + U.escapeHtml(p.ruc || '—') + '</td>' +
        '<td class="num"><strong>' + U.num(productos.length) + '</strong>' +
        (bajo ? '<div class="cell-sub" style="color:var(--warn)">' + bajo + ' con stock bajo</div>' : '') + '</td>' +
        '<td class="num">' + U.money(valor) + '</td>' +
        '<td><div class="actions">' +
        ui.accion({ accion: 'ver', id: p.id, icono: 'eye', title: 'Ver ficha' }) +
        ui.accion({ accion: 'editar', id: p.id, icono: 'edit', title: 'Editar' }) +
        ui.accion({ accion: 'eliminar', id: p.id, icono: 'trash', title: 'Eliminar', peligro: true }) +
        '</div></td>' +
        '</tr>';
    }).join('');
  }

  function montar(cont) {
    var debounced = U.debounce(pintar, 200);
    cont.addEventListener('input', function (e) {
      if (e.target.id === 'pq') { vista.q = e.target.value; debounced(); }
    });
    cont.addEventListener('change', function (e) {
      if (e.target.name === 'po') { vista.orden = e.target.value; pintar(); }
    });
    cont.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var accion = btn.getAttribute('data-action');
      var id = btn.getAttribute('data-id');
      if (accion === 'nuevo') abrirFormulario();
      else if (accion === 'editar') abrirFormulario(id);
      else if (accion === 'eliminar') eliminar(id);
      else if (accion === 'ver') ficha(id);
      else if (accion === 'exportar') exportar();
    });
  }

  function abrirFormulario(id) {
    var store = App.store;
    var p = id ? store.getProveedor(id) : null;
    if (id && !p) { ui.toast('Proveedor no encontrado', 'error'); return; }
    var d = p || { nombre: '', contacto: '', email: '', telefono: '', ruc: '', direccion: '', notas: '' };

    var m = ui.modal({
      titulo: id ? 'Editar proveedor' : 'Nuevo proveedor',
      subtitulo: id ? p.nombre : 'Datos de contacto y facturación',
      tamano: 'lg',
      cuerpo: '<form id="formProv" class="form-grid" novalidate>' +
        ui.campo({ etiqueta: 'Razón social', name: 'nombre', valor: d.nombre, requerido: true, span: true, placeholder: 'Ej. Distribuidora Andina S.A.C.' }) +
        ui.campo({ etiqueta: 'Persona de contacto', name: 'contacto', valor: d.contacto, placeholder: 'Nombre del vendedor' }) +
        ui.campo({ etiqueta: 'RUC', name: 'ruc', valor: d.ruc, placeholder: '20xxxxxxxxx' }) +
        ui.campo({ etiqueta: 'Correo electrónico', name: 'email', tipo: 'email', valor: d.email, placeholder: 'ventas@proveedor.com' }) +
        ui.campo({ etiqueta: 'Teléfono', name: 'telefono', valor: d.telefono, placeholder: '+51 999 999 999' }) +
        ui.campo({ etiqueta: 'Dirección', name: 'direccion', valor: d.direccion, span: true }) +
        ui.campo({ etiqueta: 'Notas internas', name: 'notas', tipo: 'textarea', valor: d.notas, span: true, placeholder: 'Condiciones de pago, plazos de entrega…' }) +
        '</form>',
      pie: '<button type="button" class="btn btn-outline" data-close>Cancelar</button>' +
        '<button type="submit" form="formProv" class="btn btn-primary">' + (id ? 'Guardar cambios' : 'Crear proveedor') + '</button>'
    });

    var form = m.cuerpo.querySelector('#formProv');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var datos = ui.leerFormulario(form);
      if (id) datos.id = id;
      try {
        store.guardarProveedor(datos);
        m.cerrar();
        ui.toast(id ? 'Proveedor actualizado' : 'Proveedor creado', 'success', datos.nombre);
        App.router.refrescar();
      } catch (err) {
        var campos = /correo/i.test(err.message) ? { email: err.message } : { nombre: err.message };
        ui.marcarErrores(form, campos);
        ui.toast(err.message, 'error');
      }
    });
  }

  function ficha(id) {
    var store = App.store;
    var p = store.getProveedor(id);
    if (!p) return;
    var productos = store.listProductos().filter(function (x) { return x.proveedorId === id; });
    var valor = store.valorInventario(productos);
    var movs = store.listMovimientos().filter(function (mv) {
      return mv.tipo === 'entrada' && productos.some(function (x) { return x.id === mv.productoId; });
    }).slice(0, 10);

    ui.modal({
      titulo: p.nombre,
      subtitulo: U.num(productos.length) + ' producto(s) · ' + U.money(valor) + ' en inventario',
      tamano: 'lg',
      cuerpo:
        '<div class="grid grid-2" style="gap:16px">' +
        '<div class="stack" style="gap:10px">' +
        fila('Contacto', U.escapeHtml(p.contacto || '—')) +
        fila('Teléfono', U.escapeHtml(p.telefono || '—')) +
        fila('Correo', U.escapeHtml(p.email || '—')) +
        '</div>' +
        '<div class="stack" style="gap:10px">' +
        fila('RUC', U.escapeHtml(p.ruc || '—')) +
        fila('Dirección', U.escapeHtml(p.direccion || '—')) +
        fila('Registrado', U.formatDate(p.creado)) +
        '</div></div>' +
        (p.notas ? '<div class="note" style="margin-top:16px">' + ui.icon('info') + '<div>' + U.escapeHtml(p.notas) + '</div></div>' : '') +
        '<h4 style="margin:20px 0 8px;font-size:13.5px">Productos suministrados</h4>' +
        (productos.length
          ? '<div class="table-wrap" style="border:1px solid var(--border);border-radius:var(--radius-sm);max-height:230px;overflow:auto">' +
          '<table class="tbl"><thead><tr><th>SKU</th><th>Producto</th><th class="num">Stock</th><th class="num">Costo</th><th class="center">Estado</th></tr></thead><tbody>' +
          productos.map(function (x) {
            return '<tr><td class="mono">' + U.escapeHtml(x.sku) + '</td><td>' + U.escapeHtml(x.nombre) + '</td>' +
              '<td class="num">' + U.num(x.stock) + '</td><td class="num">' + U.money(x.precioCompra) + '</td>' +
              '<td class="center">' + ui.estadoBadge(x) + '</td></tr>';
          }).join('') + '</tbody></table></div>'
          : '<p class="muted" style="font-size:13px">Sin productos asociados.</p>') +
        '<h4 style="margin:20px 0 8px;font-size:13.5px">Últimas entradas recibidas</h4>' +
        (movs.length
          ? '<div class="list" style="border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden">' +
          movs.map(function (mv) {
            var pr = store.getProducto(mv.productoId);
            return '<div class="list-item" style="padding:9px 14px">' +
              '<div class="grow"><div style="font-size:13px">' + U.escapeHtml(pr ? pr.nombre : '—') + '</div>' +
              '<div class="cell-sub">' + U.formatDateTime(mv.fecha) + ' · ' + U.escapeHtml(mv.referencia || 'sin referencia') + '</div></div>' +
              '<span class="mono" style="font-weight:700;color:var(--success)">+' + U.num(mv.cantidad) + '</span>' +
              '</div>';
          }).join('') + '</div>'
          : '<p class="muted" style="font-size:13px">Sin entradas registradas.</p>'),
      pie: '<button type="button" class="btn btn-outline" data-close>Cerrar</button>' +
        '<button type="button" class="btn btn-primary" data-ficha-editar>' + ui.icon('edit') + '<span>Editar proveedor</span></button>',
      onMount: function (cuerpo, cerrar, pie) {
        pie.querySelector('[data-ficha-editar]').addEventListener('click', function () { cerrar(); abrirFormulario(id); });
      }
    });

    function fila(etiqueta, valor) {
      return '<div style="display:flex;justify-content:space-between;gap:12px;font-size:13.5px;padding:6px 0;border-bottom:1px dashed var(--border)">' +
        '<span class="muted">' + etiqueta + '</span><span style="font-weight:600;text-align:right">' + valor + '</span></div>';
    }
  }

  function eliminar(id) {
    var p = App.store.getProveedor(id);
    if (!p) return;
    var usos = App.store.contarProductosProveedor(id);
    ui.confirmar({
      titulo: 'Eliminar proveedor',
      mensaje: '¿Eliminar a "' + p.nombre + '"?',
      detalle: usos ? 'Tiene <strong>' + usos + '</strong> producto(s) asociados. Debes reasignarlos primero.'
        : 'No tiene productos asociados.',
      confirmar: 'Eliminar',
      peligro: true
    }).then(function (ok) {
      if (!ok) return;
      try {
        App.store.eliminarProveedor(id);
        ui.toast('Proveedor eliminado', 'success', p.nombre);
        App.router.refrescar();
      } catch (err) { ui.toast(err.message, 'error'); }
    });
  }

  function exportar() {
    var lista = filtrar();
    if (!lista.length) { ui.toast('Nada que exportar', 'warn'); return; }
    var store = App.store;
    var filas = [['Nombre', 'Contacto', 'Correo', 'Teléfono', 'RUC', 'Dirección', 'Productos', 'Valor inventario']];
    lista.forEach(function (p) {
      var prods = store.listProductos().filter(function (x) { return x.proveedorId === p.id; });
      filas.push([p.nombre, p.contacto, p.email, p.telefono, p.ruc, p.direccion, prods.length, store.valorInventario(prods)]);
    });
    U.download('proveedores-' + U.dateKey(new Date().toISOString()) + '.csv', '\uFEFF' + U.toCSV(filas), 'text/csv');
    ui.toast('Exportación lista', 'success', (filas.length - 1) + ' proveedor(es).');
  }

  App.views.proveedores = {
    titulo: 'Proveedores',
    subtitulo: 'Directorio de abastecimiento',
    render: render
  };
})(window.Inventario);
