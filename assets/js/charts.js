/* =========================================================================
   charts.js · Gráficas SVG ligeras, sin dependencias externas
   Todas las funciones devuelven cadenas HTML con <svg> responsive.
   ========================================================================= */
window.Inventario = window.Inventario || {};
(function (App) {
  'use strict';

  var U = App.utils;
  var charts = {};

  function vacio(alto, texto) {
    return '<div class="empty" style="padding:' + (alto / 2 - 30) + 'px 10px">' +
      '<strong style="font-size:13.5px">' + U.escapeHtml(texto || 'Sin datos para mostrar') + '</strong>' +
      '<p style="font-size:12.5px;margin-bottom:0">Registra movimientos para ver la evolución aquí.</p></div>';
  }

  /* ======================= Barras agrupadas (tiempo) ===================== */
  /**
   * @param {{etiqueta:string, [clave:string]:number}[]} datos
   * @param {{series:{clave,color,nombre}[], alto?:number, formatear?:Function}} opts
   */
  charts.barrasAgrupadas = function (datos, opts) {
    var alto = opts.alto || 260;
    var series = opts.series || [];
    var fmt = opts.formatear || function (v) { return U.formatInt(v); };
    if (!datos || !datos.length) return vacio(alto);

    var ancho = 760;
    var pad = { top: 16, right: 12, bottom: 34, left: 44 };
    var w = ancho - pad.left - pad.right;
    var h = alto - pad.top - pad.bottom;

    var max = 0;
    datos.forEach(function (d) {
      series.forEach(function (s) { max = Math.max(max, U.toNumber(d[s.clave])); });
    });
    max = max || 1;
    var escala = Math.pow(10, Math.floor(Math.log10(max)));
    var tope = Math.ceil(max / escala) * escala;
    if (tope <= 0) tope = 1;

    var paso = w / datos.length;
    var anchoGrupo = Math.min(paso * 0.68, 46);
    var anchoBarra = anchoGrupo / series.length;

    var grid = '';
    for (var g = 0; g <= 4; g++) {
      var y = pad.top + (h * g) / 4;
      var valor = tope - (tope * g) / 4;
      grid += '<line class="grid-line" x1="' + pad.left + '" y1="' + y.toFixed(1) + '" x2="' + (ancho - pad.right) + '" y2="' + y.toFixed(1) + '"/>' +
        '<text x="' + (pad.left - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + fmt(valor) + '</text>';
    }

    var barras = '';
    var etiquetas = '';
    var salto = Math.ceil(datos.length / 12);
    datos.forEach(function (d, i) {
      var cx = pad.left + paso * i + paso / 2;
      series.forEach(function (s, si) {
        var v = U.toNumber(d[s.clave]);
        var altura = tope > 0 ? (v / tope) * h : 0;
        var x = cx - anchoGrupo / 2 + si * anchoBarra;
        var y = pad.top + h - altura;
        barras += '<rect class="bar" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + Math.max(anchoBarra - 2, 1).toFixed(1) +
          '" height="' + Math.max(altura, 0).toFixed(1) + '" rx="3" fill="' + s.color + '">' +
          '<title>' + U.escapeHtml(d.etiqueta + ' · ' + s.nombre + ': ' + fmt(v)) + '</title></rect>';
      });
      if (i % salto === 0) {
        etiquetas += '<text x="' + cx.toFixed(1) + '" y="' + (alto - 12) + '" text-anchor="middle">' + U.escapeHtml(d.etiqueta) + '</text>';
      }
    });

    var leyenda = '<div class="legend">' + series.map(function (s) {
      return '<span class="legend-item"><span class="legend-swatch" style="background:' + s.color + '"></span>' + U.escapeHtml(s.nombre) + '</span>';
    }).join('') + '</div>';

    return '<svg class="chart" viewBox="0 0 ' + ancho + ' ' + alto + '" preserveAspectRatio="xMidYMid meet" role="img">' +
      grid + barras + etiquetas + '</svg>' + leyenda;
  };

  /* ============================ Dona / anillo =========================== */
  /**
   * @param {{label:string, value:number, color?:string}[]} datos
   */
  charts.dona = function (datos, opts) {
    opts = opts || {};
    var size = opts.tamano || 220;
    var grosor = opts.grosor || 26;
    var total = U.sumBy(datos, function (d) { return d.value; });
    if (!total) return vacio(size);

    var cx = size / 2, cy = size / 2;
    var r = (size - grosor) / 2 - 4;
    var circunferencia = 2 * Math.PI * r;
    var offset = 0;

    var arcos = datos.map(function (d, i) {
      var frac = U.toNumber(d.value) / total;
      var largo = frac * circunferencia;
      var color = d.color || U.colorFor(i);
      var seg = '<circle class="bar" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + color +
        '" stroke-width="' + grosor + '" stroke-dasharray="' + largo.toFixed(2) + ' ' + (circunferencia - largo).toFixed(2) +
        '" stroke-dashoffset="' + (-offset).toFixed(2) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')" stroke-linecap="butt">' +
        '<title>' + U.escapeHtml(d.label + ': ' + (opts.formatear ? opts.formatear(d.value) : U.formatInt(d.value)) + ' (' + U.formatPercent(frac * 100) + ')') + '</title>' +
        '</circle>';
      offset += largo;
      return seg;
    }).join('');

    var centro = opts.centroValor
      ? '<text x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle" style="font-size:19px;font-weight:700;fill:var(--text)">' +
        U.escapeHtml(opts.centroValor) + '</text>' +
        '<text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" style="font-size:11px">' +
        U.escapeHtml(opts.centroEtiqueta || '') + '</text>'
      : '';

    return '<svg class="chart" viewBox="0 0 ' + size + ' ' + size + '" style="max-width:' + size + 'px;margin:0 auto" role="img">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="var(--surface-3)" stroke-width="' + grosor + '"/>' +
      arcos + centro + '</svg>';
  };

  /** Leyenda para dona: label + valor + porcentaje */
  charts.leyendaDona = function (datos, formatear) {
    var total = U.sumBy(datos, function (d) { return d.value; }) || 1;
    return '<div class="list" style="margin-top:6px">' + datos.map(function (d, i) {
      return '<div class="list-item" style="padding:9px 2px;border-color:var(--border)">' +
        '<span class="legend-swatch" style="background:' + (d.color || U.colorFor(i)) + '"></span>' +
        '<span class="grow" style="font-size:13px">' + U.escapeHtml(d.label) + '</span>' +
        '<span class="mono" style="font-size:12.5px">' + (formatear ? formatear(d.value) : U.formatInt(d.value)) + '</span>' +
        '<span class="muted" style="font-size:12px;min-width:46px;text-align:right">' + U.formatPercent((d.value / total) * 100) + '</span>' +
        '</div>';
    }).join('') + '</div>';
  };

  /* ======================== Barras horizontales ========================== */
  /**
   * @param {{label:string, value:number, sub?:string}[]} datos
   */
  charts.barrasHorizontales = function (datos, opts) {
    opts = opts || {};
    var formatear = opts.formatear || U.formatInt;
    if (!datos || !datos.length) return vacio(180, 'Sin datos');
    var max = Math.max.apply(null, datos.map(function (d) { return U.toNumber(d.value); })) || 1;

    return '<div class="stack" style="gap:12px">' + datos.map(function (d, i) {
      var pct = Math.max((U.toNumber(d.value) / max) * 100, 2);
      var color = d.color || U.colorFor(i);
      return '<div>' +
        '<div style="display:flex;gap:10px;align-items:baseline;margin-bottom:5px">' +
        '<span style="font-size:13px;font-weight:600" class="grow">' + U.escapeHtml(d.label) + '</span>' +
        (d.sub ? '<span class="muted" style="font-size:11.5px">' + U.escapeHtml(d.sub) + '</span>' : '') +
        '<span class="mono" style="font-size:12.5px">' + formatear(d.value) + '</span>' +
        '</div>' +
        '<div class="progress" style="height:8px"><span style="width:' + pct.toFixed(1) + '%;background:' + color + '"></span></div>' +
        '</div>';
    }).join('') + '</div>';
  };

  /* ============================ Línea / área ============================= */
  charts.linea = function (datos, opts) {
    opts = opts || {};
    var alto = opts.alto || 200;
    var clave = opts.clave || 'valor';
    if (!datos || !datos.length) return vacio(alto);

    var ancho = 640;
    var pad = { top: 14, right: 10, bottom: 26, left: 38 };
    var w = ancho - pad.left - pad.right;
    var h = alto - pad.top - pad.bottom;
    var valores = datos.map(function (d) { return U.toNumber(d[clave]); });
    var max = Math.max.apply(null, valores) || 1;
    var min = Math.min.apply(null, valores);
    var rango = (max - min) || 1;

    var puntos = datos.map(function (d, i) {
      var x = pad.left + (w * i) / Math.max(datos.length - 1, 1);
      var y = pad.top + h - ((U.toNumber(d[clave]) - min) / rango) * h;
      return { x: x, y: y, d: d };
    });

    var linea = puntos.map(function (p, i) { return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); }).join(' ');
    var area = linea + ' L' + puntos[puntos.length - 1].x.toFixed(1) + ' ' + (pad.top + h) +
      ' L' + puntos[0].x.toFixed(1) + ' ' + (pad.top + h) + ' Z';
    var color = opts.color || 'var(--accent)';

    var puntosHtml = puntos.map(function (p) {
      return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="3" fill="var(--surface)" stroke="' + color + '" stroke-width="2">' +
        '<title>' + U.escapeHtml((p.d.etiqueta || '') + ': ' + U.formatInt(p.d[clave])) + '</title></circle>';
    }).join('');

    var salto = Math.ceil(datos.length / 8);
    var etiquetas = puntos.map(function (p, i) {
      if (i % salto !== 0) return '';
      return '<text x="' + p.x.toFixed(1) + '" y="' + (alto - 8) + '" text-anchor="middle">' + U.escapeHtml(p.d.etiqueta || '') + '</text>';
    }).join('');

    return '<svg class="chart" viewBox="0 0 ' + ancho + ' ' + alto + '" preserveAspectRatio="xMidYMid meet" role="img">' +
      '<defs><linearGradient id="grad-' + (opts.id || 'l') + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.28"/>' +
      '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#grad-' + (opts.id || 'l') + ')"/>' +
      '<path d="' + linea + '" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>' +
      puntosHtml + etiquetas + '</svg>';
  };

  /* ============================= Sparkline ============================== */
  charts.sparkline = function (valores, opts) {
    opts = opts || {};
    var ancho = opts.ancho || 120, alto = opts.alto || 34;
    if (!valores || !valores.length) return '';
    var max = Math.max.apply(null, valores) || 1;
    var min = Math.min.apply(null, valores);
    var rango = (max - min) || 1;
    var pts = valores.map(function (v, i) {
      var x = (ancho * i) / Math.max(valores.length - 1, 1);
      var y = alto - ((v - min) / rango) * (alto - 4) - 2;
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    return '<svg class="chart" viewBox="0 0 ' + ancho + ' ' + alto + '" style="max-width:' + ancho + 'px" role="img">' +
      '<polyline points="' + pts + '" fill="none" stroke="' + (opts.color || 'var(--accent)') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
  };

  /* ====================== Barras simples (una serie) ==================== */
  charts.barras = function (datos, opts) {
    return charts.barrasAgrupadas(datos, {
      alto: (opts && opts.alto) || 220,
      formatear: opts && opts.formatear,
      series: [{ clave: (opts && opts.clave) || 'valor', color: (opts && opts.color) || '#4f46e5', nombre: (opts && opts.nombre) || 'Valor' }]
    });
  };

  App.charts = charts;
})(window.Inventario);
