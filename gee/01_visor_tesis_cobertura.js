// =============================================================================
// © 2026 Gino Machoa. Todos los derechos reservados.
// Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
// Contacto: diangelomachoa@gmail.com
// Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.
// GITECA | GEE 01 — Visor espacial de tesis FCF-UNAP y cambio de cobertura
// Sitios: localidades citadas en 1 063 tesis del Repositorio UNAP (coordenadas
// aproximadas a nivel de localidad, ver data/tesis_localidades.csv en el repo).
// Pérdida de bosque: Hansen et al. (2013) Global Forest Change v1.11 (2001–2023).
// Pregunta: ¿cuánto bosque se perdió alrededor de cada sitio DESPUÉS de estudiarlo?
// =============================================================================
var sitios = ee.FeatureCollection([
  ee.Feature(ee.Geometry.Point([-73.43,-3.95]),{localidad:'Allpahuayo-Mishana',n:35,anio_min:2006,anio_max:2026,tema:'Áreas protegidas/conservación/turismo'}),
  ee.Feature(ee.Geometry.Point([-76.1,-5.5]),{localidad:'Alto Amazonas',n:8,anio_min:2006,anio_max:2026,tema:'Inventario/estructura/diversidad'}),
  ee.Feature(ee.Geometry.Point([-72.3,-2.9]),{localidad:'Ampiyacu-Apayacu',n:6,anio_min:2007,anio_max:2019,tema:'Manejo forestal/aprovechamiento/economía'}),
  ee.Feature(ee.Geometry.Point([-73.37,-3.82]),{localidad:'Arboretum El Huayo',n:84,anio_min:2000,anio_max:2026,tema:'Carbono/biomasa/clima'}),
  ee.Feature(ee.Geometry.Point([-73.24,-3.76]),{localidad:'Belén',n:16,anio_min:2008,anio_max:2025,tema:'Tecnología de la madera'}),
  ee.Feature(ee.Geometry.Point([-70.52,-3.91]),{localidad:'Caballococha',n:1,anio_min:2012,anio_max:2012,tema:'Carbono/biomasa/clima'}),
  ee.Feature(ee.Geometry.Point([-75.01,-7.35]),{localidad:'Contamana',n:12,anio_min:2012,anio_max:2026,tema:'Manejo forestal/aprovechamiento/economía'}),
  ee.Feature(ee.Geometry.Point([-76.7,-4.5]),{localidad:'Datem del Marañón',n:10,anio_min:2013,anio_max:2021,tema:'Inventario/estructura/diversidad'}),
  ee.Feature(ee.Geometry.Point([-73.04,-3.5]),{localidad:'Indiana',n:7,anio_min:2012,anio_max:2026,tema:'Carbono/biomasa/clima'}),
  ee.Feature(ee.Geometry.Point([-73.45,-4.1]),{localidad:'Iquitos-Nauta (carretera)',n:45,anio_min:2002,anio_max:2024,tema:'Silvicultura/regeneración/plantaciones'}),
  ee.Feature(ee.Geometry.Point([-73.67,-4.9]),{localidad:'Jenaro Herrera',n:25,anio_min:2003,anio_max:2024,tema:'Silvicultura/regeneración/plantaciones'}),
  ee.Feature(ee.Geometry.Point([-71.0,-3.9]),{localidad:'Mariscal Ramón Castilla',n:45,anio_min:2012,anio_max:2026,tema:'Tecnología de la madera'}),
  ee.Feature(ee.Geometry.Point([-73.09,-3.5]),{localidad:'Mazán',n:37,anio_min:2004,anio_max:2026,tema:'Carbono/biomasa/clima'}),
  ee.Feature(ee.Geometry.Point([-73.58,-4.51]),{localidad:'Nauta',n:67,anio_min:2001,anio_max:2026,tema:'Tecnología de la madera'}),
  ee.Feature(ee.Geometry.Point([-74.8,-5.3]),{localidad:'Pacaya-Samiria',n:12,anio_min:2003,anio_max:2019,tema:'Manejo forestal/aprovechamiento/economía'}),
  ee.Feature(ee.Geometry.Point([-71.86,-3.32]),{localidad:'Pebas',n:5,anio_min:2018,anio_max:2026,tema:'Manejo forestal/aprovechamiento/economía'}),
  ee.Feature(ee.Geometry.Point([-75.3,-2.4]),{localidad:'Pucacuro',n:1,anio_min:2017,anio_max:2017,tema:'Manejo forestal/aprovechamiento/economía'}),
  ee.Feature(ee.Geometry.Point([-74.55,-8.38]),{localidad:'Pucallpa',n:7,anio_min:2011,anio_max:2025,tema:'Silvicultura/regeneración/plantaciones'}),
  ee.Feature(ee.Geometry.Point([-73.38,-3.83]),{localidad:'Puerto Almendra',n:310,anio_min:1984,anio_max:2026,tema:'Silvicultura/regeneración/plantaciones'}),
  ee.Feature(ee.Geometry.Point([-73.24,-3.72]),{localidad:'Punchana',n:41,anio_min:2005,anio_max:2025,tema:'Tecnología de la madera'}),
  ee.Feature(ee.Geometry.Point([-73.0,-2.2]),{localidad:'Putumayo (prov.)',n:1,anio_min:2019,anio_max:2019,tema:'Tecnología de la madera'}),
  ee.Feature(ee.Geometry.Point([-73.32,-3.83]),{localidad:'Quistococha',n:15,anio_min:2012,anio_max:2024,tema:'Silvicultura/regeneración/plantaciones'}),
  ee.Feature(ee.Geometry.Point([-73.85,-5.06]),{localidad:'Requena',n:27,anio_min:2001,anio_max:2024,tema:'Tecnología de la madera'}),
  ee.Feature(ee.Geometry.Point([-73.5,-5.4]),{localidad:'Reserva Nacional Matsés',n:2,anio_min:2017,anio_max:2024,tema:'Fauna silvestre/ecología animal'}),
  ee.Feature(ee.Geometry.Point([-72.5,-3.6]),{localidad:'Río Amazonas',n:20,anio_min:2000,anio_max:2025,tema:'Tecnología de la madera'}),
  ee.Feature(ee.Geometry.Point([-75.5,-3.2]),{localidad:'Río Corrientes',n:1,anio_min:2017,anio_max:2017,tema:'Manejo forestal/aprovechamiento/economía'}),
  ee.Feature(ee.Geometry.Point([-75.9,-5.4]),{localidad:'Río Huallaga',n:1,anio_min:2017,anio_max:2017,tema:'Manejo forestal/aprovechamiento/economía'}),
  ee.Feature(ee.Geometry.Point([-73.4,-4.0]),{localidad:'Río Itaya',n:13,anio_min:2010,anio_max:2024,tema:'Tecnología de la madera'}),
  ee.Feature(ee.Geometry.Point([-72.9,-3.6]),{localidad:'Río Manití',n:3,anio_min:2012,anio_max:2026,tema:'Manejo forestal/aprovechamiento/economía'}),
  ee.Feature(ee.Geometry.Point([-74.5,-4.7]),{localidad:'Río Marañón',n:5,anio_min:2001,anio_max:2019,tema:'Manejo forestal/aprovechamiento/economía'}),
  ee.Feature(ee.Geometry.Point([-73.3,-3.68]),{localidad:'Río Momón',n:8,anio_min:2007,anio_max:2022,tema:'Manejo forestal/aprovechamiento/economía'}),
  ee.Feature(ee.Geometry.Point([-73.6,-3.75]),{localidad:'Río Nanay',n:70,anio_min:2000,anio_max:2025,tema:'Manejo forestal/aprovechamiento/economía'}),
  ee.Feature(ee.Geometry.Point([-73.0,-3.0]),{localidad:'Río Napo',n:12,anio_min:2002,anio_max:2024,tema:'Carbono/biomasa/clima'}),
  ee.Feature(ee.Geometry.Point([-76.3,-3.9]),{localidad:'Río Pastaza',n:3,anio_min:2013,anio_max:2019,tema:'Carbono/biomasa/clima'}),
  ee.Feature(ee.Geometry.Point([-72.5,-2.5]),{localidad:'Río Putumayo',n:34,anio_min:2000,anio_max:2022,tema:'Manejo forestal/aprovechamiento/economía'}),
  ee.Feature(ee.Geometry.Point([-73.1,-4.3]),{localidad:'Río Tahuayo',n:5,anio_min:2010,anio_max:2022,tema:'Productos no maderables/etnobotánica'}),
  ee.Feature(ee.Geometry.Point([-74.5,-3.5]),{localidad:'Río Tigre',n:1,anio_min:2013,anio_max:2013,tema:'Agroforestería/suelos'}),
  ee.Feature(ee.Geometry.Point([-74.1,-5.8]),{localidad:'Río Ucayali',n:16,anio_min:2009,anio_max:2024,tema:'Manejo forestal/aprovechamiento/economía'}),
  ee.Feature(ee.Geometry.Point([-71.5,-4.8]),{localidad:'Río Yavarí',n:34,anio_min:2001,anio_max:2025,tema:'Tecnología de la madera'}),
  ee.Feature(ee.Geometry.Point([-73.28,-3.78]),{localidad:'San Juan Bautista',n:164,anio_min:2002,anio_max:2026,tema:'Silvicultura/regeneración/plantaciones'}),
  ee.Feature(ee.Geometry.Point([-71.1,-4.02]),{localidad:'San Pablo',n:9,anio_min:2006,anio_max:2025,tema:'Inventario/estructura/diversidad'}),
  ee.Feature(ee.Geometry.Point([-73.35,-3.78]),{localidad:'Santa Clara',n:4,anio_min:2008,anio_max:2023,tema:'Tecnología de la madera'}),
  ee.Feature(ee.Geometry.Point([-73.33,-3.8]),{localidad:'Santo Tomás',n:2,anio_min:2023,anio_max:2025,tema:'Tecnología de la madera'}),
  ee.Feature(ee.Geometry.Point([-73.16,-4.0]),{localidad:'Tamshiyacu',n:15,anio_min:2006,anio_max:2025,tema:'Silvicultura/regeneración/plantaciones'}),
  ee.Feature(ee.Geometry.Point([-76.36,-6.49]),{localidad:'Tarapoto',n:2,anio_min:2000,anio_max:2009,tema:'Silvicultura/regeneración/plantaciones'}),
  ee.Feature(ee.Geometry.Point([-74.6,-7.0]),{localidad:'Ucayali (prov. Loreto)',n:9,anio_min:2013,anio_max:2025,tema:'Tecnología de la madera'}),
  ee.Feature(ee.Geometry.Point([-73.4,-3.9]),{localidad:'Varillal',n:37,anio_min:2011,anio_max:2026,tema:'Carbono/biomasa/clima'}),
  ee.Feature(ee.Geometry.Point([-76.08,-5.9]),{localidad:'Yurimaguas',n:3,anio_min:2006,anio_max:2017,tema:'Agroforestería/suelos'}),
  ee.Feature(ee.Geometry.Point([-73.36,-3.83]),{localidad:'Zungarococha',n:7,anio_min:2011,anio_max:2026,tema:'Silvicultura/regeneración/plantaciones'})

]);
var RADIO = 5000; // m, buffer de análisis alrededor de cada localidad
var gfc = ee.Image('UMD/hansen/global_forest_change_2023_v1_11');
var bosque2000 = gfc.select('treecover2000').gte(30);
var perdida = gfc.select('loss').and(bosque2000);
var anioPerdida = gfc.select('lossyear').add(2000);

// Pérdida posterior al primer año de estudio en cada sitio
var res = sitios.map(function(f) {
  var anio0 = ee.Number(f.get('anio_min')).max(2001);
  var buf = f.geometry().buffer(RADIO);
  var post = perdida.and(anioPerdida.gte(anio0));
  var areas = ee.Image.pixelArea().divide(1e4).addBands(bosque2000).addBands(post)
    .rename(['a','b','p']);
  var s = areas.updateMask(areas.select('b')).select('a').reduceRegion(ee.Reducer.sum(), buf, 30, null, null, false, 1e10);
  var sp = areas.updateMask(areas.select('p')).select('a').reduceRegion(ee.Reducer.sum(), buf, 30, null, null, false, 1e10);
  var b = ee.Number(s.get('a')), p = ee.Number(sp.get('a'));
  return f.set({bosque2000_ha: b, perdida_post_ha: p, perdida_pct: p.divide(b.max(1)).multiply(100)});
});

Map.setOptions('SATELLITE');
Map.setCenter(-73.6, -4.2, 7);
Map.addLayer(anioPerdida.updateMask(perdida), {min: 2001, max: 2023, palette: ['yellow','orange','red']}, 'Año de pérdida (Hansen)');
Map.addLayer(res.map(function(f){return f.buffer(RADIO);}), {color: '00FFFF'}, 'Buffers ' + RADIO/1000 + ' km', false);
Map.addLayer(res.style({color:'FFFFFF', fillColor:'1F5E3BCC', pointSize: 6}), {}, 'Sitios de tesis');

// Panel
var panel = ui.Panel({style: {width: '360px'}});
panel.add(ui.Label('GITECA · Tesis FCF-UNAP y pérdida de bosque', {fontWeight: 'bold', fontSize: '16px'}));
panel.add(ui.Label('Clic en un sitio para ver sus datos. Fuente tesis: Repositorio UNAP. Pérdida: Hansen GFC v1.11.', {fontSize: '11px'}));
var info = ui.Label('');
panel.add(info);
panel.add(ui.Chart.feature.byFeature(res.sort('perdida_pct', false).limit(15), 'localidad', 'perdida_pct')
  .setChartType('BarChart').setOptions({title: 'Top 15: % de bosque perdido tras el estudio', legend: 'none', colors: ['#B23A48']}));
ui.root.insert(0, panel);
Map.onClick(function(c) {
  var pt = ee.Geometry.Point([c.lon, c.lat]);
  var f = res.filterBounds(pt.buffer(RADIO)).first();
  f.evaluate(function(x) {
    if (!x) { info.setValue('Sin sitio cerca del clic.'); return; }
    var p = x.properties;
    info.setValue(p.localidad + ' — ' + p.n + ' tesis (' + p.anio_min + '–' + p.anio_max + '); tema más frecuente: ' + p.tema +
      '. Bosque 2000: ' + p.bosque2000_ha.toFixed(0) + ' ha; perdido desde ' + Math.max(p.anio_min,2001) + ': ' + p.perdida_post_ha.toFixed(0) + ' ha (' + p.perdida_pct.toFixed(1) + ' %).');
  });
});
Export.table.toDrive({collection: res, description: 'GITECA_tesis_perdida_bosque', fileFormat: 'CSV'});

// ============================ LEGAL Y MARCA GITECA ============================
var CFG = {nombre: 'Tesis FCF-UNAP y pérdida de bosque', subtitulo: 'Cambio de cobertura alrededor de sitios de investigación', version: '1.0',
  logo: '' // asset de imagen del logo GITECA (ver GUIA_GEE.md); vacío = cabecera en texto
};
var LEGAL = {
  para: '',
  finalidad: 'Relacionar los sitios citados en tesis de la FCF-UNAP con la pérdida de bosque posterior a su estudio.',
  avisoResultados: 'Coordenadas aproximadas a nivel de localidad; Hansen GFC detecta pérdida de dosel ≥30 % a 30 m y puede omitir degradación.',
  privacidadExtra: '',
  fuentes: [
    ['Hansen et al. (2013) GFC v1.11', 'CC BY 4.0', 'Pérdida de bosque 2001–2023'],
    ['Metadatos de tesis — Repositorio UNAP', 'Metadatos públicos; tesis con licencia de su autor', 'Sitios y años de estudio']
  ]
};
var GITECA_AUTOR = 'Gino Machoa';
var GITECA_CORREO = 'diangelomachoa@gmail.com';
var GITECA_PERFIL = 'Ing. en Ecología de Bosques Tropicales · Universidad Nacional de la Amazonía Peruana (UNAP), Iquitos';
var GITECA_MARCA = 'GITECA · Gestión de Información, Tecnología y Ciencias Ambientales';
var GITECA_WEB = 'https://diangelomachoa.github.io/GITECA-apps/';
var GITECA_ANIO = '2026';
var GITECA_VERDE = '#2E7D3E', GITECA_AZUL = '#1C5D99';

if (typeof panelDer === 'undefined') {
  var panelDer = ui.Panel({style: {width: '390px', shown: false, padding: '8px'}});
}
if (typeof abrirDer === 'undefined') {
  var abrirDer = function(titulo) {
    panelDer.clear();
    panelDer.style().set('shown', true);
    panelDer.add(ui.Panel([
      ui.Label(titulo, {fontWeight: 'bold', fontSize: '15px', color: GITECA_AZUL}),
      ui.Button({label: '✕', onClick: function() { panelDer.style().set('shown', false); }, style: {margin: '0 0 0 auto'}})
    ], ui.Panel.Layout.flow('horizontal')));
  };
}

function _p(txt, negrita) {
  return ui.Label(txt, {fontSize: '12px', whiteSpace: 'pre-wrap', fontWeight: negrita ? 'bold' : 'normal', margin: '4px 6px'});
}
function _enl(txt, url) {
  return ui.Label(txt, {fontSize: '12px', color: GITECA_AZUL, margin: '2px 6px'}, url);
}

// Cabecera con logo GITECA (asset de imagen RGB, bandas b1,b2,b3 0–255) o franja de texto
function cabeceraGiteca() {
  var p = ui.Panel({style: {padding: '4px 0'}});
  if (CFG.logo && CFG.logo !== '') {
    p.add(ui.Thumbnail({image: ee.Image(CFG.logo).visualize({bands: ['b1', 'b2', 'b3'], min: 0, max: 255}),
      params: {dimensions: 120, format: 'png'}, style: {width: '120px', height: '133px', margin: '0 auto'}}));
  } else {
    p.add(ui.Label('GITECA', {fontSize: '26px', fontWeight: 'bold', color: GITECA_AZUL, margin: '0 6px'}));
    p.add(ui.Label('Gestión de Información, Tecnología y Ciencias Ambientales', {fontSize: '11px', color: GITECA_VERDE, margin: '0 6px'}));
  }
  p.add(ui.Label(CFG.nombre, {fontSize: '17px', fontWeight: 'bold', margin: '8px 6px 0'}));
  if (CFG.subtitulo) { p.add(ui.Label(CFG.subtitulo, {fontSize: '12px', color: '#555', margin: '2px 6px'})); }
  return p;
}

function lineaAutor() {
  return ui.Label('Autor y desarrollador: ' + GITECA_AUTOR + ' · ' + GITECA_CORREO + ' · v' + CFG.version,
    {fontSize: '11px', color: '#666', margin: '0 6px 8px'});
}

function _filaFuente(f) {
  return ui.Panel([
    ui.Label(f[0], {fontSize: '11px', fontWeight: 'bold', width: '130px', margin: '2px 4px'}),
    ui.Label(f[1], {fontSize: '11px', width: '120px', margin: '2px 4px'}),
    ui.Label(f[2], {fontSize: '11px', width: '100px', margin: '2px 4px'})
  ], ui.Panel.Layout.flow('horizontal'));
}

function verLegal(seccion) {
  abrirDer('Avisos legales · ' + CFG.nombre + ' v' + CFG.version);
  if (seccion === 'autoria') {
    panelDer.add(_p('Autoría y copyright', true));
    panelDer.add(_p('© ' + GITECA_ANIO + ' ' + GITECA_AUTOR + '. Todos los derechos reservados. Autor y desarrollador: ' + GITECA_AUTOR + '.'));
    panelDer.add(_p(GITECA_PERFIL));
    panelDer.add(_p(GITECA_MARCA));
    panelDer.add(_p('Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.'));
    panelDer.add(_p('Cita sugerida: ' + GITECA_AUTOR + ' (' + GITECA_ANIO + '). ' + CFG.nombre + ', versión ' + CFG.version + ' [aplicación Google Earth Engine]. GITECA. ' + GITECA_WEB));
  } else if (seccion === 'terminos') {
    panelDer.add(_p('Términos y condiciones', true));
    panelDer.add(_p('Objeto. ' + LEGAL.finalidad));
    panelDer.add(_p('Uso permitido. Consulta y análisis con fines académicos, de investigación o de gestión. No se permite copiar, modificar ni redistribuir la aplicación o su código sin autorización escrita del autor.'));
    panelDer.add(_p('Naturaleza de los resultados. ' + LEGAL.avisoResultados + ' Los resultados se entregan «tal cual», con fines referenciales; no constituyen prueba ni pronunciamiento oficial.'));
    panelDer.add(_p('Responsabilidad. El autor no responde por decisiones tomadas con base en los resultados sin la verificación técnica de campo correspondiente.'));
    panelDer.add(_p('Google Earth Engine. El uso de la plataforma se rige por sus propios términos.'));
    panelDer.add(_enl('Términos de servicio de Google Earth Engine', 'https://earthengine.google.com/terms/'));
    panelDer.add(_p('Propiedad intelectual y ley aplicable. Decreto Legislativo N.° 822, Ley sobre el Derecho de Autor, y demás legislación peruana.'));
  } else if (seccion === 'privacidad') {
    panelDer.add(_p('Privacidad', true));
    panelDer.add(_p('La aplicación no recoge datos personales ni guarda las geometrías que el usuario dibuja: se procesan en la sesión y se pierden al cerrarla.'));
    if (LEGAL.privacidadExtra) { panelDer.add(_p(LEGAL.privacidadExtra)); }
    panelDer.add(_p('Google registra datos técnicos de uso según su propia política de privacidad.'));
    panelDer.add(_enl('Política de privacidad de Google', 'https://policies.google.com/privacy'));
    panelDer.add(_p('Tratamiento conforme a la Ley N.° 29733, Ley de Protección de Datos Personales. Consultas: ' + GITECA_CORREO));
  } else if (seccion === 'cookies') {
    panelDer.add(_p('Cookies', true));
    panelDer.add(_p('La aplicación no instala cookies propias. Google Earth Engine utiliza cookies técnicas según sus políticas.'));
    panelDer.add(_enl('Cómo utiliza Google las cookies', 'https://policies.google.com/technologies/cookies'));
  } else {
    panelDer.add(_p('Licencias de datos', true));
    panelDer.add(_filaFuente(['Fuente', 'Licencia', 'Uso']));
    for (var i = 0; i < LEGAL.fuentes.length; i++) { panelDer.add(_filaFuente(LEGAL.fuentes[i])); }
  }
}

function pieLegal() {
  var b = function(txt, s) {
    return ui.Button({label: txt, onClick: function() { verLegal(s); }, style: {fontSize: '10px', margin: '2px', padding: '0'}});
  };
  return ui.Panel([
    ui.Label('© ' + GITECA_ANIO + ' ' + GITECA_AUTOR + '. Todos los derechos reservados.', {fontSize: '11px', color: '#666', margin: '8px 6px 2px'}),
    ui.Panel([b('Autoría', 'autoria'), b('Términos', 'terminos'), b('Privacidad', 'privacidad'), b('Cookies', 'cookies'), b('Licencias', 'licencias')],
      ui.Panel.Layout.flow('horizontal', true))
  ], null, {border: '1px solid #ddd', margin: '10px 0 0'});
}

// ------------------------------ arranque de UI --------------------------------
panel.insert(0, cabeceraGiteca());
panel.insert(1, lineaAutor());
panel.add(pieLegal());
ui.root.add(panelDer);
