/* =========================================================================
   store.js · Estado de la aplicación, persistencia y reglas de negocio
   Los datos viven en localStorage. Para conectar un backend real basta con
   reemplazar los métodos de escritura por llamadas fetch (ver README).
   ========================================================================= */
window.Inventario = window.Inventario || {};
(function (App) {
  'use strict';

  var U = App.utils;
  var STORAGE_KEY = 'inventariopro.db.v1';
  var VERSION = 1;

  /* ====================== Datos de demostración ========================== */
  var CATEGORIAS_DEMO = [
    { nombre: 'Electrónica', descripcion: 'Equipos y accesorios tecnológicos' },
    { nombre: 'Papelería', descripcion: 'Útiles de oficina y escritorio' },
    { nombre: 'Limpieza', descripcion: 'Insumos de aseo y desinfección' },
    { nombre: 'Herramientas', descripcion: 'Herramientas manuales y eléctricas' },
    { nombre: 'Bebidas', descripcion: 'Bebidas y productos de consumo' }
  ];

  var PROVEEDORES_DEMO = [
    { nombre: 'Distribuidora Andina S.A.C.', contacto: 'Lucía Ramírez', email: 'ventas@andina.pe', telefono: '+51 987 654 321', direccion: 'Av. Los Álamos 480, Lima', ruc: '20512345678' },
    { nombre: 'TecnoImport Perú', contacto: 'Jorge Salas', email: 'contacto@tecnoimport.pe', telefono: '+51 998 112 233', direccion: 'Jr. Puno 155, Lima', ruc: '20487654321' },
    { nombre: 'Papelera del Norte', contacto: 'María Chávez', email: 'pedidos@papeleranorte.com', telefono: '+51 944 556 677', direccion: 'Av. Grau 1200, Trujillo', ruc: '20601234567' },
    { nombre: 'Suministros Globales E.I.R.L.', contacto: 'Carlos Peña', email: 'info@suministrosglobales.pe', telefono: '+51 933 778 899', direccion: 'Calle Comercio 88, Arequipa', ruc: '20399887766' }
  ];

  var PRODUCTOS_DEMO = [
    ['Laptop HP 15.6" i5 8GB', 'Electrónica', 0, 2150, 2790, 14, 4, 'unidad', 'A-01-02'],
    ['Mouse inalámbrico Logitech M170', 'Electrónica', 1, 28, 49, 86, 20, 'unidad', 'A-02-01'],
    ['Teclado mecánico Redragon K552', 'Electrónica', 1, 128, 199, 22, 10, 'unidad', 'A-02-03'],
    ['Monitor LG 24" IPS', 'Electrónica', 1, 480, 649, 9, 5, 'unidad', 'A-03-01'],
    ['Audífonos Sony WH-CH520', 'Electrónica', 1, 165, 249, 3, 8, 'unidad', 'A-03-04'],
    ['Cable HDMI 2 m', 'Electrónica', 0, 12, 25, 140, 30, 'unidad', 'B-01-01'],
    ['Disco SSD 480GB Kingston', 'Electrónica', 0, 145, 219, 17, 6, 'unidad', 'B-01-05'],
    ['Resma de papel A4 75g', 'Papelería', 2, 11.5, 17.9, 210, 50, 'unidad', 'C-01-01'],
    ['Bolígrafo tinta azul (caja x50)', 'Papelería', 2, 32, 55, 8, 12, 'caja', 'C-01-03'],
    ['Archivador palanca A4', 'Papelería', 2, 8.4, 14.9, 64, 20, 'unidad', 'C-02-02'],
    ['Grapadora metálica grande', 'Papelería', 2, 14, 26, 19, 10, 'unidad', 'C-02-06'],
    ['Cuaderno anillado A5', 'Papelería', 2, 6.5, 12, 5, 15, 'unidad', 'C-03-01'],
    ['Detergente industrial 15 kg', 'Limpieza', 3, 68, 99, 26, 8, 'unidad', 'D-01-01'],
    ['Alcohol isopropílico 1 L', 'Limpieza', 3, 18, 32, 41, 15, 'litro', 'D-01-04'],
    ['Papel higiénico institucional (fardo x12)', 'Limpieza', 3, 42, 66, 12, 14, 'unidad', 'D-02-01'],
    ['Desinfectante piso 4 L', 'Limpieza', 3, 22, 38, 0, 10, 'unidad', 'D-02-05'],
    ['Jabón líquido manos 500 ml', 'Limpieza', 3, 9.8, 18, 73, 25, 'unidad', 'D-03-02'],
    ['Taladro percutor 650W', 'Herramientas', 1, 240, 359, 6, 4, 'unidad', 'E-01-01'],
    ['Juego de llaves mixtas x12', 'Herramientas', 1, 95, 155, 11, 5, 'unidad', 'E-01-04'],
    ['Cinta métrica 5 m', 'Herramientas', 1, 14, 27, 38, 12, 'unidad', 'E-02-02'],
    ['Guantes de seguridad (par)', 'Herramientas', 3, 9, 17.5, 95, 30, 'unidad', 'E-02-06'],
    ['Casco de seguridad blanco', 'Herramientas', 1, 26, 45, 2, 10, 'unidad', 'E-03-01'],
    ['Agua mineral 625 ml (paquete x15)', 'Bebidas', 3, 18, 29.9, 48, 20, 'unidad', 'F-01-01'],
    ['Café molido 500 g', 'Bebidas', 3, 21, 36, 34, 12, 'unidad', 'F-01-03'],
    ['Té filtrante (caja x100)', 'Bebidas', 3, 12, 22, 7, 10, 'caja', 'F-02-01'],
    ['Gaseosa 3 L', 'Bebidas', 3, 7.5, 13.5, 120, 40, 'unidad', 'F-02-04']
  ];

  /* ============================ Estado interno =========================== */
  var state = null;
  var listeners = [];

  function defaultState() {
    return {
      version: VERSION,
      empresa: {
        nombre: 'Mi Empresa S.A.C.',
        ruc: '20123456789',
        direccion: 'Av. Principal 123, Lima',
        moneda: 'PEN',
        locale: 'es-PE',
        stockMinimoDefault: 5,
        tema: 'light'
      },
      categorias: [],
      proveedores: [],
      productos: [],
      movimientos: [],
      meta: { creado: U.nowISO(), actualizado: U.nowISO(), demo: true }
    };
  }

  /* ============================ Persistencia ============================= */
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      var base = defaultState();
      return {
        version: VERSION,
        empresa: Object.assign(base.empresa, parsed.empresa || {}),
        categorias: Array.isArray(parsed.categorias) ? parsed.categorias : [],
        proveedores: Array.isArray(parsed.proveedores) ? parsed.proveedores : [],
        productos: Array.isArray(parsed.productos) ? parsed.productos : [],
        movimientos: Array.isArray(parsed.movimientos) ? parsed.movimientos : [],
        meta: Object.assign(base.meta, parsed.meta || {})
      };
    } catch (e) {
      console.warn('[store] No se pudo leer el almacenamiento local:', e);
      return null;
    }
  }

  function persist() {
    try {
      state.meta.actualizado = U.nowISO();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('[store] Error al guardar:', e);
      return false;
    }
  }

  function notify() {
    listeners.slice().forEach(function (fn) {
      try { fn(state); } catch (e) { console.error('[store] listener', e); }
    });
  }

  function commit() { persist(); notify(); }

  /* ============================== Semilla ================================ */
  function seed() {
    var s = defaultState();
    var hoy = Date.now();

    s.categorias = CATEGORIAS_DEMO.map(function (c) {
      return { id: U.uid('cat'), nombre: c.nombre, descripcion: c.descripcion, creado: U.nowISO() };
    });

    s.proveedores = PROVEEDORES_DEMO.map(function (p) {
      return {
        id: U.uid('prov'), nombre: p.nombre, contacto: p.contacto, email: p.email,
        telefono: p.telefono, direccion: p.direccion, ruc: p.ruc, notas: '', creado: U.nowISO()
      };
    });

    s.productos = PRODUCTOS_DEMO.map(function (row, i) {
      var cat = s.categorias[row[1] === 'Electrónica' ? 0 : row[1] === 'Papelería' ? 1 : row[1] === 'Limpieza' ? 2 : row[1] === 'Herramientas' ? 3 : 4];
      var prov = s.proveedores[(i + (row[2] || 0)) % s.proveedores.length];
      return {
        id: U.uid('prod'),
        sku: 'SKU-' + String(1001 + i),
        nombre: row[0],
        descripcion: '',
        categoriaId: cat.id,
        proveedorId: prov.id,
        precioCompra: row[3],
        precioVenta: row[4],
        stock: row[5],
        stockMinimo: row[6],
        unidad: row[7],
        ubicacion: row[8],
        activo: true,
        creado: new Date(hoy - (90 - i) * 86400000).toISOString(),
        actualizado: U.nowISO()
      };
    });

    /* Historial de movimientos de los últimos 45 días */
    var motivosE = ['Compra a proveedor', 'Reposición de stock', 'Devolución de cliente', 'Transferencia entre almacenes'];
    var motivosS = ['Venta mostrador', 'Consumo interno', 'Venta online', 'Pedido corporativo'];
    var movs = [];
    for (var d = 45; d >= 0; d--) {
      var n = 1 + Math.floor(Math.random() * 4);
      for (var k = 0; k < n; k++) {
        var p = s.productos[Math.floor(Math.random() * s.productos.length)];
        var tipo = Math.random() > 0.42 ? 'entrada' : 'salida';
        var cant = tipo === 'entrada'
          ? [5, 10, 12, 20, 24, 50][Math.floor(Math.random() * 6)]
          : [1, 2, 3, 5, 8, 10][Math.floor(Math.random() * 6)];
        var fecha = new Date(hoy - d * 86400000);
        fecha.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
        movs.push({
          id: U.uid('mov'),
          productoId: p.id,
          tipo: tipo,
          cantidad: cant,
          motivo: tipo === 'entrada'
            ? motivosE[Math.floor(Math.random() * motivosE.length)]
            : motivosS[Math.floor(Math.random() * motivosS.length)],
          referencia: tipo === 'entrada' ? 'FAC-00' + (100 + Math.floor(Math.random() * 900)) : 'PED-00' + (100 + Math.floor(Math.random() * 900)),
          usuario: ['Ana Torres', 'Luis Mendoza', 'Sistema'][Math.floor(Math.random() * 3)],
          costoUnitario: tipo === 'entrada' ? p.precioCompra : p.precioVenta,
          fecha: fecha.toISOString()
        });
      }
    }
    s.movimientos = U.sortBy(movs, function (m) { return m.fecha; }, 'desc');
    return s;
  }

  /* ============================== Lecturas =============================== */
  var store = {};

  store.VERSION = VERSION;
  store.STORAGE_KEY = STORAGE_KEY;
  store.defaultState = defaultState;

  store.getState = function () { return state; };
  store.getEmpresa = function () { return state.empresa; };
  store.isDemo = function () { return !!state.meta.demo; };

  store.subscribe = function (fn) {
    listeners.push(fn);
    return function () { listeners = listeners.filter(function (f) { return f !== fn; }); };
  };

  store.listCategorias = function () {
    return U.sortBy(state.categorias, function (c) { return U.normalize(c.nombre); });
  };
  store.getCategoria = function (id) {
    return state.categorias.filter(function (c) { return c.id === id; })[0] || null;
  };
  store.nombreCategoria = function (id) {
    var c = store.getCategoria(id);
    return c ? c.nombre : 'Sin categoría';
  };

  store.listProveedores = function () {
    return U.sortBy(state.proveedores, function (p) { return U.normalize(p.nombre); });
  };
  store.getProveedor = function (id) {
    return state.proveedores.filter(function (p) { return p.id === id; })[0] || null;
  };
  store.nombreProveedor = function (id) {
    var p = store.getProveedor(id);
    return p ? p.nombre : 'Sin proveedor';
  };

  store.listProductos = function () {
    return U.sortBy(state.productos, function (p) { return U.normalize(p.nombre); });
  };
  store.getProducto = function (id) {
    return state.productos.filter(function (p) { return p.id === id; })[0] || null;
  };
  store.getProductoPorSku = function (sku) {
    var key = U.normalize(sku);
    return state.productos.filter(function (p) { return U.normalize(p.sku) === key; })[0] || null;
  };
  store.siguienteSKU = function () {
    var max = 1000;
    state.productos.forEach(function (p) {
      var m = /(\d+)\s*$/.exec(p.sku || '');
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return 'SKU-' + (max + 1);
  };

  store.listMovimientos = function () {
    return U.sortBy(state.movimientos, function (m) { return m.fecha; }, 'desc');
  };

  /* =========================== Derivados ================================= */
  /** Clasifica el stock de un producto. */
  store.estadoStock = function (producto) {
    if (!producto) return 'ok';
    var min = U.toNumber(producto.stockMinimo);
    var s = U.toNumber(producto.stock);
    if (s <= 0) return 'agotado';
    if (min > 0 && s <= min * 0.5) return 'critico';
    if (s <= min) return 'bajo';
    return 'ok';
  };

  store.ETIQUETA_ESTADO = {
    ok: 'Disponible',
    bajo: 'Stock bajo',
    critico: 'Crítico',
    agotado: 'Agotado'
  };

  store.valorInventario = function (productos) {
    return U.round2(U.sumBy(productos || state.productos, function (p) {
      return U.toNumber(p.stock) * U.toNumber(p.precioCompra);
    }));
  };

  store.valorVentaInventario = function (productos) {
    return U.round2(U.sumBy(productos || state.productos, function (p) {
      return U.toNumber(p.stock) * U.toNumber(p.precioVenta);
    }));
  };

  store.unidadesTotales = function (productos) {
    return U.sumBy(productos || state.productos, function (p) { return U.toNumber(p.stock); });
  };

  store.productosBajoStock = function () {
    return U.sortBy(state.productos.filter(function (p) {
      return p.activo !== false && store.estadoStock(p) !== 'ok';
    }), function (p) {
      return U.toNumber(p.stock) - U.toNumber(p.stockMinimo);
    });
  };

  store.movimientosDelDia = function (fecha) {
    var ref = fecha || new Date();
    return state.movimientos.filter(function (m) { return U.isSameDay(m.fecha, ref); });
  };

  /** Serie diaria de entradas/salidas para gráficas. */
  store.serieMovimientos = function (dias) {
    var n = dias || 14;
    var serie = [];
    for (var i = n - 1; i >= 0; i--) {
      var dia = U.startOfDay(U.daysAgo(i));
      var fin = new Date(dia.getTime() + 86400000);
      var delDia = state.movimientos.filter(function (m) {
        var f = new Date(m.fecha);
        return f >= dia && f < fin;
      });
      serie.push({
        fecha: dia.toISOString(),
        etiqueta: U.formatDateShort(dia),
        entradas: U.sumBy(delDia.filter(function (m) { return m.tipo === 'entrada'; }), function (m) { return m.cantidad; }),
        salidas: U.sumBy(delDia.filter(function (m) { return m.tipo === 'salida'; }), function (m) { return m.cantidad; }),
        movimientos: delDia.length
      });
    }
    return serie;
  };

  store.valorPorCategoria = function () {
    var mapa = {};
    state.productos.forEach(function (p) {
      var id = p.categoriaId || 'sin';
      if (!mapa[id]) mapa[id] = { id: id, nombre: store.nombreCategoria(p.categoriaId), items: 0, unidades: 0, valor: 0 };
      mapa[id].items += 1;
      mapa[id].unidades += U.toNumber(p.stock);
      mapa[id].valor += U.toNumber(p.stock) * U.toNumber(p.precioCompra);
    });
    return U.sortBy(Object.keys(mapa).map(function (k) {
      mapa[k].valor = U.round2(mapa[k].valor);
      return mapa[k];
    }), function (c) { return c.valor; }, 'desc');
  };

  /** Consumo de los últimos 30 días por producto (rotación). */
  store.rotacion = function (dias) {
    var desde = U.daysAgo(dias || 30);
    var mapa = {};
    state.movimientos.forEach(function (m) {
      if (m.tipo !== 'salida') return;
      if (new Date(m.fecha) < desde) return;
      mapa[m.productoId] = (mapa[m.productoId] || 0) + U.toNumber(m.cantidad);
    });
    return mapa;
  };

  store.metricas = function () {
    var productos = state.productos;
    var activos = productos.filter(function (p) { return p.activo !== false; });
    var bajo = store.productosBajoStock();
    var hoy = store.movimientosDelDia();
    var entradasHoy = U.sumBy(hoy.filter(function (m) { return m.tipo === 'entrada'; }), function (m) { return m.cantidad; });
    var salidasHoy = U.sumBy(hoy.filter(function (m) { return m.tipo === 'salida'; }), function (m) { return m.cantidad; });
    var ventasHoy = U.sumBy(hoy.filter(function (m) { return m.tipo === 'salida'; }), function (m) {
      var p = store.getProducto(m.productoId);
      return U.toNumber(m.cantidad) * U.toNumber(p ? p.precioVenta : 0);
    });
    var valor = store.valorInventario(activos);
    var valorVenta = store.valorVentaInventario(activos);
    return {
      totalProductos: productos.length,
      productosActivos: activos.length,
      unidades: store.unidadesTotales(activos),
      valorCompra: valor,
      valorVenta: valorVenta,
      margenPotencial: U.round2(valorVenta - valor),
      bajoStock: bajo.length,
      agotados: activos.filter(function (p) { return store.estadoStock(p) === 'agotado'; }).length,
      criticos: activos.filter(function (p) { return store.estadoStock(p) === 'critico'; }).length,
      movimientosHoy: hoy.length,
      entradasHoy: entradasHoy,
      salidasHoy: salidasHoy,
      ventasHoy: U.round2(ventasHoy),
      categorias: state.categorias.length,
      proveedores: state.proveedores.length,
      totalMovimientos: state.movimientos.length
    };
  };

  /* ============================= Escrituras ============================== */
  store.updateEmpresa = function (patch) {
    Object.assign(state.empresa, patch || {});
    commit();
    return state.empresa;
  };

  /** Registra la fecha del último respaldo (para avisar al usuario). */
  store.marcarRespaldo = function () {
    state.meta.ultimoRespaldo = U.nowISO();
    commit();
    return state.meta.ultimoRespaldo;
  };

  store.ultimoRespaldo = function () {
    return state.meta.ultimoRespaldo || null;
  };

  /* --- Categorías --- */
  store.guardarCategoria = function (data) {
    var nombre = String(data.nombre || '').trim();
    if (!nombre) throw new Error('El nombre de la categoría es obligatorio.');
    var dup = state.categorias.some(function (c) {
      return U.normalize(c.nombre) === U.normalize(nombre) && c.id !== data.id;
    });
    if (dup) throw new Error('Ya existe una categoría con ese nombre.');

    if (data.id) {
      var cat = store.getCategoria(data.id);
      if (!cat) throw new Error('La categoría no existe.');
      Object.assign(cat, { nombre: nombre, descripcion: String(data.descripcion || '').trim() });
      commit();
      return cat;
    }
    var nueva = {
      id: U.uid('cat'), nombre: nombre,
      descripcion: String(data.descripcion || '').trim(), creado: U.nowISO()
    };
    state.categorias.push(nueva);
    commit();
    return nueva;
  };

  store.eliminarCategoria = function (id) {
    var usados = state.productos.filter(function (p) { return p.categoriaId === id; });
    if (usados.length) {
      throw new Error('No se puede eliminar: ' + usados.length + ' producto(s) usan esta categoría.');
    }
    state.categorias = state.categorias.filter(function (c) { return c.id !== id; });
    commit();
  };

  store.contarProductosCategoria = function (id) {
    return state.productos.filter(function (p) { return p.categoriaId === id; }).length;
  };

  /* --- Proveedores --- */
  store.guardarProveedor = function (data) {
    var nombre = String(data.nombre || '').trim();
    if (!nombre) throw new Error('El nombre del proveedor es obligatorio.');
    var campos = {
      nombre: nombre,
      contacto: String(data.contacto || '').trim(),
      email: String(data.email || '').trim(),
      telefono: String(data.telefono || '').trim(),
      direccion: String(data.direccion || '').trim(),
      ruc: String(data.ruc || '').trim(),
      notas: String(data.notas || '').trim()
    };
    if (campos.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(campos.email)) {
      throw new Error('El correo electrónico no tiene un formato válido.');
    }
    if (data.id) {
      var prov = store.getProveedor(data.id);
      if (!prov) throw new Error('El proveedor no existe.');
      Object.assign(prov, campos);
      commit();
      return prov;
    }
    var nuevo = Object.assign({ id: U.uid('prov'), creado: U.nowISO() }, campos);
    state.proveedores.push(nuevo);
    commit();
    return nuevo;
  };

  store.eliminarProveedor = function (id) {
    var usados = state.productos.filter(function (p) { return p.proveedorId === id; });
    if (usados.length) {
      throw new Error('No se puede eliminar: ' + usados.length + ' producto(s) están asociados a este proveedor.');
    }
    state.proveedores = state.proveedores.filter(function (p) { return p.id !== id; });
    commit();
  };

  store.contarProductosProveedor = function (id) {
    return state.productos.filter(function (p) { return p.proveedorId === id; }).length;
  };

  /* --- Productos --- */
  store.validarProducto = function (data) {
    var errores = {};
    if (!String(data.nombre || '').trim()) errores.nombre = 'Ingresa el nombre del producto.';
    if (!String(data.sku || '').trim()) errores.sku = 'Ingresa un SKU o código.';
    else {
      var dup = state.productos.some(function (p) {
        return U.normalize(p.sku) === U.normalize(data.sku) && p.id !== data.id;
      });
      if (dup) errores.sku = 'Ese SKU ya está registrado.';
    }
    if (!data.categoriaId) errores.categoriaId = 'Selecciona una categoría.';
    if (U.toNumber(data.precioVenta) < 0) errores.precioVenta = 'El precio no puede ser negativo.';
    if (U.toNumber(data.precioCompra) < 0) errores.precioCompra = 'El costo no puede ser negativo.';
    if (U.toNumber(data.stock) < 0) errores.stock = 'El stock no puede ser negativo.';
    if (U.toNumber(data.stockMinimo) < 0) errores.stockMinimo = 'El mínimo no puede ser negativo.';
    return errores;
  };

  /**
   * Crea o actualiza un producto.
   * @returns {{producto: Object, avisos: string[]}}
   */
  store.guardarProducto = function (data) {
    var errores = store.validarProducto(data);
    if (Object.keys(errores).length) {
      var err = new Error('Revisa los campos marcados.');
      err.campos = errores;
      throw err;
    }

    var campos = {
      sku: String(data.sku).trim(),
      nombre: String(data.nombre).trim(),
      descripcion: String(data.descripcion || '').trim(),
      categoriaId: data.categoriaId,
      proveedorId: data.proveedorId || '',
      precioCompra: U.round2(U.toNumber(data.precioCompra)),
      precioVenta: U.round2(U.toNumber(data.precioVenta)),
      stockMinimo: U.toNumber(data.stockMinimo),
      unidad: data.unidad || 'unidad',
      ubicacion: String(data.ubicacion || '').trim(),
      activo: data.activo !== false
    };
    var avisos = [];

    if (data.id) {
      var prod = store.getProducto(data.id);
      if (!prod) throw new Error('El producto no existe.');
      var stockPrevio = U.toNumber(prod.stock);
      var stockNuevo = U.toNumber(data.stock);
      Object.assign(prod, campos);
      prod.actualizado = U.nowISO();

      if (stockNuevo !== stockPrevio) {
        /* El cambio de stock desde el formulario queda auditado como ajuste. */
        prod.stock = stockPrevio;
        store._aplicarMovimiento({
          productoId: prod.id, tipo: 'ajuste', cantidad: stockNuevo,
          motivo: 'Ajuste desde ficha de producto', referencia: 'AJUSTE-MANUAL', usuario: 'Administrador'
        }, true);
        avisos.push('Se registró un ajuste de stock de ' + stockPrevio + ' a ' + stockNuevo + '.');
      }
      commit();
      return { producto: prod, avisos: avisos };
    }

    var nuevo = Object.assign({
      id: U.uid('prod'), stock: 0, creado: U.nowISO(), actualizado: U.nowISO()
    }, campos);
    state.productos.push(nuevo);

    var inicial = U.toNumber(data.stock);
    if (inicial > 0) {
      store._aplicarMovimiento({
        productoId: nuevo.id, tipo: 'entrada', cantidad: inicial,
        motivo: 'Stock inicial', referencia: 'ALTA-PRODUCTO', usuario: 'Administrador'
      }, true);
    }
    commit();
    return { producto: nuevo, avisos: avisos };
  };

  store.eliminarProducto = function (id) {
    state.productos = state.productos.filter(function (p) { return p.id !== id; });
    state.movimientos = state.movimientos.filter(function (m) { return m.productoId !== id; });
    commit();
  };

  store.eliminarProductos = function (ids) {
    var set = {};
    (ids || []).forEach(function (id) { set[id] = true; });
    state.productos = state.productos.filter(function (p) { return !set[p.id]; });
    state.movimientos = state.movimientos.filter(function (m) { return !set[m.productoId]; });
    commit();
  };

  store.toggleActivoProducto = function (id) {
    var p = store.getProducto(id);
    if (!p) throw new Error('El producto no existe.');
    p.activo = p.activo === false;
    p.actualizado = U.nowISO();
    commit();
    return p;
  };

  /* --- Movimientos --- */
  /**
   * Núcleo del inventario: aplica un movimiento y actualiza el stock.
   * @param {{productoId, tipo:'entrada'|'salida'|'ajuste', cantidad:number,
   *          motivo?:string, referencia?:string, usuario?:string, permitirNegativo?:boolean}} data
   * @param {boolean} silencioso  Si es true no dispara notificación (uso interno).
   */
  store._aplicarMovimiento = function (data, silencioso) {
    var prod = store.getProducto(data.productoId);
    if (!prod) throw new Error('Selecciona un producto válido.');

    var tipo = data.tipo;
    var cantidad = U.toNumber(data.cantidad);
    if (cantidad <= 0) throw new Error('La cantidad debe ser mayor que cero.');

    var stockPrevio = U.toNumber(prod.stock);
    var delta, stockFinal;

    if (tipo === 'entrada') {
      delta = cantidad;
      stockFinal = stockPrevio + cantidad;
    } else if (tipo === 'salida') {
      delta = -cantidad;
      stockFinal = stockPrevio - cantidad;
      if (stockFinal < 0 && !data.permitirNegativo) {
        var e = new Error('Stock insuficiente: solo hay ' + stockPrevio + ' ' + (prod.unidad || 'unidad') +
          '(s) de "' + prod.nombre + '".');
        e.codigo = 'STOCK_INSUFICIENTE';
        e.disponible = stockPrevio;
        throw e;
      }
    } else if (tipo === 'ajuste') {
      /* En un ajuste, "cantidad" es el nuevo stock real. */
      stockFinal = cantidad;
      delta = stockFinal - stockPrevio;
      if (delta === 0) {
        var err0 = new Error('El stock nuevo es igual al actual; no hay nada que ajustar.');
        err0.codigo = 'SIN_CAMBIOS';
        throw err0;
      }
    } else {
      throw new Error('Tipo de movimiento no válido.');
    }

    prod.stock = stockFinal;
    prod.actualizado = U.nowISO();

    var mov = {
      id: U.uid('mov'),
      productoId: prod.id,
      tipo: tipo,
      cantidad: Math.abs(delta),
      delta: delta,
      stockPrevio: stockPrevio,
      stockResultante: stockFinal,
      motivo: String(data.motivo || '').trim() || (tipo === 'entrada' ? 'Entrada de mercadería' : tipo === 'salida' ? 'Salida de mercadería' : 'Ajuste de inventario'),
      referencia: String(data.referencia || '').trim(),
      usuario: String(data.usuario || '').trim() || 'Administrador',
      costoUnitario: tipo === 'salida' ? U.toNumber(prod.precioVenta) : U.toNumber(prod.precioCompra),
      fecha: data.fecha ? new Date(data.fecha).toISOString() : U.nowISO()
    };
    state.movimientos.push(mov);

    if (!silencioso) commit();
    return mov;
  };

  store.registrarMovimiento = function (data) {
    var mov = store._aplicarMovimiento(data, false);
    return { movimiento: mov, producto: store.getProducto(data.productoId) };
  };

  store.eliminarMovimiento = function (id) {
    var mov = state.movimientos.filter(function (m) { return m.id === id; })[0];
    if (!mov) throw new Error('El movimiento no existe.');
    var prod = store.getProducto(mov.productoId);
    if (prod) {
      /* Revertimos el efecto del movimiento sobre el stock. */
      var delta = mov.delta !== undefined ? mov.delta
        : (mov.tipo === 'salida' ? -U.toNumber(mov.cantidad) : U.toNumber(mov.cantidad));
      prod.stock = U.toNumber(prod.stock) - delta;
      prod.actualizado = U.nowISO();
    }
    state.movimientos = state.movimientos.filter(function (m) { return m.id !== id; });
    commit();
  };

  store.movimientosDeProducto = function (productoId) {
    return store.listMovimientos().filter(function (m) { return m.productoId === productoId; });
  };

  /* --- Importar / exportar / reiniciar --- */
  store.exportarJSON = function () {
    return JSON.stringify({
      app: 'InventarioPro',
      version: VERSION,
      exportado: U.nowISO(),
      data: state
    }, null, 2);
  };

  store.importarJSON = function (texto) {
    var parsed;
    try { parsed = JSON.parse(texto); }
    catch (e) { throw new Error('El archivo no es un JSON válido.'); }
    var data = parsed && parsed.data ? parsed.data : parsed;
    if (!data || !Array.isArray(data.productos)) {
      throw new Error('El archivo no contiene una copia de seguridad válida.');
    }
    var base = defaultState();
    state = {
      version: VERSION,
      empresa: Object.assign(base.empresa, data.empresa || {}),
      categorias: data.categorias || [],
      proveedores: data.proveedores || [],
      productos: data.productos || [],
      movimientos: data.movimientos || [],
      meta: Object.assign(base.meta, data.meta || {}, { demo: false })
    };
    commit();
    return { productos: state.productos.length, movimientos: state.movimientos.length };
  };

  store.cargarDemo = function () {
    state = seed();
    commit();
  };

  store.vaciar = function () {
    var base = defaultState();
    base.meta.demo = false;
    state = base;
    commit();
  };

  store.restaurarTema = function () {
    var tema = state.empresa.tema;
    document.documentElement.setAttribute('data-theme', tema === 'dark' ? 'dark' : 'light');
  };

  store.cambiarTema = function () {
    var nuevo = state.empresa.tema === 'dark' ? 'light' : 'dark';
    state.empresa.tema = nuevo;
    document.documentElement.setAttribute('data-theme', nuevo);
    commit();
    return nuevo;
  };

  /* ============================== Arranque =============================== */
  function init() {
    var cargado = load();
    state = cargado || seed();
    if (!cargado) persist();
    store.restaurarTema();
  }

  init();

  App.store = store;
})(window.Inventario);
