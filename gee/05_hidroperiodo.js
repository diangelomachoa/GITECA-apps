// =============================================================================
// © 2026 Gino Machoa. Todos los derechos reservados.
// Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
// Contacto: diangelomachoa@gmail.com
// Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.
// GITECA | GEE 05 — Hidroperíodo de bosques inundables (várzea / igapó)
// - JRC Global Surface Water v1.4 (Pekel et al. 2016): ocurrencia y estacionalidad del agua
//   superficial abierta 1984–2021 (Landsat, 30 m).
// - Sentinel-1 VV: bajo el dosel, la inundación AUMENTA la retrodispersión (efecto
//   doble rebote), por lo que se detecta agua bajo bosque, que JRC no ve.
// Uso: cambie AOI por su área (p. ej. bosques de Jenaro Herrera, Pacaya-Samiria, Nanay).
// UMBRAL_DB es referencial: calíbrelo con puntos de campo inundados / no inundados.
// =============================================================================
var AOI = ee.Geometry.Rectangle([-73.80, -4.95, -73.55, -4.80]); // referencial (zona de Jenaro Herrera)
var ANIO = 2024, UMBRAL_DB = 2.0;

var jrc = ee.Image('JRC/GSW1_4/GlobalSurfaceWater').clip(AOI);
Map.centerObject(AOI, 11);
Map.addLayer(jrc.select('occurrence').selfMask(), {min: 0, max: 100, palette: ['#c6dbef', '#08306b']}, 'JRC: ocurrencia de agua (%)');
Map.addLayer(jrc.select('seasonality').selfMask(), {min: 1, max: 12, palette: ['#fee391', '#41b6c4', '#253494']}, 'JRC: meses con agua', false);

// Sentinel-1 mensual VV
var s1 = ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(AOI)
  .filter(ee.Filter.eq('instrumentMode', 'IW')).filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING')).select('VV');
var base = s1.filterDate((ANIO) + '-08-01', (ANIO) + '-10-31').median(); // aguas bajas (referencial)
var meses = ee.List.sequence(1, 12);
var mensual = ee.ImageCollection(meses.map(function(m) {
  var img = s1.filterDate(ee.Date.fromYMD(ANIO, m, 1), ee.Date.fromYMD(ANIO, m, 1).advance(1, 'month')).median();
  var inund = img.subtract(base).gt(UMBRAL_DB).rename('inundado');
  return inund.set('mes', m).set('system:time_start', ee.Date.fromYMD(ANIO, m, 15).millis());
}));
var hidroperiodo = mensual.sum().rename('meses_inundado').clip(AOI);
Map.addLayer(hidroperiodo.selfMask(), {min: 1, max: 8, palette: ['#d9f0a3', '#41ab5d', '#004529']},
  'S1: meses con inundación bajo dosel (' + ANIO + ')');

print(ui.Chart.image.series(mensual, AOI, ee.Reducer.mean(), 100)
  .setOptions({title: 'Fracción del área inundada por mes (S1, ' + ANIO + ')', colors: ['#1C5D99'], vAxis: {title: 'Fracción'}}));
Export.image.toDrive({image: hidroperiodo.toByte(), description: 'GITECA_hidroperiodo_' + ANIO, region: AOI, scale: 20, maxPixels: 1e10});

// ============================ LEGAL Y MARCA GITECA ============================
var CFG = {nombre: 'Hidroperíodo de bosques inundables', subtitulo: 'Inundación bajo dosel con radar', version: '1.0',
  logo: '' // asset de imagen del logo GITECA (ver GUIA_GEE.md); vacío = cabecera en texto
};
var LEGAL = {
  para: '',
  finalidad: 'Estimar los meses de inundación de bosques de várzea e igapó.',
  avisoResultados: 'El umbral de inundación es referencial y debe calibrarse con puntos de campo.',
  privacidadExtra: '',
  fuentes: [
    ['JRC Global Surface Water v1.4', 'Uso libre con atribución (Source: EC JRC/Google)', 'Agua superficial abierta'],
    ['Copernicus Sentinel-1', 'Contiene datos modificados de Copernicus Sentinel', 'Retrodispersión radar']
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
var panelIzq = ui.Panel({style: {width: '380px', padding: '8px'}});
panelIzq.add(cabeceraGiteca());
panelIzq.add(lineaAutor());
panelIzq.add(ui.Label('Los gráficos y tablas se muestran en la pestaña Console; las exportaciones en Tasks.', {fontSize: '12px', margin: '4px 6px'}));
panelIzq.add(pieLegal());
ui.root.insert(0, panelIzq);
ui.root.add(panelDer);
