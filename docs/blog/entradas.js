/* Índice del blog GITECA. Para publicar una entrada:
   1) copia blog/plantilla.html como blog/<slug>.html y escribe el artículo;
   2) agrega aquí un objeto (las más recientes arriba);
   3) la portada del sitio y blog/index.html se actualizan solas. */
window.GITECA_BLOG = [
  {
    slug: "herramienta-inventario-pgmf",
    titulo: "Diseña el inventario de tu PGMF en minutos, no en días",
    resumen: "Con un solo shapefile de tipos de bosque, la app calcula superficies, número e intensidad de parcelas, las distribuye por estrato y las exporta listas para el GPS.",
    fecha: '2026-10-14',
    etiquetas: ["Herramientas GITECA", "Inventarios", "Planes de manejo"],
    imagen: "img/herramienta-inventario-pgmf.jpg",
    autor: 'Equipo GITECA'
  },
  {
    slug: "herramienta-calculadora-inventarios",
    titulo: "Del CSV de tu inventario al IVI, volumen y biomasa en un clic",
    resumen: "Sube el inventario en CSV y obtén N/ha, área basal, volumen, IVI, diversidad, curva de acumulación y biomasa aérea, sin fórmulas en Excel.",
    fecha: '2026-10-14',
    etiquetas: ["Herramientas GITECA", "Inventarios", "Ciencia de datos"],
    imagen: "img/herramienta-calculadora-inventarios.jpg",
    autor: 'Equipo GITECA'
  },
  {
    slug: "herramienta-planificador-muestreo",
    titulo: "¿Cuántas parcelas necesita tu inventario? Calcúlalo antes de ir al campo",
    resumen: "A partir de un inventario piloto o de un coeficiente de variación, la app calcula el número de parcelas, la intensidad y el error de muestreo esperado.",
    fecha: '2026-10-14',
    etiquetas: ["Herramientas GITECA", "Inventarios", "Estadística"],
    imagen: "img/herramienta-planificador-muestreo.jpg",
    autor: 'Equipo GITECA'
  },
  {
    slug: "herramienta-explorador-tesis",
    titulo: "1 063 tesis forestales de la UNAP, a un buscador de distancia",
    resumen: "Busca y filtra las tesis de la Facultad de Ciencias Forestales (1984–2026) por tema, año, escuela y asesor, y descubre tendencias y redes de investigación.",
    fecha: '2026-10-14',
    etiquetas: ["Herramientas GITECA", "Investigación"],
    imagen: "img/herramienta-explorador-tesis.jpg",
    autor: 'Equipo GITECA'
  },
  {
    slug: "herramienta-vacios-investigacion",
    titulo: "¿Dónde falta investigar en Loreto? Un mapa para encontrar vacíos de conocimiento",
    resumen: "Mapa de tesis forestales por localidad y matriz localidad × tema para ver qué zonas y qué temas casi no se han estudiado.",
    fecha: '2026-10-14',
    etiquetas: ["Herramientas GITECA", "Investigación", "Cartografía"],
    imagen: "img/herramienta-vacios-investigacion.jpg",
    autor: 'Equipo GITECA'
  },
  {
    slug: "herramienta-coeficientes-madera",
    titulo: "Densidad y propiedades de 43 maderas amazónicas, cada dato con su tesis",
    resumen: "Densidad básica, contracciones, relación T/R, MOE y MOR de 43 especies, extraídos de 23 tesis de la FCF-UNAP y revisados a mano.",
    fecha: '2026-10-14',
    etiquetas: ["Herramientas GITECA", "Tecnología de la madera", "Investigación"],
    imagen: "img/herramienta-coeficientes-madera.jpg",
    autor: 'Equipo GITECA'
  },
  {
    slug: "herramienta-visor-tesis-cobertura",
    titulo: "¿Sigue en pie el bosque donde se hizo tu tesis?",
    resumen: "App de Google Earth Engine que calcula el bosque del año 2000 y la pérdida anual 2001–2023 alrededor de un sitio de tesis de la FCF-UNAP o de tu propia área.",
    fecha: '2026-10-14',
    etiquetas: ["Herramientas GITECA", "Teledetección", "Investigación"],
    imagen: "img/herramienta-visor-tesis-cobertura.jpg",
    autor: 'Equipo GITECA'
  },
  {
    slug: "herramienta-biomasa-gedi",
    titulo: "Biomasa y carbono de tu área con el láser espacial GEDI",
    resumen: "App de Google Earth Engine que estima la biomasa aérea media, su error estándar y el carbono aéreo de tu área con GEDI L4B.",
    fecha: '2026-10-14',
    etiquetas: ["Herramientas GITECA", "Teledetección", "Carbono"],
    imagen: "img/herramienta-biomasa-gedi.jpg",
    autor: 'Equipo GITECA'
  },
  {
    slug: "herramienta-fenologia-aguajales",
    titulo: "El pulso anual de los aguajales, visto desde el satélite",
    resumen: "App de Google Earth Engine con series de tiempo EVI (MODIS) y NDVI (Sentinel-2) y el perfil mensual de aguajales y otros bosques.",
    fecha: '2026-10-14',
    etiquetas: ["Herramientas GITECA", "Teledetección", "Monitoreo"],
    imagen: "img/herramienta-fenologia-aguajales.jpg",
    autor: 'Equipo GITECA'
  },
  {
    slug: "herramienta-alertas-deforestacion",
    titulo: "Alertas de deforestación en tu área, con prioridad de atención",
    resumen: "App de Google Earth Engine que suma las hectáreas con alertas de radar RADD en tu área, por año y nivel de confianza, y asigna una prioridad de atención.",
    fecha: '2026-10-14',
    etiquetas: ["Herramientas GITECA", "Teledetección", "Control forestal"],
    imagen: "img/herramienta-alertas-deforestacion.jpg",
    autor: 'Equipo GITECA'
  },
  {
    slug: "herramienta-hidroperiodo",
    titulo: "¿Cuántos meses al año se inunda tu bosque?",
    resumen: "App de Google Earth Engine que estima, para el año que elijas, cuántos meses se inunda el bosque bajo el dosel, con radar Sentinel-1 y agua superficial de JRC.",
    fecha: '2026-10-14',
    etiquetas: ["Herramientas GITECA", "Teledetección", "Planificación"],
    imagen: "img/herramienta-hidroperiodo.jpg",
    autor: 'Equipo GITECA'
  },
  {
    slug: "herramienta-visor-forestal",
    titulo: "El patrimonio forestal del Perú en un solo mapa",
    resumen: "Concesiones, Bosques de Producción Permanente, deforestación, incendios, focos de calor, especies CITES y puestos de control, en un visor web.",
    fecha: '2026-10-14',
    etiquetas: ["Herramientas GITECA", "Cartografía", "Datos abiertos"],
    imagen: "img/herramienta-visor-forestal.jpg",
    autor: 'Equipo GITECA'
  },
  {
    slug: "herramienta-reporte-patrimonio",
    titulo: "Patrimonio forestal en cifras: deforestación, concesiones e incendios con filtros",
    resumen: "Reporte interactivo en Looker Studio con 36 158 polígonos de deforestación (2017–2026), concesiones por modalidad e incendios 2026.",
    fecha: '2026-10-14',
    etiquetas: ["Herramientas GITECA", "Tableros", "Datos abiertos"],
    imagen: "img/herramienta-reporte-patrimonio.jpg",
    autor: 'Equipo GITECA'
  },
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
