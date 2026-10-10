// =============================================================================
// © 2026 Gino Machoa. Todos los derechos reservados.
// Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
// Contacto: diangelomachoa@gmail.com
// Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.
// GITECA | legal_fn.js — pegar SIN CAMBIOS debajo del bloque LEGAL de cada app.
// Requiere: CFG.nombre, CFG.version, CFG.logo (asset de imagen o ''), panelDer y abrirDer(titulo).
// Si la app no define panelDer/abrirDer, este bloque crea unos mínimos.
// Solo ES5.
// =============================================================================
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
