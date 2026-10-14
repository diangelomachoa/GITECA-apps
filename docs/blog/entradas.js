/* Índice del blog GITECA. Para publicar una entrada:
   1) copia blog/plantilla.html como blog/<slug>.html y escribe el artículo;
   2) agrega aquí un objeto (las más recientes arriba);
   3) la portada del sitio y blog/index.html se actualizan solas. */
window.GITECA_BLOG = [
  {
    slug: 'rustgis-v0-2-duckdb-mcp',
    titulo: 'RustGIS 0.2: SQL con DuckDB y mapas hechos por agentes de IA',
    resumen: 'Más formatos (GeoPackage, GeoParquet, File Geodatabase), consultas SQL y un servidor MCP: qué cambia para automatizar el control y monitoreo forestal.',
    fecha: '2026-10-14',
    etiquetas: ['SIG libre', 'Automatización', 'Inteligencia artificial'],
    imagen: 'img/rustgis-v0-2-0.jpg',
    autor: 'Gino Machoa'
  },
  {
    slug: 'rustgis-sig-libre-en-rust',
    titulo: 'RustGIS: un SIG libre, en el navegador y con asistente de IA',
    resumen: 'La primera versión de RustGIS trae más de 1 000 herramientas, series de mapas y un asistente de IA. Cómo lo usaríamos en planes de manejo y supervisión.',
    fecha: '2026-10-14',
    etiquetas: ['SIG libre', 'Inteligencia artificial', 'Cartografía'],
    imagen: 'img/rustgis-v0-1-0.jpg',
    autor: 'Gino Machoa'
  },
  /* {
    slug: 'ejemplo-novedad',                 // nombre del archivo, sin .html
    titulo: 'Título de la entrada',
    resumen: 'Una o dos oraciones: la novedad y para qué sirve en el bosque.',
    fecha: '2026-10-14',                      // AAAA-MM-DD
    etiquetas: ['Teledetección', 'Monitoreo'],
    imagen: 'img/ejemplo-novedad.jpg',        // 1200×675 px, relativa a blog/
    autor: 'Gino Machoa'
  }, */
];

(function () {
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
  function fecha(iso) { var p = iso.split('-'); return +p[2] + ' ' + MESES[+p[1] - 1] + ' ' + p[0]; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* Pinta tarjetas en `contenedor`. base: ruta a la carpeta blog/ desde la página que llama. */
  window.GitecaBlog = {
    etiquetas: function () {
      var vistas = {};
      window.GITECA_BLOG.forEach(function (e) { e.etiquetas.forEach(function (t) { vistas[t] = 1; }); });
      return Object.keys(vistas).sort();
    },
    tarjetas: function (contenedor, opc) {
      opc = opc || {};
      var base = opc.base || '';
      var lista = window.GITECA_BLOG.slice().sort(function (a, b) { return a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0; });
      if (opc.etiqueta) lista = lista.filter(function (e) { return e.etiquetas.indexOf(opc.etiqueta) >= 0; });
      if (opc.limite) lista = lista.slice(0, opc.limite);
      if (!lista.length) { contenedor.innerHTML = '<p class="vacio">' + (opc.vacio || 'Aún no hay entradas publicadas.') + '</p>'; return 0; }
      contenedor.innerHTML = lista.map(function (e) {
        return '<a class="post-card" href="' + base + e.slug + '.html">' +
          (e.imagen ? '<img src="' + base + esc(e.imagen) + '" alt="" loading="lazy">' : '') +
          '<div class="cuerpo"><span class="meta"><time datetime="' + e.fecha + '">' + fecha(e.fecha) + '</time>' +
          (e.autor ? '<span>' + esc(e.autor) + '</span>' : '') + '</span>' +
          '<h3>' + esc(e.titulo) + '</h3><p>' + esc(e.resumen) + '</p>' +
          '<div class="tags">' + e.etiquetas.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div></div></a>';
      }).join('');
      return lista.length;
    }
  };
})();
