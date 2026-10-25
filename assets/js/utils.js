/* =========================================================================
   utils.js · Funciones auxiliares compartidas (formato, DOM, exportación)
   ========================================================================= */
window.Inventario = window.Inventario || {};
(function (App) {
  'use strict';

  var utils = {};

  /* ------------------------------ Identidad ------------------------------ */
  utils.uid = function (prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  };

  /* -------------------------------- Texto -------------------------------- */
  utils.escapeHtml = function (value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  /** Minúsculas y sin acentos, para búsquedas tolerantes. */
  utils.normalize = function (value) {
    return String(value === null || value === undefined ? '' : value)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  utils.truncate = function (value, max) {
    var s = String(value || '');
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  };

  utils.initials = function (value) {
    return String(value || '?').trim().split(/\s+/).slice(0, 2)
      .map(function (w) { return w.charAt(0).toUpperCase(); }).join('');
  };

  /* ------------------------------ Números -------------------------------- */
  utils.toNumber = function (value, fallback) {
    var n = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
    return isFinite(n) ? n : (fallback === undefined ? 0 : fallback);
  };

  utils.round2 = function (n) { return Math.round((utils.toNumber(n) + Number.EPSILON) * 100) / 100; };

  utils.formatNumber = function (value, decimals) {
    var d = decimals === undefined ? 2 : decimals;
    try {
      return new Intl.NumberFormat('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d })
        .format(utils.toNumber(value));
    } catch (e) { return utils.toNumber(value).toFixed(d); }
  };

  utils.formatInt = function (value) { return utils.formatNumber(value, 0); };

  utils.formatMoney = function (value, currency, locale) {
    var n = utils.toNumber(value);
    try {
      return new Intl.NumberFormat(locale || 'es-PE', {
        style: 'currency', currency: currency || 'PEN',
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(n);
    } catch (e) {
      return (currency || '') + ' ' + n.toFixed(2);
    }
  };

  /** Versión compacta para espacios reducidos: S/ 12,4 mil */
  utils.formatMoneyShort = function (value, currency, locale) {
    var n = utils.toNumber(value);
    try {
      return new Intl.NumberFormat(locale || 'es-PE', {
        style: 'currency', currency: currency || 'PEN',
        notation: 'compact', maximumFractionDigits: 1
      }).format(n);
    } catch (e) { return utils.formatMoney(value, currency, locale); }
  };

  utils.formatPercent = function (value, decimals) {
    return utils.formatNumber(value, decimals === undefined ? 1 : decimals) + '%';
  };

  /** Moneda configurada en la empresa (se resuelve en tiempo de render). */
  utils.money = function (value) {
    var e = (App.store && App.store.getEmpresa) ? App.store.getEmpresa() : { moneda: 'PEN', locale: 'es-PE' };
    return utils.formatMoney(value, e.moneda, e.locale);
  };

  utils.moneyShort = function (value) {
    var e = (App.store && App.store.getEmpresa) ? App.store.getEmpresa() : { moneda: 'PEN', locale: 'es-PE' };
    return utils.formatMoneyShort(value, e.moneda, e.locale);
  };

  /** Número entero con separadores. */
  utils.num = function (value) { return utils.formatNumber(value, 0); };

  /* ------------------------------- Fechas -------------------------------- */
  utils.nowISO = function () { return new Date().toISOString(); };

  utils.formatDate = function (iso, opts) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-PE', opts || { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  utils.formatDateShort = function (iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  };

  utils.formatDateTime = function (iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  };

  utils.formatTime = function (iso) {
    var d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  };

  /** "hace 3 h", "ayer", "12/03/2026" */
  utils.relativeTime = function (iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    var diff = Date.now() - d.getTime();
    var mins = Math.round(diff / 60000);
    if (mins < 1) return 'ahora mismo';
    if (mins < 60) return 'hace ' + mins + ' min';
    var hours = Math.round(mins / 60);
    if (hours < 24) return 'hace ' + hours + ' h';
    var days = Math.round(hours / 24);
    if (days === 1) return 'ayer';
    if (days < 7) return 'hace ' + days + ' días';
    return utils.formatDate(iso);
  };

  utils.startOfDay = function (date) {
    var d = new Date(date || Date.now());
    d.setHours(0, 0, 0, 0);
    return d;
  };

  utils.daysAgo = function (days) {
    var d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  utils.isSameDay = function (a, b) {
    var da = new Date(a), db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  };

  utils.dateKey = function (iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  utils.toInputDate = function (iso) { return utils.dateKey(iso); };

  /* ------------------------------ Colecciones ---------------------------- */
  utils.debounce = function (fn, wait) {
    var t;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait === undefined ? 220 : wait);
    };
  };

  utils.groupBy = function (list, keyFn) {
    return (list || []).reduce(function (acc, item) {
      var k = keyFn(item);
      (acc[k] = acc[k] || []).push(item);
      return acc;
    }, {});
  };

  utils.sumBy = function (list, fn) {
    return (list || []).reduce(function (acc, item) { return acc + utils.toNumber(fn(item)); }, 0);
  };

  utils.sortBy = function (list, fn, dir) {
    var sign = dir === 'desc' ? -1 : 1;
    return (list || []).slice().sort(function (a, b) {
      var va = fn(a), vb = fn(b);
      if (typeof va === 'string' || typeof vb === 'string') {
        return sign * String(va).localeCompare(String(vb), 'es', { numeric: true, sensitivity: 'base' });
      }
      return sign * ((va > vb) - (va < vb));
    });
  };

  utils.clamp = function (n, min, max) { return Math.min(Math.max(n, min), max); };

  utils.unique = function (list) {
    return list.filter(function (v, i) { return list.indexOf(v) === i; });
  };

  /* -------------------------------- Colores ------------------------------ */
  utils.palette = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#14b8a6', '#f97316', '#ec4899', '#64748b', '#84cc16', '#06b6d4'];

  utils.colorFor = function (index) { return utils.palette[Math.abs(index) % utils.palette.length]; };

  /* --------------------------- DOM / descargas --------------------------- */
  /** Crea un elemento a partir de una cadena HTML (devuelve el primer nodo). */
  utils.el = function (html) {
    var tpl = document.createElement('template');
    tpl.innerHTML = String(html).trim();
    return tpl.content.firstElementChild;
  };

  utils.qs = function (sel, root) { return (root || document).querySelector(sel); };
  utils.qsa = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  utils.download = function (filename, content, mime) {
    var blob = new Blob([content], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  };

  /** rows: array de arrays. Escapa comillas y separadores. */
  utils.toCSV = function (rows) {
    return rows.map(function (row) {
      return row.map(function (cell) {
        var v = cell === null || cell === undefined ? '' : String(cell);
        return /[";\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(';');
    }).join('\r\n');
  };

  utils.leerArchivo = function (file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result)); };
      reader.onerror = function () { reject(new Error('No se pudo leer el archivo.')); };
      reader.readAsText(file, 'utf-8');
    });
  };

  utils.bytes = function (n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(2) + ' MB';
  };

  App.utils = utils;
})(window.Inventario);
