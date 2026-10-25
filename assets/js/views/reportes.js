/* =========================================================================
   views/reportes.js · Análisis: valorización, rotación, reposición y kardex
   ========================================================================= */
window.Inventario = window.Inventario || {};
(function (App) {
  'use strict';

  var U = App.utils;
  var ui = App.ui;
  var charts = App.charts;
  App.views = App.views || {};

  var vista = { rango: 30, tab: 'valorizacion' };

  var TABS = [
    { id: 'valorizacion', nombre: 'Valorización', icono: 'coins' },
    { id: 'rotacion', nombre: 'Rotación', icono: 'bolt' },
    { id: 'reposicion', nombre: 'Reposición', icono: 'alert' },
    { id: 'kardex', nombre: 'Kardex', icono: 'clock' }
  ];

  function render(cont) {
    var store = App.store;

    cont.innerHTML =
      ui.pageHead({
        titulo: 'Reportes',
        texto: 'Análisis del inventario con datos al ' + U.formatDate(new Date().toISOString()),
        acciones:
          '<button type="button" class="btn btn-outline" data-action="imprimir">' + ui.icon('print') + '<span>Imprimir</span></button>' +
          '<button type="button" class="btn btn-outline" data-action="exportar-json">' + ui.icon('download') + '<span>JSON</span></button>' +
          '<button type="button" class="btn btn-primary" data-action="exportar-csv">' + ui.icon('download') + '<span>CSV</span></button>'
      }) +

      '<div class="toolbar no-print" style="margin-bottom:18px;justify-content:space-between">' +
      '<div class="segmented" data-tabs>' +
      TABS.map(function (t) {
        return '<button type="button" data-tab="' + t.id + '" class="' + (vista.tab === t.id ? 'is-active' : '') + '">' + t.nombre + '</button>';
      }).join('') +
      '</div>' +
      '<div class="segmented" data-rango>' +
      [7, 30, 90].map(function (d) {
        return '<button type="button" data-r="' + d + '" class="' + (vista.rango === d ? 'is-active' : '') + '">' + d + ' días</button>';
      }).join('') +
      '</div>' +
      '</div>' +

      '<div id="panelReporte"></div>';

    pintarPanel();
    montar(cont);
  }

  /* --------------------------- Panel dinámico ---------------------------- */
  function pintarPanel() {
    var host = document.getElementById('panelReporte');
    if (!host) return;
    host.innerHTML = {
      valorizacion: panelValorizacion,
      rotacion: panelRotacion,
      reposicion: panelReposicion,
      kardex: panelKardex
    }[vista.tab]();
  }

  /* ---------------------------- Valorización ----------------------------- */
  function panelValorizacion() {
    var store = App.store;
    var productos = store.listProductos();
    var porCat = store.valorPorCategoria();
    var valor = store.valorInventario(productos);
    var valorVenta = store.valorVentaInventario(productos);
    var unidades = store.unidadesTotales(productos);
    var margen = valorVenta - valor;

    var top = U.sortBy(productos, function (p) {
      return U.toNumber(p.stock) * U.toNumber(p.precioCompra);
    }, 'desc').slice(0, 10);

    return '<div class="grid grid-4" style="margin-bottom:18px">' +
      ui.kpi({ etiqueta: 'Costo del inventario', icono: 'coins', valor: U.money(valor), sub: U.num(unidades) + ' unidades' }) +
      ui.kpi({ etiqueta: 'Valor de venta', icono: 'chart', tono: 'is-info', valor: U.money(valorVenta), sub: 'a precios de lista' }) +
      ui.kpi({ etiqueta: 'Margen potencial', icono: 'bolt', tono: 'is-success', valor: U.money(margen), sub: valor ? U.formatPercent((margen / valor) * 100) + ' sobre el costo' : '—' }) +
      ui.kpi({ etiqueta: 'Categorías', icono: 'layers', valor: U.num(porCat.length), sub: U.num(productos.length) + ' productos' }) +
      '</div>' +

      '<div class="grid grid-2-1" style="margin-bottom:18px">' +
      '<section class="card">' + ui.cardHead('Detalle por categoría', 'Costo, unidades y participación') +
      '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      '<th>Categoría</th><th class="num">Productos</th><th class="num">Unidades</th><th class="num">Costo</th>' +
      '<th class="num">Venta</th><th class="num">Participación</th><th style="width:130px">Distribución</th>' +
      '</tr></thead><tbody>' +
      (porCat.length ? porCat.map(function (c, i) {
        var prods = productos.filter(function (p) { return p.categoriaId === c.id; });
        var venta = store.valorVentaInventario(prods);
        var pct = valor ? (c.valor / valor) * 100 : 0;
        return '<tr>' +
          '<td><span class="legend-swatch" style="display:inline-block;margin-right:8px;background:' + U.colorFor(i) + '"></span>' +
          '<strong>' + U.escapeHtml(c.nombre) + '</strong></td>' +
          '<td class="num">' + U.num(c.items) + '</td>' +
          '<td class="num">' + U.num(c.unidades) + '</td>' +
          '<td class="num">' + U.money(c.valor) + '</td>' +
          '<td class="num">' + U.money(venta) + '</td>' +
          '<td class="num">' + U.formatPercent(pct) + '</td>' +
          '<td><div class="progress"><span style="width:' + Math.max(pct, 1).toFixed(1) + '%;background:' + U.colorFor(i) + '"></span></div></td>' +
          '</tr>';
      }).join('') : '<tr><td colspan="7">' + ui.vacio({ icono: 'layers', titulo: 'Sin datos', texto: 'Agrega productos para valorizar el inventario.' }) + '</td></tr>') +
      '</tbody><tfoot><tr style="background:var(--surface-2);font-weight:700">' +
      '<td>Total</td><td class="num">' + U.num(productos.length) + '</td><td class="num">' + U.num(unidades) + '</td>' +
      '<td class="num">' + U.money(valor) + '</td><td class="num">' + U.money(valorVenta) + '</td>' +
      '<td class="num">100%</td><td></td></tr></tfoot></table></div></section>' +

      '<section class="card">' + ui.cardHead('Composición', 'Participación por categoría') +
      '<div class="card-body">' +
      (porCat.length
        ? charts.dona(porCat.slice(0, 8).map(function (c, i) {
          return { label: c.nombre, value: c.valor, color: U.colorFor(i) };
        }), { tamano: 210, grosor: 26, centroValor: U.moneyShort(valor), centroEtiqueta: 'costo total', formatear: U.money }) +
        charts.leyendaDona(porCat.slice(0, 8).map(function (c, i) {
          return { label: c.nombre, value: c.valor, color: U.colorFor(i) };
        }), U.money)
        : ui.vacio({ icono: 'chart', titulo: 'Sin datos' })) +
      '</div></section>' +
      '</div>' +

      '<section class="card">' + ui.cardHead('Top 10 productos por valor inmovilizado', 'Dónde está concentrado tu capital') +
      '<div class="card-body">' +
      (top.length
        ? charts.barrasHorizontales(top.map(function (p, i) {
          return {
            label: p.nombre,
            value: U.round2(U.toNumber(p.stock) * U.toNumber(p.precioCompra)),
            sub: U.num(p.stock) + ' ' + p.unidad + ' · ' + U.money(p.precioCompra),
            color: U.colorFor(i)
          };
        }), { formatear: U.money })
        : ui.vacio({ icono: 'box', titulo: 'Sin productos' })) +
      '</div></section>';
  }

  /* ------------------------------ Rotación ------------------------------- */
  function panelRotacion() {
    var store = App.store;
    var rotacion = store.rotacion(vista.rango);
    var productos = store.listProductos();
    var serie = store.serieMovimientos(Math.min(vista.rango, 30));

    var conSalida = productos.filter(function (p) { return (rotacion[p.id] || 0) > 0; });
    var sinMovimiento = productos.filter(function (p) { return !rotacion[p.id]; });
    var totalSalidas = U.sumBy(conSalida, function (p) { return rotacion[p.id]; });

    var ranking = U.sortBy(conSalida, function (p) { return rotacion[p.id]; }, 'desc');
    var lentos = U.sortBy(sinMovimiento, function (p) {
      return U.toNumber(p.stock) * U.toNumber(p.precioCompra);
    }, 'desc').slice(0, 12);

    /* Días de cobertura = stock / promedio diario de salida */
    function cobertura(p) {
      var prom = (rotacion[p.id] || 0) / vista.rango;
      if (!prom) return null;
      return U.toNumber(p.stock) / prom;
    }

    return '<div class="grid grid-4" style="margin-bottom:18px">' +
      ui.kpi({ etiqueta: 'Unidades despachadas', icono: 'arrowUp', tono: 'is-info', valor: U.num(totalSalidas), sub: 'últimos ' + vista.rango + ' días' }) +
      ui.kpi({ etiqueta: 'Productos con movimiento', icono: 'bolt', tono: 'is-success', valor: U.num(conSalida.length), sub: 'de ' + productos.length + ' productos' }) +
      ui.kpi({ etiqueta: 'Sin movimiento', icono: 'alert', tono: sinMovimiento.length ? 'is-warn' : 'is-success', valor: U.num(sinMovimiento.length), sub: 'stock inmovilizado' }) +
      ui.kpi({
        etiqueta: 'Valor inmovilizado', icono: 'coins', tono: 'is-danger',
        valor: U.money(store.valorInventario(sinMovimiento)),
        sub: 'sin salidas en el periodo'
      }) +
      '</div>' +

      '<section class="card" style="margin-bottom:18px">' +
      ui.cardHead('Salidas diarias', 'Unidades despachadas en los últimos ' + Math.min(vista.rango, 30) + ' días') +
      '<div class="card-body">' +
      charts.barrasAgrupadas(serie, {
        series: [{ clave: 'salidas', color: '#0ea5e9', nombre: 'Salidas' }],
        alto: 240
      }) +
      '</div></section>' +

      '<div class="grid grid-2">' +
      '<section class="card">' + ui.cardHead('Mayor rotación', 'Ranking de unidades despachadas') +
      '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      '<th>#</th><th>Producto</th><th class="num">Salidas</th><th class="num">Stock</th><th class="num">Cobertura</th>' +
      '</tr></thead><tbody>' +
      (ranking.length ? ranking.slice(0, 15).map(function (p, i) {
        var cob = cobertura(p);
        return '<tr><td class="muted">' + (i + 1) + '</td>' +
          '<td><div class="cell-main">' + U.escapeHtml(p.nombre) + '</div><div class="cell-sub mono">' + U.escapeHtml(p.sku) + '</div></td>' +
          '<td class="num"><strong>' + U.num(rotacion[p.id]) + '</strong></td>' +
          '<td class="num">' + U.num(p.stock) + '</td>' +
          '<td class="num">' + (cob === null ? '—' : U.formatNumber(cob, 0) + ' d') + '</td></tr>';
      }).join('') : '<tr><td colspan="5">' + ui.vacio({ icono: 'chart', titulo: 'Sin salidas', texto: 'No se registraron salidas en el periodo seleccionado.' }) + '</td></tr>') +
      '</tbody></table></div></section>' +

      '<section class="card">' + ui.cardHead('Stock inmovilizado', 'Productos sin salidas en el periodo') +
      '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      '<th>Producto</th><th class="num">Stock</th><th class="num">Valor</th>' +
      '</tr></thead><tbody>' +
      (lentos.length ? lentos.map(function (p) {
        return '<tr><td><div class="cell-main">' + U.escapeHtml(p.nombre) + '</div>' +
          '<div class="cell-sub mono">' + U.escapeHtml(p.sku) + ' · ' + U.escapeHtml(store.nombreCategoria(p.categoriaId)) + '</div></td>' +
          '<td class="num">' + U.num(p.stock) + '</td>' +
          '<td class="num">' + U.money(U.toNumber(p.stock) * U.toNumber(p.precioCompra)) + '</td></tr>';
      }).join('') : '<tr><td colspan="3">' + ui.vacio({ icono: 'check', titulo: 'Todo rota', texto: 'Todos los productos tuvieron salidas en el periodo.' }) + '</td></tr>') +
      '</tbody></table></div></section>' +
      '</div>';
  }

  /* ----------------------------- Reposición ------------------------------ */
  function panelReposicion() {
    var store = App.store;
    var bajo = store.productosBajoStock();
    var rotacion = store.rotacion(30);

    /* Sugerencia: cubrir 30 días de demanda histórica o el mínimo, lo mayor. */
    var sugerencias = bajo.map(function (p) {
      var demandaDiaria = (rotacion[p.id] || 0) / 30;
      var objetivo = Math.max(U.toNumber(p.stockMinimo) * 2, Math.ceil(demandaDiaria * 30));
      var cantidad = Math.max(objetivo - U.toNumber(p.stock), 1);
      return {
        producto: p,
        cantidad: cantidad,
        costo: U.round2(cantidad * U.toNumber(p.precioCompra)),
        objetivo: objetivo
      };
    });

    var totalCompra = U.sumBy(sugerencias, function (s) { return s.costo; });
    var agotados = bajo.filter(function (p) { return store.estadoStock(p) === 'agotado'; });

    /* Agrupado por proveedor */
    var porProv = {};
    sugerencias.forEach(function (s) {
      var nombre = store.nombreProveedor(s.producto.proveedorId);
      if (!porProv[nombre]) porProv[nombre] = { nombre: nombre, items: 0, costo: 0, proveedorId: s.producto.proveedorId };
      porProv[nombre].items++;
      porProv[nombre].costo += s.costo;
    });

    return '<div class="grid grid-4" style="margin-bottom:18px">' +
      ui.kpi({ etiqueta: 'Productos a reponer', icono: 'alert', tono: bajo.length ? 'is-warn' : 'is-success', valor: U.num(bajo.length), sub: 'en o bajo el mínimo' }) +
      ui.kpi({ etiqueta: 'Agotados', icono: 'x', tono: agotados.length ? 'is-danger' : 'is-success', valor: U.num(agotados.length), sub: 'sin existencias' }) +
      ui.kpi({ etiqueta: 'Inversión estimada', icono: 'coins', valor: U.money(totalCompra), sub: 'para cubrir 30 días' }) +
      ui.kpi({ etiqueta: 'Proveedores implicados', icono: 'truck', tono: 'is-info', valor: U.num(Object.keys(porProv).length), sub: 'a contactar' }) +
      '</div>' +

      '<section class="card" style="margin-bottom:18px">' +
      ui.cardHead('Orden de compra sugerida', 'Cantidades calculadas según demanda de los últimos 30 días',
        '<button type="button" class="btn btn-outline btn-sm no-print" data-action="exportar-reposicion">' + ui.icon('download') + '<span>Exportar</span></button>') +
      '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      '<th>Prioridad</th><th>Producto</th><th>Proveedor</th>' +
      '<th class="num">Stock</th><th class="num">Mínimo</th><th class="num">Objetivo</th>' +
      '<th class="num">Comprar</th><th class="num">Costo est.</th><th class="no-print" style="width:110px"></th>' +
      '</tr></thead><tbody>' +
      (sugerencias.length ? sugerencias.map(function (s) {
        var p = s.producto;
        var st = store.estadoStock(p);
        var prio = st === 'agotado' ? '<span class="badge danger">Urgente</span>'
          : st === 'critico' ? '<span class="badge warn">Alta</span>'
            : '<span class="badge info">Media</span>';
        return '<tr>' +
          '<td>' + prio + '</td>' +
          '<td><div class="cell-main">' + U.escapeHtml(p.nombre) + '</div>' +
          '<div class="cell-sub mono">' + U.escapeHtml(p.sku) + ' · ' + U.escapeHtml(store.nombreCategoria(p.categoriaId)) + '</div></td>' +
          '<td><span style="font-size:13px">' + U.escapeHtml(store.nombreProveedor(p.proveedorId)) + '</span></td>' +
          '<td class="num">' + U.num(p.stock) + '</td>' +
          '<td class="num muted">' + U.num(p.stockMinimo) + '</td>' +
          '<td class="num muted">' + U.num(s.objetivo) + '</td>' +
          '<td class="num"><strong>' + U.num(s.cantidad) + '</strong> <span class="cell-sub">' + U.escapeHtml(p.unidad) + '</span></td>' +
          '<td class="num">' + U.money(s.costo) + '</td>' +
          '<td class="no-print">' + ui.accion({ accion: 'reponer', id: p.id, icono: 'arrowDown', title: 'Registrar entrada' }) + '</td>' +
          '</tr>';
      }).join('') : '<tr><td colspan="9">' + ui.vacio({
        icono: 'check', titulo: 'Nada por reponer',
        texto: 'Todos los productos están por encima de su stock mínimo.'
      }) + '</td></tr>') +
      '</tbody>' +
      (sugerencias.length ? '<tfoot><tr style="background:var(--surface-2);font-weight:700">' +
        '<td colspan="6">Total estimado</td><td class="num">' + U.num(U.sumBy(sugerencias, function (s) { return s.cantidad; })) + '</td>' +
        '<td class="num">' + U.money(totalCompra) + '</td><td class="no-print"></td></tr></tfoot>' : '') +
      '</table></div></section>' +

      '<div class="grid grid-2">' +
      '<section class="card">' + ui.cardHead('Compras por proveedor', 'Agrupación de la orden sugerida') +
      '<div class="card-body">' +
      (Object.keys(porProv).length
        ? charts.barrasHorizontales(U.sortBy(Object.keys(porProv).map(function (k) { return porProv[k]; }),
          function (x) { return x.costo; }, 'desc').map(function (x, i) {
            return { label: x.nombre, value: x.costo, sub: x.items + ' producto(s)', color: U.colorFor(i) };
          }), { formatear: U.money })
        : ui.vacio({ icono: 'truck', titulo: 'Sin compras sugeridas' })) +
      '</div></section>' +

      '<section class="card">' + ui.cardHead('Nivel de existencias', 'Comparativa contra el mínimo requerido') +
      '<div class="card-body">' +
      (bajo.length
        ? charts.barrasHorizontales(bajo.slice(0, 12).map(function (p) {
          var pct = U.toNumber(p.stockMinimo) > 0 ? (U.toNumber(p.stock) / (U.toNumber(p.stockMinimo) * 2)) * 100 : 0;
          return {
            label: p.nombre,
            value: Math.round(pct),
            sub: U.num(p.stock) + '/' + U.num(p.stockMinimo) + ' ' + p.unidad,
            color: store.estadoStock(p) === 'agotado' ? '#ef4444' : store.estadoStock(p) === 'critico' ? '#f97316' : '#f59e0b'
          };
        }), { formatear: function (v) { return v + '%'; } })
        : ui.vacio({ icono: 'check', titulo: 'Todo en orden' })) +
      '</div></section>' +
      '</div>';
  }

  /* ------------------------------- Kardex -------------------------------- */
  function panelKardex() {
    var store = App.store;
    var desde = U.daysAgo(vista.rango);
    var movs = store.listMovimientos().filter(function (m) { return new Date(m.fecha) >= desde; });

    var entradas = movs.filter(function (m) { return m.tipo === 'entrada'; });
    var salidas = movs.filter(function (m) { return m.tipo === 'salida'; });
    var ajustes = movs.filter(function (m) { return m.tipo === 'ajuste'; });

    var valorEntradas = U.sumBy(entradas, function (m) { return U.toNumber(m.cantidad) * U.toNumber(m.costoUnitario); });
    var valorSalidas = U.sumBy(salidas, function (m) { return U.toNumber(m.cantidad) * U.toNumber(m.costoUnitario); });

    /* Agrupado por día */
    var porDia = {};
    movs.forEach(function (m) {
      var k = U.dateKey(m.fecha);
      if (!porDia[k]) porDia[k] = { fecha: k, etiqueta: U.formatDateShort(m.fecha), entradas: 0, salidas: 0, movimientos: 0 };
      if (m.tipo === 'entrada') porDia[k].entradas += U.toNumber(m.cantidad);
      if (m.tipo === 'salida') porDia[k].salidas += U.toNumber(m.cantidad);
      porDia[k].movimientos++;
    });
    var serie = U.sortBy(Object.keys(porDia).map(function (k) { return porDia[k]; }), function (x) { return x.fecha; });

    var porUsuario = {};
    movs.forEach(function (m) {
      var u = m.usuario || 'Sin asignar';
      porUsuario[u] = (porUsuario[u] || 0) + 1;
    });

    return '<div class="grid grid-4" style="margin-bottom:18px">' +
      ui.kpi({ etiqueta: 'Movimientos del periodo', icono: 'clock', valor: U.num(movs.length), sub: 'últimos ' + vista.rango + ' días' }) +
      ui.kpi({ etiqueta: 'Entradas', icono: 'arrowDown', tono: 'is-success', valor: U.num(U.sumBy(entradas, function (m) { return m.cantidad; })), sub: U.money(valorEntradas) }) +
      ui.kpi({ etiqueta: 'Salidas', icono: 'arrowUp', tono: 'is-danger', valor: U.num(U.sumBy(salidas, function (m) { return m.cantidad; })), sub: U.money(valorSalidas) }) +
      ui.kpi({ etiqueta: 'Ajustes', icono: 'adjust', tono: 'is-info', valor: U.num(ajustes.length), sub: 'correcciones de inventario' }) +
      '</div>' +

      '<section class="card" style="margin-bottom:18px">' +
      ui.cardHead('Evolución diaria', 'Unidades por tipo de movimiento') +
      '<div class="card-body">' +
      charts.barrasAgrupadas(serie, {
        series: [
          { clave: 'entradas', color: '#10b981', nombre: 'Entradas' },
          { clave: 'salidas', color: '#f43f5e', nombre: 'Salidas' }
        ],
        alto: 250
      }) +
      '</div></section>' +

      '<div class="grid grid-2">' +
      '<section class="card">' + ui.cardHead('Actividad por responsable', 'Movimientos registrados por usuario') +
      '<div class="card-body">' +
      charts.barrasHorizontales(U.sortBy(Object.keys(porUsuario).map(function (u) {
        return { label: u, value: porUsuario[u] };
      }), function (x) { return x.value; }, 'desc').map(function (x, i) {
        x.color = U.colorFor(i);
        return x;
      }), { formatear: function (v) { return U.num(v) + ' mov.'; } }) +
      '</div></section>' +

      '<section class="card">' + ui.cardHead('Movimientos por día', 'Detalle de la actividad') +
      '<div class="table-wrap" style="max-height:420px;overflow:auto"><table class="tbl"><thead><tr>' +
      '<th>Fecha</th><th class="num">Entradas</th><th class="num">Salidas</th><th class="num">Balance</th><th class="num">Total</th>' +
      '</tr></thead><tbody>' +
      (serie.length ? U.sortBy(serie, function (x) { return x.fecha; }, 'desc').map(function (d) {
        var bal = d.entradas - d.salidas;
        return '<tr><td>' + U.escapeHtml(d.etiqueta) + '</td>' +
          '<td class="num" style="color:var(--success)">+' + U.num(d.entradas) + '</td>' +
          '<td class="num" style="color:var(--danger)">−' + U.num(d.salidas) + '</td>' +
          '<td class="num"><strong>' + (bal > 0 ? '+' : '') + U.num(bal) + '</strong></td>' +
          '<td class="num muted">' + U.num(d.movimientos) + '</td></tr>';
      }).join('') : '<tr><td colspan="5">' + ui.vacio({ icono: 'clock', titulo: 'Sin movimientos', texto: 'No hay actividad en el periodo.' }) + '</td></tr>') +
      '</tbody></table></div></section>' +
      '</div>';
  }

  /* -------------------------------- Eventos ------------------------------ */
  function montar(cont) {
    cont.addEventListener('click', function (e) {
      var tab = e.target.closest('[data-tab]');
      if (tab) {
        vista.tab = tab.getAttribute('data-tab');
        U.qsa('[data-tabs] button', cont).forEach(function (b) { b.classList.remove('is-active'); });
        tab.classList.add('is-active');
        pintarPanel();
        return;
      }
      var rango = e.target.closest('[data-r]');
      if (rango) {
        vista.rango = parseInt(rango.getAttribute('data-r'), 10);
        U.qsa('[data-rango] button', cont).forEach(function (b) { b.classList.remove('is-active'); });
        rango.classList.add('is-active');
        pintarPanel();
        return;
      }
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var accion = btn.getAttribute('data-action');
      if (accion === 'imprimir') window.print();
      else if (accion === 'exportar-json') exportarJSON();
      else if (accion === 'exportar-csv') exportarCSV();
      else if (accion === 'exportar-reposicion') exportarReposicion();
      else if (accion === 'reponer') App.views.movimientos.abrirRegistro({ productoId: btn.getAttribute('data-id'), tipo: 'entrada' });
    });
  }

  /* ------------------------------ Exportación ---------------------------- */
  function exportarCSV() {
    var store = App.store;
    var filas = [['SKU', 'Producto', 'Categoría', 'Proveedor', 'Unidad', 'Stock', 'Stock mínimo',
      'Costo unitario', 'Precio venta', 'Valor costo', 'Valor venta', 'Estado', 'Salidas ' + vista.rango + 'd']];
    var rotacion = store.rotacion(vista.rango);
    store.listProductos().forEach(function (p) {
      filas.push([
        p.sku, p.nombre, store.nombreCategoria(p.categoriaId), store.nombreProveedor(p.proveedorId),
        p.unidad, p.stock, p.stockMinimo, p.precioCompra, p.precioVenta,
        U.round2(U.toNumber(p.stock) * U.toNumber(p.precioCompra)),
        U.round2(U.toNumber(p.stock) * U.toNumber(p.precioVenta)),
        store.ETIQUETA_ESTADO[store.estadoStock(p)], rotacion[p.id] || 0
      ]);
    });
    U.download('reporte-inventario-' + U.dateKey(new Date().toISOString()) + '.csv', '\uFEFF' + U.toCSV(filas), 'text/csv');
    ui.toast('Reporte exportado', 'success', (filas.length - 1) + ' filas en CSV.');
  }

  function exportarReposicion() {
    var store = App.store;
    var bajo = store.productosBajoStock();
    var rotacion = store.rotacion(30);
    var filas = [['SKU', 'Producto', 'Proveedor', 'Stock', 'Mínimo', 'Objetivo', 'Comprar', 'Costo estimado']];
    bajo.forEach(function (p) {
      var demandaDiaria = (rotacion[p.id] || 0) / 30;
      var objetivo = Math.max(U.toNumber(p.stockMinimo) * 2, Math.ceil(demandaDiaria * 30));
      var cantidad = Math.max(objetivo - U.toNumber(p.stock), 1);
      filas.push([p.sku, p.nombre, store.nombreProveedor(p.proveedorId), p.stock, p.stockMinimo, objetivo,
        cantidad, U.round2(cantidad * U.toNumber(p.precioCompra))]);
    });
    if (filas.length === 1) { ui.toast('Nada que exportar', 'warn'); return; }
    U.download('orden-compra-sugerida-' + U.dateKey(new Date().toISOString()) + '.csv', '\uFEFF' + U.toCSV(filas), 'text/csv');
    ui.toast('Orden sugerida exportada', 'success', (filas.length - 1) + ' producto(s).');
  }

  function exportarJSON() {
    var store = App.store;
    var datos = {
      generado: U.nowISO(),
      periodoDias: vista.rango,
      empresa: store.getEmpresa(),
      metricas: store.metricas(),
      valorPorCategoria: store.valorPorCategoria(),
      productosBajoStock: store.productosBajoStock().map(function (p) {
        return { sku: p.sku, nombre: p.nombre, stock: p.stock, minimo: p.stockMinimo, estado: store.ETIQUETA_ESTADO[store.estadoStock(p)] };
      }),
      productos: store.listProductos()
    };
    U.download('reporte-inventario-' + U.dateKey(new Date().toISOString()) + '.json', JSON.stringify(datos, null, 2), 'application/json');
    ui.toast('Reporte exportado', 'success', 'Archivo JSON generado.');
  }

  App.views.reportes = {
    titulo: 'Reportes',
    subtitulo: 'Valorización, rotación y reposición',
    render: render
  };
})(window.Inventario);
