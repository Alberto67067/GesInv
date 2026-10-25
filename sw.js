/* =========================================================================
   sw.js · Service worker: caché del app shell y funcionamiento sin conexión
   -------------------------------------------------------------------------
   IMPORTANTE: al publicar cambios en los archivos de la app, sube el número
   de VERSION para que los móviles descarguen la versión nueva.
   ========================================================================= */
'use strict';

var VERSION = '1.0.2';
var CACHE = 'inventariopro-' + VERSION;

/* Base del despliegue (soporta subcarpetas tipo /mi-repo/ en GitHub Pages). */
var BASE = self.location.pathname.replace(/sw\.js$/, '');

var ARCHIVOS = [
  'index.html',
  'manifest.webmanifest',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/apple-touch-icon.png',
  'assets/css/styles.css',
  'assets/js/utils.js',
  'assets/js/store.js',
  'assets/js/ui.js',
  'assets/js/charts.js',
  'assets/js/views/dashboard.js',
  'assets/js/views/productos.js',
  'assets/js/views/movimientos.js',
  'assets/js/views/categorias.js',
  'assets/js/views/proveedores.js',
  'assets/js/views/reportes.js',
  'assets/js/views/configuracion.js',
  'assets/js/app.js'
];

var SHELL = ARCHIVOS.map(function (ruta) { return BASE + ruta; });

/* ------------------------------- Instalación ----------------------------- */
self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(CACHE).then(function (cache) {
      /* addAll falla entero si un archivo da 404: los añadimos uno a uno
         para que un recurso ausente no rompa la instalación. */
      return Promise.all(ARCHIVOS.map(function (ruta) {
        return cache.add(BASE + ruta).catch(function (e) {
          console.warn('[sw] No se pudo cachear:', ruta, e);
        });
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* -------------------------------- Activación ----------------------------- */
self.addEventListener('activate', function (evento) {
  evento.waitUntil(
    caches.keys().then(function (claves) {
      return Promise.all(claves.map(function (clave) {
        if (clave !== CACHE) return caches.delete(clave);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* -------------------------------- Estrategia ----------------------------- */
self.addEventListener('fetch', function (evento) {
  var peticion = evento.request;

  /* Solo GET del mismo origen. */
  if (peticion.method !== 'GET') return;

  var url;
  try { url = new URL(peticion.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

  /* Navegación: red primero (para recibir actualizaciones) y caché si no hay red. */
  if (peticion.mode === 'navigate') {
    evento.respondWith(
      fetch(peticion).then(function (respuesta) {
        var copia = respuesta.clone();
        caches.open(CACHE).then(function (c) { c.put(BASE + 'index.html', copia); });
        return respuesta;
      }).catch(function () {
        return caches.match(BASE + 'index.html').then(function (hit) {
          return hit || new Response(
            '<!doctype html><meta charset="utf-8"><title>Sin conexión</title>' +
            '<p style="font-family:system-ui;padding:40px;text-align:center">Sin conexión. ' +
            'Vuelve a abrir la aplicación cuando tengas internet la primera vez.</p>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        });
      })
    );
    return;
  }

  /* Resto de recursos: caché primero y actualización en segundo plano. */
  evento.respondWith(
    caches.match(peticion).then(function (enCache) {
      var desdeRed = fetch(peticion).then(function (respuesta) {
        if (respuesta && respuesta.ok && respuesta.type === 'basic') {
          var copia = respuesta.clone();
          caches.open(CACHE).then(function (c) { c.put(peticion, copia); });
        }
        return respuesta;
      }).catch(function () {
        return enCache;
      });
      return enCache || desdeRed;
    })
  );
});

/* --------------------- Mensajes desde la página -------------------------- */
self.addEventListener('message', function (evento) {
  var datos = evento.data || {};
  if (datos.tipo === 'omitir-espera') self.skipWaiting();
  if (datos.tipo === 'version' && evento.ports && evento.ports[0]) {
    evento.ports[0].postMessage({ version: VERSION });
  }
});
