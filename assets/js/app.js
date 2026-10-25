/* =========================================================================
   app.js · Arranque, enrutador por hash, navegación y atajos de teclado
   ========================================================================= */
window.Inventario = window.Inventario || {};
(function (App) {
  'use strict';

  var U = App.utils;
  var ui = App.ui;

  var RUTAS = ['dashboard', 'productos', 'movimientos', 'categorias', 'proveedores', 'reportes', 'configuracion'];
  var paramsActuales = null;

  /* ============================== Enrutador ============================== */
  function rutaActual() {
    var hash = String(location.hash || '').replace(/^#\/?/, '').split('?')[0];
    return RUTAS.indexOf(hash) !== -1 ? hash : 'dashboard';
  }

  function renderRuta() {
    var ruta = rutaActual();
    var vista = App.views[ruta];
    if (!vista) { location.hash = '#/dashboard'; return; }

    /* Reemplazamos el nodo para descartar los listeners de la vista anterior. */
    var viejo = document.getElementById('view');
    var cont = document.createElement('main');
    cont.className = 'view';
    cont.id = 'view';
    cont.tabIndex = -1;
    if (viejo && viejo.parentNode) viejo.parentNode.replaceChild(cont, viejo);
    else document.querySelector('.content').appendChild(cont);

    try {
      vista.render(cont, paramsActuales);
      if (typeof vista.montar === 'function') vista.montar(cont);
    } catch (err) {
      console.error('[app] Error al renderizar la vista', ruta, err);
      cont.innerHTML = '<section class="card">' + ui.vacio({
        icono: 'alert',
        titulo: 'Ocurrió un error al mostrar esta sección',
        texto: err.message || 'Intenta recargar la página.',
        accion: '<button type="button" class="btn btn-primary" onclick="location.reload()">Recargar</button>'
      }) + '</section>';
    }

    sincronizarCabecera(ruta, vista);
    paramsActuales = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function sincronizarCabecera(ruta, vista) {
    var titulo = document.getElementById('pageTitle');
    var sub = document.getElementById('pageSubtitle');
    if (titulo) titulo.textContent = vista.titulo || 'Panel';
    if (sub) sub.textContent = vista.subtitulo || '';
    document.title = (vista.titulo || 'Panel') + ' · InventarioPro';

    U.qsa('.nav-item').forEach(function (item) {
      item.classList.toggle('is-active', item.getAttribute('data-route') === ruta);
    });
    cerrarSidebar();
  }

  var router = {
    /** Navega a una ruta con parámetros opcionales. */
    navegar: function (ruta, params) {
      paramsActuales = params || null;
      if (rutaActual() === ruta && location.hash) renderRuta();
      else location.hash = '#/' + ruta;
    },
    /** Vuelve a pintar la vista actual conservando sus filtros. */
    refrescar: function () { renderRuta(); },
    actual: rutaActual
  };
  App.router = router;

  /* ============================ Barra lateral ============================ */
  function abrirSidebar() {
    var sb = document.getElementById('sidebar');
    var bd = document.getElementById('sidebarBackdrop');
    if (sb) sb.classList.add('is-open');
    if (bd) bd.hidden = false;
  }
  function cerrarSidebar() {
    var sb = document.getElementById('sidebar');
    var bd = document.getElementById('sidebarBackdrop');
    if (sb) sb.classList.remove('is-open');
    if (bd) bd.hidden = true;
  }

  /* ========================= Resumen de cabecera ========================= */
  function refrescarResumen() {
    var store = App.store;
    var m = store.metricas();

    var contador = document.getElementById('navCountProductos');
    if (contador) contador.textContent = U.num(m.totalProductos);

    var empresa = document.getElementById('brandEmpresa');
    if (empresa) empresa.textContent = store.getEmpresa().nombre;

    var alerta = document.getElementById('sidebarAlert');
    if (alerta) {
      if (m.bajoStock > 0) {
        alerta.hidden = false;
        document.getElementById('sidebarAlertTitle').textContent = m.bajoStock + ' producto(s) por reponer';
        document.getElementById('sidebarAlertText').textContent =
          m.agotados + ' agotados · ' + m.criticos + ' en nivel crítico';
      } else {
        alerta.hidden = true;
      }
    }

    var version = document.getElementById('footerVersion');
    if (version) {
      version.textContent = 'v1.0 · ' + (store.isDemo() ? 'datos de ejemplo' : 'datos propios');
    }
  }

  /* ========================== Búsqueda global ============================ */
  function buscar(texto) {
    var q = String(texto || '').trim();
    if (!q) return;
    App.views.productos.resetVista();
    router.navegar('productos', { q: q });
    ui.toast('Resultados de búsqueda', 'info', 'Mostrando coincidencias para “' + q + '”.');
  }

  /* ============================== Atajos ================================= */
  function atajos(e) {
    var activo = document.activeElement;
    var escribiendo = activo && (activo.tagName === 'INPUT' || activo.tagName === 'TEXTAREA' || activo.tagName === 'SELECT' || activo.isContentEditable);
    if (escribiendo) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === '/') {
      e.preventDefault();
      var s = document.getElementById('globalSearch');
      if (s) { s.focus(); s.select(); }
    } else if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      router.navegar('productos');
      setTimeout(function () { App.views.productos.abrirFormulario(); }, 120);
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      App.views.movimientos.abrirRegistro({ tipo: 'entrada' });
    }
  }

  /* ========================= Hoja de acciones (FAB) ====================== */
  function abrirHojaAcciones() {
    var yaAbierta = document.querySelector('.sheet-backdrop');
    if (yaAbierta) { yaAbierta.remove(); return; }

    var items = [
      { accion: 'entrada', icono: 'arrowDown', tono: 'success', titulo: 'Registrar entrada', sub: 'Compras, reposiciones, devoluciones' },
      { accion: 'salida', icono: 'arrowUp', tono: 'danger', titulo: 'Registrar salida', sub: 'Ventas, consumo interno, despachos' },
      { accion: 'ajuste', icono: 'adjust', tono: 'info', titulo: 'Ajustar inventario', sub: 'Conteo físico y correcciones' },
      { accion: 'producto', icono: 'box', tono: '', titulo: 'Nuevo producto', sub: 'Dar de alta un artículo' }
    ];

    var capa = U.el(
      '<div class="sheet-backdrop">' +
      '<div class="sheet" role="dialog" aria-modal="true" aria-label="Acciones rápidas">' +
      '<div class="sheet-grip"></div>' +
      '<h4>Acciones rápidas</h4>' +
      items.map(function (i) {
        return '<button type="button" class="sheet-item" data-sheet="' + i.accion + '">' +
          '<span class="sheet-ico ' + i.tono + '">' + ui.icon(i.icono) + '</span>' +
          '<span class="grow"><span style="display:block">' + i.titulo + '</span>' +
          '<span class="muted" style="font-size:12px">' + i.sub + '</span></span>' +
          '</button>';
      }).join('') +
      '</div></div>'
    );

    document.body.appendChild(capa);

    var cerrar = function () {
      capa.remove();
      var fab = document.getElementById('btnFab');
      if (fab) fab.classList.remove('is-open');
    };

    capa.addEventListener('click', function (e) {
      if (e.target === capa) { cerrar(); return; }
      var b = e.target.closest('[data-sheet]');
      if (!b) return;
      var a = b.getAttribute('data-sheet');
      cerrar();
      if (a === 'producto') {
        App.views.productos.resetVista();
        router.navegar('productos');
        setTimeout(function () { App.views.productos.abrirFormulario(); }, 130);
      } else {
        App.views.movimientos.abrirRegistro({ tipo: a });
      }
    });
  }

  /* ======================== Instalación (PWA) ============================ */
  var promptInstalacion = null;

  function esIOS() {
    var ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function yaInstalada() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      navigator.standalone === true;
  }

  function mostrarBanner(titulo, texto, textoBoton) {
    var banner = document.getElementById('installBanner');
    if (!banner) return;
    document.getElementById('installTitulo').textContent = titulo;
    document.getElementById('installTexto').textContent = texto;
    document.getElementById('installAceptar').textContent = textoBoton;
    banner.hidden = false;
    document.body.classList.add('has-install-banner');
  }

  function ocultarBanner() {
    var banner = document.getElementById('installBanner');
    if (banner) banner.hidden = true;
    document.body.classList.remove('has-install-banner');
  }

  function configurarInstalacion() {
    var banner = document.getElementById('installBanner');
    if (!banner || yaInstalada()) return;
    if (localStorage.getItem('inventariopro.instalar.oculto') === '1') return;

    /* Android / Chrome: evento nativo de instalación */
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      promptInstalacion = e;
      mostrarBanner('Instala la aplicación',
        'Añádela a tu pantalla de inicio para usarla como app y proteger tus datos.',
        'Instalar');
    });

    window.addEventListener('appinstalled', function () {
      promptInstalacion = null;
      ocultarBanner();
      ui.toast('¡Aplicación instalada!', 'success', 'Ya puedes abrirla desde tu pantalla de inicio.');
    });

    /* iOS no tiene evento: mostramos las instrucciones manuales */
    if (esIOS()) {
      setTimeout(function () {
        mostrarBanner('Añádela a tu iPhone',
          'Toca Compartir y luego "Añadir a pantalla de inicio" para proteger tus datos.',
          'Cómo hacerlo');
      }, 2500);
    }

    document.getElementById('installAceptar').addEventListener('click', function () {
      if (promptInstalacion) {
        promptInstalacion.prompt();
        promptInstalacion.userChoice.then(function (res) {
          if (res && res.outcome === 'accepted') {
            ocultarBanner();
            ui.toast('Instalando…', 'info', 'Busca el icono en tu pantalla de inicio.');
          }
          promptInstalacion = null;
        });
      } else {
        ui.modal({
          titulo: 'Añadir a la pantalla de inicio',
          subtitulo: esIOS() ? 'iPhone / iPad · Safari' : 'Instalar la aplicación',
          tamano: 'sm',
          cuerpo: '<ol style="font-size:14px;color:var(--text-2);padding-left:20px;display:grid;gap:10px">' +
            (esIOS()
              ? '<li>Toca el botón <strong>Compartir</strong> (el cuadro con la flecha hacia arriba) en la barra inferior de Safari.</li>' +
              '<li>Desliza y elige <strong>“Añadir a pantalla de inicio”</strong>.</li>' +
              '<li>Confirma con <strong>Añadir</strong>. El icono aparecerá junto a tus apps.</li>'
              : '<li>Abre el menú del navegador (los tres puntos, arriba a la derecha).</li>' +
              '<li>Elige <strong>“Instalar aplicación”</strong> o <strong>“Añadir a pantalla de inicio”</strong>.</li>' +
              '<li>Confirma. El icono aparecerá junto a tus apps.</li>') +
            '</ol>' +
            '<div class="note" style="margin-top:16px">' + ui.icon('shield') +
            '<div><strong>Importante en iPhone:</strong> si la usas solo desde Safari (sin instalarla), ' +
            'iOS puede borrar los datos tras 7 días sin abrirla. Instalada en la pantalla de inicio, tus datos quedan protegidos.</div></div>',
          pie: '<button type="button" class="btn btn-primary" data-close>Entendido</button>'
        });
      }
    });

    document.getElementById('installCerrar').addEventListener('click', function () {
      ocultarBanner();
      try { localStorage.setItem('inventariopro.instalar.oculto', '1'); } catch (e) { /* ignore */ }
    });
  }

  /* ======================= Service worker (offline) ====================== */
  function registrarServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      return; /* file:// no admite service workers */
    }
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        /* Si hay una versión nueva esperando, la activamos al vuelo. */
        if (reg.waiting) reg.waiting.postMessage({ tipo: 'omitir-espera' });
        reg.addEventListener('updatefound', function () {
          var nuevo = reg.installing;
          if (!nuevo) return;
          nuevo.addEventListener('statechange', function () {
            if (nuevo.state === 'installed' && navigator.serviceWorker.controller) {
              ui.toast('Actualización disponible', 'info', 'Cierra y vuelve a abrir la app para aplicarla.');
            }
          });
        });
      }).catch(function (e) {
        console.warn('[app] Service worker no registrado:', e);
      });
    });
  }

  /* ============================== Arranque =============================== */
  function iniciar() {
    refrescarResumen();
    ui.aplicarTema(App.store.getEmpresa().tema);

    /* Navegación */
    var nav = document.getElementById('nav');
    if (nav) {
      nav.addEventListener('click', function (e) {
        var item = e.target.closest('.nav-item');
        if (!item) return;
        cerrarSidebar();
      });
    }

    /* Menú móvil */
    var btnMenu = document.getElementById('btnMenu');
    if (btnMenu) btnMenu.addEventListener('click', abrirSidebar);
    var backdrop = document.getElementById('sidebarBackdrop');
    if (backdrop) backdrop.addEventListener('click', cerrarSidebar);

    /* Tema */
    var btnTema = document.getElementById('btnTheme');
    if (btnTema) {
      btnTema.addEventListener('click', function () {
        var nuevo = App.store.cambiarTema();
        ui.aplicarTema(nuevo);
        ui.toast(nuevo === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado', 'info');
      });
    }

    /* Acciones rápidas (FAB en móvil) */
    var btnFab = document.getElementById('btnFab');
    if (btnFab) {
      btnFab.addEventListener('click', function () {
        btnFab.classList.toggle('is-open');
        abrirHojaAcciones();
      });
    }

    /* Instalación como aplicación */
    configurarInstalacion();

    /* Funcionamiento sin conexión */
    registrarServiceWorker();

    /* Búsqueda global */
    var buscador = document.getElementById('globalSearch');
    if (buscador) {
      buscador.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { buscar(buscador.value); buscador.blur(); }
        if (e.key === 'Escape') { buscador.value = ''; buscador.blur(); }
      });
    }

    /* Registro rápido de movimientos */
    var btnQuick = document.getElementById('btnQuickAdd');
    if (btnQuick) {
      btnQuick.addEventListener('click', function () {
        App.views.movimientos.abrirRegistro({ tipo: 'entrada' });
      });
    }

    /* Al cambiar los datos refrescamos el resumen lateral. */
    App.store.subscribe(function () {
      refrescarResumen();
    });

    document.addEventListener('keydown', atajos);

    window.addEventListener('hashchange', function () {
      paramsActuales = null;
      renderRuta();
    });

    /* Primera pintura */
    if (!location.hash) location.hash = '#/dashboard';
    renderRuta();

    /* Bienvenida y recordatorio de respaldo */
    setTimeout(function () {
      if (App.store.isDemo()) {
        ui.toast('Bienvenido a InventarioPro', 'info',
          'Estás viendo datos de ejemplo. Puedes borrarlos desde Configuración.');
      }
      var ultimo = App.store.ultimoRespaldo();
      var dias = ultimo ? Math.floor((Date.now() - new Date(ultimo).getTime()) / 86400000) : null;
      var hayDatos = App.store.getState().productos.length > 0;
      if (hayDatos && !App.store.isDemo() && (dias === null || dias >= 7)) {
        setTimeout(function () {
          ui.toast('Respalda tu inventario', 'warn',
            dias === null
              ? 'Aún no has hecho ninguna copia de seguridad.'
              : 'Han pasado ' + dias + ' días desde tu último respaldo.');
        }, 1200);
      }
    }, 700);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})(window.Inventario);
