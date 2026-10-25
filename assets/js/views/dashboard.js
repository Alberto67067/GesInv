/* =========================================================================
   views/dashboard.js · Panel principal con indicadores y resúmenes
   ========================================================================= */
window.Inventario = window.Inventario || {};
(function (App) {
  'use strict';

  var U = App.utils;
  var ui = App.ui;
  var charts = App.charts;
  App.views = App.views || {};

  function money(v) { return U.money(v); }

  function render(cont) {
    var store = App.store;
    var m = store.metricas();
    var serie = store.serieMovimientos(14);
    var porCategoria = store.valorPorCategoria();
    var bajo = store.productosBajoStock();
    var ultimos = store.listMovimientos().slice(0, 8);
    var rotacion = store.rotacion(30);
    var productos = store.listProductos();

    var topRotacion = U.sortBy(productos.filter(function (p) {
      return (rotacion[p.id] || 0) > 0;
    }), function (p) { return rotacion[p.id] || 0; }, 'desc').slice(0, 6);

    var totalUnidadesSalida = U.sumBy(serie, function (s) { return s.salidas; });
    var totalUnidadesEntrada = U.sumBy(serie, function (s) { return s.entradas; });

    /* ---------------------------- Indicadores ---------------------------- */
    var kpis = '<section class="grid grid-4" style="margin-bottom:18px">' +
      ui.kpi({
        etiqueta: 'Valor del inventario', icono: 'coins', tono: '',
        valor: money(m.valorCompra),
        sub: '<span class="badge accent no-dot">Venta: ' + money(m.valorVenta) + '</span>'
      }) +
      ui.kpi({
        etiqueta: 'Productos activos', icono: 'box', tono: 'is-info',
        valor: U.num(m.productosActivos),
        sub: U.num(m.unidades) + ' unidades · ' + m.categorias + ' categorías'
      }) +
      ui.kpi({
        etiqueta: 'Requieren reposición', icono: 'alert', tono: m.bajoStock ? 'is-warn' : 'is-success',
        valor: U.num(m.bajoStock),
        sub: m.agotados + ' agotados · ' + m.criticos + ' en nivel crítico'
      }) +
      ui.kpi({
        etiqueta: 'Movimientos de hoy', icono: 'clock', tono: 'is-success',
        valor: U.num(m.movimientosHoy),
        sub: '+' + U.num(m.entradasHoy) + ' entradas · −' + U.num(m.salidasHoy) + ' salidas'
      }) +
      '</section>';

    /* ------------------------------ Gráficas ----------------------------- */
    var cardSerie = '<section class="card">' +
      ui.cardHead('Flujo de unidades (últimos 14 días)',
        'Entradas ' + U.num(totalUnidadesEntrada) + ' · Salidas ' + U.num(totalUnidadesSalida),
        '<div class="segmented" data-rango-serie>' +
        '<button type="button" data-dias="7">7 días</button>' +
        '<button type="button" class="is-active" data-dias="14">14 días</button>' +
        '<button type="button" data-dias="30">30 días</button>' +
        '</div>') +
      '<div class="card-body" id="chartSerie">' +
      charts.barrasAgrupadas(serie, {
        series: [
          { clave: 'entradas', color: '#10b981', nombre: 'Entradas' },
          { clave: 'salidas', color: '#f43f5e', nombre: 'Salidas' }
        ],
        alto: 268
      }) +
      '</div></section>';

    var donaDatos = porCategoria.slice(0, 6).map(function (c, i) {
      return { label: c.nombre, value: c.valor, color: U.colorFor(i) };
    });

    var cardCategorias = '<section class="card">' +
      ui.cardHead('Valor por categoría', 'Distribución del costo de inventario',
        '<button type="button" class="btn btn-ghost btn-sm" data-action="ir" data-ruta="reportes">Ver reportes</button>') +
      '<div class="card-body">' +
      (donaDatos.length
        ? charts.dona(donaDatos, {
          tamano: 200, grosor: 24,
          centroValor: U.moneyShort(m.valorCompra), centroEtiqueta: 'costo total',
          formatear: money
        }) + charts.leyendaDona(donaDatos, money)
        : ui.vacio({ icono: 'layers', titulo: 'Sin categorías valorizadas', texto: 'Agrega productos con costo para ver la distribución.' })) +
      '</div></section>';

    /* --------------------------- Bajo stock ------------------------------ */
    var filasBajo = bajo.slice(0, 6).map(function (p) {
      return '<div class="list-item">' +
        '<span class="avatar" style="background:var(--' + (store.estadoStock(p) === 'agotado' ? 'danger' : 'warn') + '-soft);color:var(--' + (store.estadoStock(p) === 'agotado' ? 'danger' : 'warn') + ')">' + U.initials(p.nombre) + '</span>' +
        '<div class="grow">' +
        '<div style="font-size:13.5px;font-weight:600">' + U.escapeHtml(p.nombre) + '</div>' +
        '<div class="cell-sub">' + U.escapeHtml(p.sku) + ' · ' + U.escapeHtml(store.nombreCategoria(p.categoriaId)) + '</div>' +
        '</div>' +
        '<div class="text-right nowrap">' +
        '<div class="mono" style="font-size:13px;font-weight:600">' + U.num(p.stock) + ' / ' + U.num(p.stockMinimo) + '</div>' +
        '<div class="cell-sub">actual / mínimo</div>' +
        '</div>' +
        ui.accion({ accion: 'reponer', id: p.id, icono: 'arrowDown', title: 'Registrar entrada' }) +
        '</div>';
    }).join('');

    var cardBajo = '<section class="card">' +
      ui.cardHead('Reposición sugerida', bajo.length + ' producto(s) en o por debajo del mínimo',
        '<button type="button" class="btn btn-ghost btn-sm" data-action="ir" data-ruta="productos" data-filtro="bajo">Ver todos</button>') +
      (filasBajo ? '<div class="list">' + filasBajo + '</div>'
        : '<div class="card-body">' + ui.vacio({ icono: 'check', titulo: 'Todo en orden', texto: 'Ningún producto está por debajo de su stock mínimo.' }) + '</div>') +
      '</section>';

    /* ------------------------ Últimos movimientos ------------------------ */
    var filasMov = ultimos.map(function (mov) {
      var p = store.getProducto(mov.productoId);
      var signo = mov.tipo === 'entrada' ? '+' : mov.tipo === 'salida' ? '−' : '±';
      var color = mov.tipo === 'entrada' ? 'var(--success)' : mov.tipo === 'salida' ? 'var(--danger)' : 'var(--info)';
      return '<div class="list-item">' +
        '<div class="grow">' +
        '<div style="font-size:13.5px;font-weight:600">' + U.escapeHtml(p ? p.nombre : 'Producto eliminado') + '</div>' +
        '<div class="cell-sub">' + U.escapeHtml(mov.motivo) + ' · ' + U.relativeTime(mov.fecha) + '</div>' +
        '</div>' +
        '<span class="mono" style="color:' + color + ';font-weight:700">' + signo + U.num(mov.cantidad) + '</span>' +
        '</div>';
    }).join('');

    var cardMov = '<section class="card">' +
      ui.cardHead('Últimos movimientos', 'Actividad reciente del almacén',
        '<button type="button" class="btn btn-ghost btn-sm" data-action="ir" data-ruta="movimientos">Historial</button>') +
      (filasMov ? '<div class="list">' + filasMov + '</div>'
        : '<div class="card-body">' + ui.vacio({ icono: 'clock', titulo: 'Sin movimientos', texto: 'Registra tu primera entrada o salida.' }) + '</div>') +
      '</section>';

    /* --------------------------- Más rotación ---------------------------- */
    var cardRotacion = '<section class="card">' +
      ui.cardHead('Mayor salida (30 días)', 'Productos con más unidades despachadas') +
      '<div class="card-body">' +
      (topRotacion.length
        ? charts.barrasHorizontales(topRotacion.map(function (p) {
          return {
            label: p.nombre,
            value: rotacion[p.id] || 0,
            sub: 'stock ' + U.num(p.stock),
            color: U.colorFor(productos.indexOf(p))
          };
        }), { formatear: function (v) { return U.num(v) + ' u.'; } })
        : ui.vacio({ icono: 'chart', titulo: 'Aún sin salidas', texto: 'Cuando registres salidas verás aquí el ranking de rotación.' })) +
      '</div></section>';

    /* ------------------------------- Layout ------------------------------ */
    cont.innerHTML =
      '<div class="page-head">' +
      '<div class="grow">' +
      '<h2>Resumen del inventario</h2>' +
      '<p>Actualizado ' + U.formatDateTime(new Date().toISOString()) + ' · ' + U.num(m.totalMovimientos) + ' movimientos históricos</p>' +
      '</div>' +
      '<div class="toolbar">' +
      '<button type="button" class="btn btn-outline" data-action="ir" data-ruta="reportes">' + ui.icon('chart') + '<span>Reportes</span></button>' +
      '<button type="button" class="btn btn-primary" data-action="nuevo-producto">' + ui.icon('plus') + '<span>Nuevo producto</span></button>' +
      '</div></div>' +
      kpis +
      '<div class="grid grid-2-1" style="margin-bottom:18px">' + cardSerie + cardCategorias + '</div>' +
      '<div class="grid grid-2-1">' + cardBajo + cardMov + '</div>' +
      '<div style="margin-top:18px">' + cardRotacion + '</div>';
  }

  /* ------------------------------ Eventos ------------------------------- */
  function montar(cont) {
    cont.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (btn) {
        var accion = btn.getAttribute('data-action');
        if (accion === 'ir') {
          var ruta = btn.getAttribute('data-ruta');
          var filtro = btn.getAttribute('data-filtro');
          App.router.navegar(ruta, filtro ? { estado: filtro } : null);
        } else if (accion === 'nuevo-producto') {
          App.views.productos.abrirFormulario();
        } else if (accion === 'reponer') {
          App.views.movimientos.abrirRegistro({ productoId: btn.getAttribute('data-id'), tipo: 'entrada' });
        }
        return;
      }

      var rango = e.target.closest('[data-dias]');
      if (rango) {
        var dias = parseInt(rango.getAttribute('data-dias'), 10);
        U.qsa('[data-rango-serie] button', cont).forEach(function (b) { b.classList.remove('is-active'); });
        rango.classList.add('is-active');
        var host = document.getElementById('chartSerie');
        if (host) {
          host.innerHTML = charts.barrasAgrupadas(App.store.serieMovimientos(dias), {
            series: [
              { clave: 'entradas', color: '#10b981', nombre: 'Entradas' },
              { clave: 'salidas', color: '#f43f5e', nombre: 'Salidas' }
            ],
            alto: 268
          });
        }
      }
    });
  }

  App.views.dashboard = {
    titulo: 'Panel',
    subtitulo: 'Resumen general del inventario',
    render: render,
    montar: montar
  };
})(window.Inventario);
