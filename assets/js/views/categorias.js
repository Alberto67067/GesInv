/* =========================================================================
   views/categorias.js · Catálogo de categorías
   ========================================================================= */
window.Inventario = window.Inventario || {};
(function (App) {
  'use strict';

  var U = App.utils;
  var ui = App.ui;
  App.views = App.views || {};

  function render(cont) {
    var store = App.store;
    var cats = store.listCategorias();
    var sinCategoria = store.listProductos().filter(function (p) { return !store.getCategoria(p.categoriaId); });

    var tarjetas = cats.map(function (c, i) {
      var productos = store.listProductos().filter(function (p) { return p.categoriaId === c.id; });
      var valor = store.valorInventario(productos);
      var unidades = store.unidadesTotales(productos);
      var bajo = productos.filter(function (p) { return store.estadoStock(p) !== 'ok'; }).length;
      return '<article class="card" style="padding:18px">' +
        '<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:14px">' +
        '<span class="avatar" style="width:42px;height:42px;border-radius:12px;background:' + U.colorFor(i) + '1f;color:' + U.colorFor(i) + '">' +
        U.initials(c.nombre) + '</span>' +
        '<div class="grow">' +
        '<h3 style="font-size:15px">' + U.escapeHtml(c.nombre) + '</h3>' +
        '<p class="muted" style="font-size:12.5px">' + U.escapeHtml(c.descripcion || 'Sin descripción') + '</p>' +
        '</div>' +
        '<div class="actions">' +
        ui.accion({ accion: 'editar', id: c.id, icono: 'edit', title: 'Editar categoría' }) +
        ui.accion({ accion: 'eliminar', id: c.id, icono: 'trash', title: 'Eliminar categoría', peligro: true }) +
        '</div></div>' +
        '<div class="grid grid-2" style="gap:10px;margin-bottom:14px">' +
        metrica('Productos', U.num(productos.length)) +
        metrica('Unidades', U.num(unidades)) +
        metrica('Valor costo', U.moneyShort(valor)) +
        metrica('Stock bajo', bajo ? '<span style="color:var(--warn)">' + bajo + '</span>' : '0') +
        '</div>' +
        '<button type="button" class="btn btn-outline btn-sm btn-block" data-action="ver-productos" data-id="' + c.id + '">' +
        ui.icon('box') + '<span>Ver productos</span></button>' +
        '</article>';
    }).join('');

    cont.innerHTML =
      ui.pageHead({
        titulo: 'Categorías',
        texto: U.num(cats.length) + ' categorías · ' + U.num(store.listProductos().length) + ' productos clasificados',
        acciones: '<button type="button" class="btn btn-primary" data-action="nueva">' + ui.icon('plus') + '<span>Nueva categoría</span></button>'
      }) +

      (sinCategoria.length ? '<div class="note warn" style="margin-bottom:18px">' + ui.icon('alert') +
        '<div><strong>' + sinCategoria.length + ' producto(s) sin categoría válida.</strong> ' +
        'Edítalos y asígnales una categoría para que aparezcan correctamente en los reportes.</div></div>' : '') +

      (cats.length
        ? '<section class="grid grid-3">' + tarjetas + '</section>'
        : '<section class="card">' + ui.vacio({
          icono: 'tag',
          titulo: 'Aún no hay categorías',
          texto: 'Las categorías agrupan tus productos y permiten analizar el inventario por familia.',
          accion: '<button type="button" class="btn btn-primary" data-action="nueva">' + ui.icon('plus') + '<span>Crear la primera categoría</span></button>'
        }) + '</section>');

    cont.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var accion = btn.getAttribute('data-action');
      var id = btn.getAttribute('data-id');
      if (accion === 'nueva') abrirFormulario();
      else if (accion === 'editar') abrirFormulario(id);
      else if (accion === 'eliminar') eliminar(id);
      else if (accion === 'ver-productos') {
        App.views.productos.resetVista();
        App.router.navegar('productos', { categoria: id });
      }
    });
  }

  function metrica(etiqueta, valor) {
    return '<div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 10px">' +
      '<div class="muted" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em">' + etiqueta + '</div>' +
      '<div style="font-size:15px;font-weight:700" class="mono">' + valor + '</div>' +
      '</div>';
  }

  function abrirFormulario(id) {
    var store = App.store;
    var cat = id ? store.getCategoria(id) : null;
    if (id && !cat) { ui.toast('Categoría no encontrada', 'error'); return; }

    var m = ui.modal({
      titulo: id ? 'Editar categoría' : 'Nueva categoría',
      subtitulo: id ? cat.nombre : 'Agrupa productos por familia',
      tamano: 'sm',
      cuerpo: '<form id="formCat" class="stack" novalidate>' +
        ui.campo({ etiqueta: 'Nombre', name: 'nombre', valor: cat ? cat.nombre : '', requerido: true, placeholder: 'Ej. Electrónica' }) +
        ui.campo({ etiqueta: 'Descripción', name: 'descripcion', tipo: 'textarea', valor: cat ? cat.descripcion : '', placeholder: 'Breve descripción de la categoría' }) +
        '</form>',
      pie: '<button type="button" class="btn btn-outline" data-close>Cancelar</button>' +
        '<button type="submit" form="formCat" class="btn btn-primary">' + (id ? 'Guardar' : 'Crear categoría') + '</button>'
    });

    var form = m.cuerpo.querySelector('#formCat');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = ui.leerFormulario(form);
      if (id) d.id = id;
      try {
        store.guardarCategoria(d);
        m.cerrar();
        ui.toast(id ? 'Categoría actualizada' : 'Categoría creada', 'success', d.nombre);
        App.router.refrescar();
      } catch (err) {
        ui.marcarErrores(form, { nombre: err.message });
        ui.toast(err.message, 'error');
      }
    });
  }

  function eliminar(id) {
    var cat = App.store.getCategoria(id);
    if (!cat) return;
    var usos = App.store.contarProductosCategoria(id);
    ui.confirmar({
      titulo: 'Eliminar categoría',
      mensaje: '¿Eliminar la categoría "' + cat.nombre + '"?',
      detalle: usos
        ? 'Tiene <strong>' + usos + '</strong> producto(s) asociados: primero reasígnalos a otra categoría.'
        : 'No tiene productos asociados.',
      confirmar: 'Eliminar',
      peligro: true
    }).then(function (ok) {
      if (!ok) return;
      try {
        App.store.eliminarCategoria(id);
        ui.toast('Categoría eliminada', 'success', cat.nombre);
        App.router.refrescar();
      } catch (err) { ui.toast(err.message, 'error'); }
    });
  }

  App.views.categorias = {
    titulo: 'Categorías',
    subtitulo: 'Familias de productos',
    render: render
  };
})(window.Inventario);
