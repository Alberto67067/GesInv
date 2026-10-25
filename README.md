# InventarioPro · Frontend de gestión de inventario

Aplicación web **instalable (PWA)** para administrar el inventario de un negocio: productos,
existencias, movimientos, proveedores, categorías y reportes.

Funciona **sin servidor ni base de datos**: los datos se guardan en el navegador.
Está lista para publicarse en **GitHub Pages** y usarse como app en **iPhone y Android**.

---

## 1. Publicar en GitHub Pages (10 minutos)

### Paso 1 · Crear el repositorio

Entra a [github.com/new](https://github.com/new) y crea un repositorio, por ejemplo `inventario`.

- Puede ser **público** (GitHub Pages gratis) o privado (requiere plan de pago para publicar).
- **No** marques "Add a README file" (ya tienes uno).

### Paso 2 · Subir los archivos

**Opción A — sin instalar nada (desde el navegador)**

1. En tu repositorio vacío pulsa **uploading an existing file**.
2. Arrastra **todo el contenido** de esta carpeta: `index.html`, `manifest.webmanifest`, `sw.js`,
   `.nojekyll`, `README.md` y las carpetas `assets/`.
3. Escribe un mensaje como `Versión inicial` y pulsa **Commit changes**.

> ⚠️ Deben subirse **la carpeta `assets/` completa y los archivos ocultos** (`.nojekyll`).
> Si `assets/` no sube, la app se verá sin estilos.

**Opción B — con Git instalado**

```bash
cd "ruta/a/Proyecto predeterminado"
git init
git add -A
git commit -m "InventarioPro: versión inicial"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/inventario.git
git push -u origin main
```

### Paso 3 · Activar GitHub Pages

1. En el repositorio ve a **Settings → Pages**.
2. En *Source* elige **Deploy from a branch**.
3. Branch: **main** · Folder: **/ (root)** · pulsa **Save**.
4. Espera 1–2 minutos. Tu app estará en:

```
https://TU-USUARIO.github.io/inventario/
```

Ese es el enlace que abrirás en el móvil.

> **Guarda este enlace.** Si algún día cambias el nombre del repositorio, la dirección cambia y el
> navegador lo trata como un sitio distinto: verías el inventario **vacío**. Exporta un respaldo
> antes de renombrar nada.

---

## 2. Instalar en el iPhone y en Android

Abre el enlace de GitHub Pages en el móvil. La app mostrará un aviso para instalarla.

### iPhone (Safari)

1. Abre el enlace **en Safari** (no en Chrome ni dentro de WhatsApp/Instagram).
2. Toca **Compartir** (el cuadro con la flecha hacia arriba, abajo).
3. Elige **“Añadir a pantalla de inicio”** → **Añadir**.
4. Ábrela desde el nuevo icono: se verá a pantalla completa, sin barras del navegador.

> **Muy importante en iPhone:** Safari borra los datos guardados por una web si pasan **7 días sin
> abrirla**. Al instalarla en la pantalla de inicio queda **exenta** de esa regla y tus datos se
> conservan. No te saltes este paso.

### Android (Chrome)

1. Abre el enlace en Chrome.
2. Menú **⋮** (arriba a la derecha) → **Instalar aplicación** (o *Añadir a pantalla de inicio*).
3. Confirma. Aparecerá el icono junto a tus apps.

También puedes instalarla desde **Configuración → Aplicación en el móvil → Instalar**.

### Qué obtienes al instalarla

| Ventaja | Detalle |
| --- | --- |
| Pantalla completa | Sin barras del navegador, con área segura para el notch |
| Funciona sin conexión | Se abre aunque no tengas datos o wifi (service worker) |
| Icono propio | Aparece junto a tus demás aplicaciones |
| Datos protegidos | En iPhone evita el borrado automático a los 7 días |
| Accesos directos | Mantén pulsado el icono: Productos, Movimientos, Reportes |

---

## 3. Entender los datos (lee esto antes de cargar tu inventario)

**Cada dispositivo tiene su propio inventario.** El iPhone y el Android **no** se sincronizan solos:
no hay servidor, así que cada uno guarda su copia en su navegador.

El respaldo JSON es el mecanismo para mover la información:

```
iPhone  →  Configuración → Compartir respaldo  →  WhatsApp / Drive / Correo / Archivos
                                                          ↓
Android →  Configuración → Restaurar  →  selecciona el archivo
```

**Recomendaciones**

- Trabaja en **un solo dispositivo** como fuente principal (por ejemplo el teléfono del negocio).
- Usa el otro para consultar o para emergencias, restaurando el respaldo cuando lo necesites.
- **Haz un respaldo cada semana.** La app te avisa en Configuración si pasan 7 días sin respaldar.
- *Compartir respaldo* usa el menú nativo del teléfono: mándalo a tu Drive o a ti mismo por correo.

Si más adelante quieres que **varios dispositivos y personas trabajen a la vez sobre los mismos
datos**, eso ya requiere un backend con base de datos (ver sección 8).

---

## 4. Funcionalidades

### Panel
- Indicadores: valor del inventario (costo y venta), productos activos, por reponer, movimientos del día.
- Gráfica de flujo de unidades (7 / 14 / 30 días) entradas vs. salidas.
- Dona de valor por categoría, reposición sugerida, últimos movimientos y ranking de rotación.

### Productos
- Búsqueda tolerante a acentos, filtros por categoría / proveedor / estado y orden por columna.
- **En el móvil se muestran como tarjetas** (sin scroll horizontal); en escritorio, tabla completa.
- Selección múltiple con acciones en lote (exportar, activar/desactivar, eliminar).
- CRUD validado (SKU único), ficha con márgenes e historial, ajuste de stock auditado.
- Exportar e **importar CSV** (crea las categorías que falten).

### Movimientos
- Registro guiado de **entradas, salidas y ajustes** con validación de stock en vivo y
  previsualización del stock resultante.
- Historial filtrable por texto, tipo y fechas, con stock antes/después.
- Anulación de movimientos revirtiendo su efecto. Exportación a CSV.

### Categorías y proveedores
- Tarjetas con métricas por categoría y protección contra borrado si tienen productos.
- Proveedores con ficha, productos suministrados y últimas entradas recibidas.

### Reportes
- **Valorización**, **Rotación** (con días de cobertura), **Reposición** (orden de compra sugerida
  agrupada por proveedor) y **Kardex**.
- Exportación CSV / JSON e impresión optimizada.

### Configuración
- Datos de la empresa, moneda y formato regional (todos los importes se formatean según la config).
- Tema claro / oscuro, respaldo y restauración, datos de ejemplo, borrado total.
- Medidor de almacenamiento, estado de instalación y atajos de teclado.

### Móvil
- Botón flotante (**+**) con hoja de acciones: entrada, salida, ajuste y nuevo producto.
- Área segura para el notch, sin zoom automático al escribir, objetivos táctiles de 42 px.
- Funciona sin conexión y se actualiza sola cuando hay red.

---

## 5. Estructura del proyecto

```
index.html                      Estructura, metadatos PWA y layout
manifest.webmanifest            Ficha de instalación (nombre, iconos, colores)
sw.js                           Service worker: caché y uso sin conexión
.nojekyll                       Evita el procesado Jekyll de GitHub Pages
assets/
  css/styles.css                Sistema de diseño + reglas responsive y móvil
  js/
    utils.js                    Formato de números/fechas, CSV, descargas, DOM
    store.js                    Estado, persistencia, reglas de negocio, datos demo
    ui.js                       Modales, toasts, iconos, formularios, paginación
    charts.js                   Gráficas SVG propias (barras, dona, línea)
    views/                      dashboard · productos · movimientos · categorias
                                proveedores · reportes · configuracion
    app.js                      Enrutador, navegación, PWA, FAB, atajos
```

Sin dependencias externas: no hay `node_modules`, ni CDN, ni paso de compilación.

---

## 6. Actualizar la aplicación publicada

Cuando cambies algún archivo:

1. Sube los cambios a GitHub (commit y push, o desde la web).
2. **Sube el número de versión en `sw.js`:**

```js
var VERSION = '1.0.0';   //  →  '1.0.1'
```

Eso obliga a los móviles a descartar la caché antigua y descargar la nueva.

3. En el teléfono, cierra la app y vuelve a abrirla. Verás el aviso *“Actualización disponible”*.

> Los **datos no se tocan** al actualizar: viven en el almacenamiento del navegador, no en la caché.

---

## 7. Cómo funciona por dentro

### Persistencia
Todo el estado se serializa en `localStorage` bajo la clave `inventariopro.db.v1`.
Medido en pruebas: **~263 bytes por movimiento**, unos **20.000 movimientos** antes de acercarse al
límite de 5 MB. Configuración muestra el consumo real.

### Reglas de negocio (`assets/js/store.js`)
- **Ningún** cambio de stock ocurre sin generar un movimiento auditado.
- `entrada` suma, `salida` resta (bloqueada si no hay existencias) y `ajuste` fija el stock real.
- Editar el stock desde la ficha del producto crea un ajuste automático.
- Anular un movimiento revierte su efecto.
- Estados calculados: `agotado` (0), `crítico` (≤ 50 % del mínimo), `bajo` (≤ mínimo), `disponible`.

### Modelo de datos

```js
Producto   { id, sku, nombre, descripcion, categoriaId, proveedorId,
             precioCompra, precioVenta, stock, stockMinimo,
             unidad, ubicacion, activo, creado, actualizado }

Movimiento { id, productoId, tipo: 'entrada'|'salida'|'ajuste',
             cantidad, delta, stockPrevio, stockResultante,
             motivo, referencia, usuario, costoUnitario, fecha }

Categoria  { id, nombre, descripcion, creado }
Proveedor  { id, nombre, contacto, email, telefono, direccion, ruc, notas, creado }
Empresa    { nombre, ruc, direccion, moneda, locale, stockMinimoDefault, tema }
```

### Caché sin conexión
`sw.js` precarga el app shell. Las páginas usan estrategia **red primero** (para recibir
actualizaciones) y los recursos estáticos **caché primero con revalidación**. Los archivos se
localizan con rutas relativas, por lo que funciona igual en `usuario.github.io/inventario/`.

---

## 8. Conectar un backend (siguiente paso)

Si necesitas varios usuarios o sincronización entre dispositivos, el frontend ya está preparado:
todas las vistas consumen solo `App.store`, nunca `localStorage` directamente.

1. Sustituye los métodos de escritura de `store.js` por llamadas `fetch`:

```js
store.guardarProducto = async function (data) {
  var res = await fetch('/api/productos', {
    method: data.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).mensaje);
  await store.recargar();
  return { producto: (await res.json()).data, avisos: [] };
};
```

2. Cambia `commit()` para refrescar desde la API en lugar de escribir en `localStorage`:

```js
function commit() { notify(); }               // sin persist()
store.recargar = async function () {
  state = await (await fetch('/api/inventario')).json();
  notify();
};
```

Endpoints sugeridos:

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/inventario` | Estado completo |
| `POST` / `PUT` | `/api/productos` | Crear / actualizar producto |
| `DELETE` | `/api/productos/:id` | Eliminar producto |
| `POST` | `/api/movimientos` | Registrar entrada, salida o ajuste |
| `DELETE` | `/api/movimientos/:id` | Anular movimiento |

---

## 9. Personalización rápida

- **Colores y tipografía**: variables CSS en `:root` de `assets/css/styles.css`
  (tema oscuro en `html[data-theme="dark"]`).
- **Moneda y formato**: desde *Configuración* o en `defaultState()` de `store.js`.
- **Unidades de medida**: array `UNIDADES` en `views/productos.js`.
- **Motivos de movimiento**: objeto `MOTIVOS` en `views/movimientos.js`.
- **Datos de ejemplo**: `CATEGORIAS_DEMO`, `PROVEEDORES_DEMO` y `PRODUCTOS_DEMO` en `store.js`.
- **Iconos de la app**: están incrustados en base64 dentro de `manifest.webmanifest` y en el
  `<link rel="apple-touch-icon">` de `index.html`. Para cambiarlos, genera PNG de 180, 192 y 512 px
  y sustitúyelos.

---

## 10. Preguntas frecuentes

**¿Necesito base de datos?**
No. Para un negocio que trabaja desde uno o dos dispositivos, `localStorage` + respaldos es suficiente.

**¿Puedo usarla sin internet?**
Sí, una vez abierta la primera vez queda cacheada. Si añades datos sin conexión, se guardan igual.

**Abrí el enlace en el móvil y veo un inventario de ejemplo.**
Es la demostración inicial. Ve a *Configuración → Borrar todo* y empieza de cero, o edita los datos.

**¿Por qué en el iPhone no me aparece el botón de instalar?**
Safari no lo ofrece: hay que usar **Compartir → Añadir a pantalla de inicio**. La app te lo explica.

**¿Se pierden los datos si borro el historial del navegador?**
Sí. Por eso la app insiste con los respaldos y avisa cada 7 días.

**¿Puedo abrirla en la computadora y en el móvil a la vez?**
Sí, pero con inventarios independientes. Para unificarlos, exporta el respaldo de uno e impórtalo en el otro.

---

## 11. Compatibilidad

Chrome, Edge, Firefox y Safari actuales, en escritorio y móvil. Se usan `Intl.NumberFormat`,
`color-mix()`, `backdrop-filter`, `env(safe-area-inset-*)`, service workers y `MutationObserver`.
El service worker requiere **HTTPS** (GitHub Pages lo aporta) o `localhost`; al abrir el archivo
directamente con `file://` la app funciona, pero sin modo offline ni instalación.
