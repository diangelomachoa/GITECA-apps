/* ===================================================================================
 * © 2026 Gino Machoa. Todos los derechos reservados.
 * Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
 * Contacto: gitecaconsulting@gmail.com
 * Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.
 * =================================================================================== */
/*****************************************************************************************
 *
 *   R Í O   V I V O   ·   A M A Z O N Í A   P E R U A N A
 *   Dinámica fluvial y territorial con imágenes satelitales (1985 – hoy)
 *
 *   ① Zona ............. lugares de Loreto y Ucayali, dibujo libre, periodo y época hidrológica
 *   ② Cauce ............ agua por año, frecuencia, erosión y sedimentación, año de erosión, timelapse
 *   ③ Orillas .......... transectos tipo DSAS: posición de la orilla por año, NSM, EPR, LRR y
 *                        tiempo estimado hasta alcanzar zonas pobladas (desbarrancamiento)
 *   ④ Playas ........... bancos de arena e islas expuestos en aguas bajas, superficie por año
 *   ⑤ Carreteras ....... población (GHSL), superficie construida y deforestación por distancia al eje vial
 *
 *   Fuentes: Landsat 5/7/8/9 C2 L2, Sentinel-2 SR, JRC Global Surface Water, GHSL P2023A,
 *            Dynamic World, Hansen/UMD Global Forest Change.
 *
 *   Uso: pegar en https://code.earthengine.google.com → Run. Para publicarla: Apps → New App.
 *
 *****************************************************************************************/


// =======================================================================================
// 0. CONFIGURACIÓN
// =======================================================================================
var CFG = {
  nombre: 'RÍO VIVO · Amazonía peruana',
  subtitulo: 'Dinámica de ríos, orillas, playas y ocupación del territorio',
  version: '1.1',
  logo: 'projects/gitecapps-511217/assets/giteca_logo_gee',   // logo GITECA (bandas b1,b2,b3); vacío = cabecera en texto
  hansen: 'UMD/hansen/global_forest_change_2024_v1_12',
  hansenUltimoAnio: 2024
};
var HOY = new Date();
var ANIO_ACTUAL = HOY.getFullYear();

// Lugares de referencia (coordenadas APROXIMADAS del centro poblado; verifique en el mapa)
var LUGARES = {
  'Tiruntán (río Ucayali)':           [-74.8402, -7.9470, 6],
  'Genaro Herrera (río Ucayali)':     [-73.6490, -4.9020, 8],
  'Requena (río Ucayali)':            [-73.8520, -5.0630, 8],
  'Contamana (río Ucayali)':          [-75.0090, -7.3340, 8],
  'Orellana (río Ucayali)':           [-75.1700, -6.8900, 6],
  'Nauta (Marañón–Ucayali)':          [-73.5830, -4.5080, 10],
  'Iquitos (río Amazonas)':           [-73.2530, -3.7490, 12],
  'Pebas (río Amazonas)':             [-71.8650, -3.3200, 8],
  'Caballococha (río Amazonas)':      [-70.5150, -3.9060, 8],
  'San Lorenzo (río Marañón)':        [-76.5600, -4.8250, 8],
  'Yurimaguas (río Huallaga)':        [-76.1230, -5.9020, 10],
  'Pucallpa (río Ucayali)':           [-74.5500, -8.3800, 15]
};
// Eje aproximado de la carretera Iquitos–Nauta (dibuje el eje exacto para mayor precisión)
var CARRETERAS = {
  'Iquitos – Nauta (eje aproximado)': [[-73.2900, -3.7900], [-73.3200, -3.8500], [-73.3600, -3.9600], [-73.4000, -4.0800],
                                       [-73.4400, -4.2000], [-73.4900, -4.3200], [-73.5400, -4.4300], [-73.5800, -4.5000]]
};
var TEMPORADAS = {
  'Aguas bajas (jul–oct)': [7, 10],
  'Aguas altas (feb–may)': [2, 5],
  'Todo el año': [1, 12]
};
// Colores de la marca GITECA (los del logo y la web): verde #2E7D3E y azul #1C5D99; fondo verde muy claro en todos los paneles
var C = {verde: '#2E7D3E', verdeMed: '#1C5D99', claro: '#E3EFE5', azul: '#1C5D99', rojo: '#C62828', naranja: '#E65100',
         texto: '#13261C', tenue: '#4D6157', blanco: '#FFFFFF', fondo: '#F4F8F4', linea: '#D5E0D7'};
// Etiquetas y paneles con el fondo de la app por defecto (las de Earth Engine son blancas y dejan "huecos")
function L(v, s, u) { s = s || {}; if (s.backgroundColor === undefined) s.backgroundColor = C.fondo; return u ? ui.Label(v, s, u) : ui.Label(v, s); }
function P(a, lay, st) {
  if (a && !(a instanceof Array) && a.style !== undefined && lay === undefined) {
    if (a.style.backgroundColor === undefined) a.style.backgroundColor = C.fondo;
    return ui.Panel(a);
  }
  st = st || {}; if (st.backgroundColor === undefined) st.backgroundColor = C.fondo;
  return ui.Panel(a || null, lay || null, st);
}


// =======================================================================================
// 1. ESTADO Y UTILIDADES
// =======================================================================================
var S = {zona: null, nombre: '', epsg: 'EPSG:32718', ha: 0, a1: 1990, a2: ANIO_ACTUAL - 1, temporada: 'Aguas bajas (jul–oct)',
         fuente: 'Landsat (30 m, 1985–hoy)', pila: null, transectos: null, eje: null};

function num(x, n) { if (x === null || x === undefined || isNaN(x)) return '—'; var p = Math.pow(10, n === undefined ? 2 : n); return (Math.round(x * p) / p).toLocaleString('es-PE'); }
function epsgUTM(lon, lat) { return 'EPSG:' + ((lat < 0 ? 32700 : 32600) + Math.floor((lon + 180) / 6) + 1); }
function nombreArchivo(s) { return String(s).replace(/[^A-Za-z0-9_\-]/g, '_').substring(0, 80); }
function capa(obj, vis, nombre, visible, op) {
  var ls = mapa.layers();
  for (var i = ls.length() - 1; i >= 0; i--) if (ls.get(i).getName() === nombre) ls.remove(ls.get(i));
  ls.add(ui.Map.Layer(obj, vis || {}, nombre, visible !== false, op === undefined ? 1 : op));
}
function arriba() {
  var ls = mapa.layers(), mover = [];
  ls.forEach(function (l) { if (l.getName().indexOf('◇') === 0 || l.getName().indexOf('┃') === 0) mover.push(l); });
  mover.forEach(function (l) { ls.remove(l); ls.add(l); });
}
var ST = {
  h2: {fontSize: '14px', fontWeight: 'bold', color: C.verde, margin: '12px 8px 4px 8px'},
  h3: {fontSize: '12px', fontWeight: 'bold', color: C.texto, margin: '8px 8px 2px 8px'},
  nota: {fontSize: '11px', color: C.tenue, margin: '2px 8px', whiteSpace: 'pre-wrap'},
  btn: {stretch: 'horizontal', margin: '4px 8px', fontWeight: 'bold'},
  enl: {color: C.azul, fontSize: '12px', margin: '2px 8px'}
};
function h2(t) { return L(t, ST.h2); }
function h3(t) { return L(t, ST.h3); }
function nota(t) { return L(t, ST.nota); }
function boton(t, fn, prim) { var s = {}; for (var k in ST.btn) s[k] = ST.btn[k]; if (prim) s.color = C.verde; return ui.Button({label: t, onClick: fn, style: s}); }
function fila(w, st) { return P(w, ui.Panel.Layout.flow('horizontal'), st || {stretch: 'horizontal'}); }
function kv(e, v, col) {
  return fila([L(e, {fontSize: '12px', color: C.tenue, margin: '1px 8px', width: '185px'}),
               L(String(v), {fontSize: '12px', fontWeight: 'bold', color: col || C.texto, margin: '1px 4px'})]);
}
function deslizador(a, b, v, p) { return ui.Slider({min: a, max: b, value: v, step: p, style: {stretch: 'horizontal', margin: '0 8px'}}); }
function conEtq(e, w, ancho) { return fila([L(e, {fontSize: '11px', margin: '6px 8px', width: ancho || '130px'}), w]); }
function selector(items, v, fn) { return ui.Select({items: items, value: v, onChange: fn, style: {stretch: 'horizontal', margin: '2px 8px'}}); }
function enlace(e, u, dest) { if (u) (dest || panelDer).add(L('⬇ ' + e, ST.enl, u)); }
function chk(e, v) { return ui.Checkbox({label: e, value: v, style: {margin: '2px 8px', fontSize: '12px', backgroundColor: C.fondo}}); }


// =======================================================================================
// 2. DATOS SATELITALES
// =======================================================================================
var BL = ['blue', 'green', 'red', 'nir', 'swir1', 'swir2'];
function prepL(img, b) {
  var qa = img.select('QA_PIXEL');
  var ok = qa.bitwiseAnd(2).eq(0).and(qa.bitwiseAnd(8).eq(0)).and(qa.bitwiseAnd(16).eq(0));
  return img.select(b, BL).multiply(0.0000275).add(-0.2).updateMask(ok).copyProperties(img, ['system:time_start']);
}
function landsat(region, ini, fin) {
  function f(id) { return ee.ImageCollection(id).filterBounds(region).filterDate(ini, fin).filter(ee.Filter.lt('CLOUD_COVER', 80)); }
  var b57 = ['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B7'], b89 = ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'];
  return f('LANDSAT/LT05/C02/T1_L2').map(function (i) { return prepL(i, b57); })
    .merge(f('LANDSAT/LE07/C02/T1_L2').map(function (i) { return prepL(i, b57); }))
    .merge(f('LANDSAT/LC08/C02/T1_L2').map(function (i) { return prepL(i, b89); }))
    .merge(f('LANDSAT/LC09/C02/T1_L2').map(function (i) { return prepL(i, b89); }));
}
function sentinel2(region, ini, fin) {
  var cs = ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED');
  return ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED').filterBounds(region).filterDate(ini, fin)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 80)).linkCollection(cs, ['cs_cdf'])
    .map(function (i) {
      return i.select(['B2', 'B3', 'B4', 'B8', 'B11', 'B12'], BL).divide(10000).updateMask(i.select('cs_cdf').gte(0.6))
        .copyProperties(i, ['system:time_start']);
    });
}
var VACIO = ee.Image.constant([0, 0, 0, 0, 0, 0]).rename(BL).toFloat().updateMask(0);
function fuenteCorta() { return S.fuente.indexOf('Sentinel') === 0 ? 'S2' : (S.fuente.indexOf('JRC') === 0 ? 'JRC' : 'L'); }
function escala() { return fuenteCorta() === 'S2' ? 10 : 30; }
function compuestoAnio(region, y, temporada, fuente) {
  var m = TEMPORADAS[temporada];
  var ini = ee.Date.fromYMD(y, m[0], 1), fin = ee.Date.fromYMD(y, m[1], 1).advance(1, 'month');
  var col = fuente === 'S2' ? sentinel2(region, ini, fin) : landsat(region, ini, fin);
  return ee.Image(ee.Algorithms.If(col.size().gt(0), col.median(), VACIO));
}
// Agua del año (1 agua, 0 tierra, enmascarado sin dato)
function aguaAnio(region, y, temporada, fuente) {
  if (fuente === 'JRC') {
    var j = ee.ImageCollection('JRC/GSW1_4/YearlyHistory').filter(ee.Filter.eq('year', y));
    var wc = ee.Image(ee.Algorithms.If(j.size().gt(0), ee.Image(j.first()).select('waterClass'), ee.Image.constant(0).rename('waterClass')));
    var agua = temporada.indexOf('bajas') === 0 ? wc.eq(3) : wc.gte(2);       // aguas bajas: solo agua permanente
    return agua.updateMask(wc.gt(0)).toByte();
  }
  var c = compuestoAnio(region, y, temporada, fuente);
  var mndwi = c.normalizedDifference(['green', 'swir1']), ndvi = c.normalizedDifference(['nir', 'red']);
  return mndwi.gt(0).and(ndvi.lt(0.2)).toByte();
}
function rangoAnios() {
  var a1 = S.a1, a2 = S.a2, f = fuenteCorta();
  if (f === 'JRC') a2 = Math.min(a2, 2021);
  if (f === 'S2') a1 = Math.max(a1, 2019);
  if (f === 'L') a1 = Math.max(a1, 1985);
  var l = []; for (var y = a1; y <= a2; y++) l.push(y);
  return l;
}
// Pila anual: una banda a_AAAA por año
function pilaAgua() {
  if (S.pila) return S.pila;
  var region = S.zona.bounds(1);
  S.anios = rangoAnios();
  S.pila = ee.Image.cat(S.anios.map(function (y) { return aguaAnio(region, y, S.temporada, fuenteCorta()).rename('a_' + y); }))
    .clip(S.zona);
  return S.pila;
}


// =======================================================================================
// 3. ESTRUCTURA
// =======================================================================================
var mapa = ui.Map();
mapa.setOptions('SATELLITE');
mapa.style().set({cursor: 'crosshair', stretch: 'both'});
mapa.setCenter(-74.2, -5.5, 6);
var dt = mapa.drawingTools();
dt.setShown(true); dt.setLinked(false); dt.setDrawModes(['rectangle', 'polygon', 'line']); dt.setShape(null);
var lblEstado = L('Elija un lugar o dibuje una zona para comenzar.', {fontSize: '12px', color: C.blanco, backgroundColor: C.verde, padding: '4px 8px', margin: '0'});
var pEstado = P([lblEstado], null, {position: 'bottom-center', padding: '0', backgroundColor: C.verde});
mapa.add(pEstado);
function estado(t, col) { lblEstado.setValue(t); lblEstado.style().set('backgroundColor', col || C.verde); pEstado.style().set('backgroundColor', col || C.verde); }
function trabajando(t) { estado('⏳ ' + t, C.naranja); }
function aviso(t) { estado('⚠ ' + t, C.rojo); }
var pLey = P({style: {position: 'top-right', shown: false, padding: '6px', backgroundColor: 'rgba(255,255,255,0.95)'}});
mapa.add(pLey);
function leyenda(tit, items) {
  pLey.clear(); pLey.add(L(tit, {fontWeight: 'bold', fontSize: '12px', margin: '0 0 4px 0'}));
  items.forEach(function (it) { pLey.add(fila([L('', {backgroundColor: it[0], padding: '7px', margin: '2px 6px 2px 0'}), L(it[1], {fontSize: '11px', margin: '2px 0'})], {})); });
  pLey.style().set('shown', true);
}
var panelIzq = P({style: {width: '370px', padding: '0', backgroundColor: C.fondo, border: '0 solid ' + C.linea}});
var panelDer = P({style: {width: '400px', padding: '0 4px 12px 4px', shown: false, backgroundColor: C.fondo}});
function abrirDer(t) {
  panelDer.clear(); panelDer.style().set('shown', true);
  panelDer.add(fila([L(t, {fontSize: '15px', fontWeight: 'bold', color: C.blanco, backgroundColor: C.verde, padding: '7px 10px', margin: '6px 0 2px 0', stretch: 'horizontal'}),
    ui.Button({label: '✕', onClick: function () { panelDer.style().set('shown', false); }, style: {margin: '6px 0 0 4px'}})]));
  panelDer.add(L('', {backgroundColor: C.azul, padding: '1px', margin: '0 0 6px 0', stretch: 'horizontal'}));
  if (S.zona) panelDer.add(L(S.nombre + ' · ' + S.fuente + ' · ' + S.temporada, {fontSize: '11px', color: C.tenue, margin: '0 8px 4px 8px'}));
}
// Franja de marca bajo la cabecera: verde y azul del logo
var cab = P([
  L('', {backgroundColor: C.verde, padding: '2px', margin: '0', stretch: 'horizontal'}),
  L('', {backgroundColor: C.azul, padding: '1px', margin: '0', stretch: 'horizontal'})
], null, {stretch: 'horizontal', margin: '0', padding: '0'});
var lblZona = L('Sin zona', {fontSize: '11px', color: C.blanco, backgroundColor: C.rojo, padding: '4px 8px', margin: '0', stretch: 'horizontal'});
var NOMB = ['① Zona', '② Cauce', '③ Orillas', '④ Playas', '⑤ Carreteras'];
var tabs = [], tbtn = [];
var cont = P({style: {stretch: 'both', padding: '0 0 8px 0'}});
var barra = P(null, ui.Panel.Layout.flow('horizontal', true), {stretch: 'horizontal', backgroundColor: C.claro, padding: '4px 2px'});
NOMB.forEach(function (n, i) { var b = ui.Button({label: n, onClick: function () { tab(i); }, style: {margin: '2px', fontSize: '11px', width: '108px'}}); tbtn.push(b); barra.add(b); });
// Pestaña activa en azul de marca y negrita
function tab(i) { cont.clear(); cont.add(tabs[i]); tbtn.forEach(function (b, j) { b.style().set({color: j === i ? C.azul : C.texto, fontWeight: j === i ? 'bold' : 'normal'}); }); }
function requiereZona() { if (!S.zona) { aviso('Defina la zona en ① Zona.'); return false; } return true; }
// Devuelve (asíncrono) las geometrías dibujadas de un tipo: 'linea' o 'area'
function geomsDibujadas(tipo, cb) {
  var gs = [];
  dt.layers().forEach(function (l) { l.geometries().forEach(function (g) { gs.push(g); }); });
  if (!gs.length) { cb([]); return; }
  ee.List(gs.map(function (g) { return ee.Dictionary({t: ee.Geometry(g).type(), c: ee.Geometry(g).coordinates()}); }))
    .evaluate(function (l, e) {
      if (e) { aviso('Geometría no válida: ' + e); return; }
      cb(l.filter(function (x) {
        return tipo === 'linea' ? x.t === 'LineString' : (x.t === 'Polygon' || x.t === 'MultiPolygon');
      }));
    });
}


// =======================================================================================
// 4. ① ZONA
// =======================================================================================
function fijarZona(geom, nombre) {
  S.zona = ee.Geometry(geom); S.nombre = nombre; S.pila = null; S.transectos = null;
  capa(ee.Image().byte().paint(ee.FeatureCollection([ee.Feature(S.zona)]), 1, 2).visualize({palette: ['FFFFFF']}), {}, '◇ Zona de análisis');
  mapa.centerObject(S.zona);
  ee.Dictionary({ha: S.zona.area(1).divide(1e4), c: S.zona.centroid(1).coordinates()}).evaluate(function (r, e) {
    if (e) { aviso('Zona no válida: ' + e); return; }
    S.ha = r.ha; S.epsg = epsgUTM(r.c[0], r.c[1]);
    lblZona.setValue('▣ ' + nombre + ' · ' + num(r.ha / 100, 1) + ' km²');
    lblZona.style().set('backgroundColor', C.verde);
    estado('Zona lista (' + num(r.ha / 100, 1) + ' km²). Continúe en ② Cauce.', r.ha > 150000 ? C.naranja : null);
  });
}
var p1 = P();
p1.add(h2('Zona de análisis'));
var selLugar = selector(Object.keys(LUGARES), Object.keys(LUGARES)[0], null);
var sldRadio = deslizador(2, 25, 6, 1);
p1.add(h3('A · Lugar de referencia')); p1.add(selLugar); p1.add(conEtq('Radio (km)', sldRadio));
p1.add(boton('📍 Usar lugar', function () {
  var l = LUGARES[selLugar.getValue()];
  sldRadio.setValue(l[2], false);
  fijarZona(ee.Geometry.Point([l[0], l[1]]).buffer(sldRadio.getValue() * 1000).bounds(1), selLugar.getValue().split(' (')[0]);
}, true));
p1.add(nota('Las coordenadas de los lugares son aproximadas. Puede ajustar la zona dibujando un rectángulo.'));
p1.add(h3('B · Dibujar zona'));
p1.add(boton('✔ Usar rectángulo o polígono dibujado', function () {
  geomsDibujadas('area', function (l) {
    if (!l.length) { aviso('Dibuje un rectángulo o polígono con las herramientas del mapa.'); return; }
    var fc = ee.FeatureCollection(l.map(function (x) { return ee.Feature(ee.Geometry({type: x.t, coordinates: x.c})); }));
    fijarZona(fc.geometry().dissolve(1).bounds(1), 'Zona dibujada');
  });
}));
p1.add(h3('Periodo'));
var sldA1 = deslizador(1985, ANIO_ACTUAL - 1, 1990, 1), sldA2 = deslizador(1986, ANIO_ACTUAL, ANIO_ACTUAL - 1, 1);
p1.add(conEtq('Desde', sldA1)); p1.add(conEtq('Hasta', sldA2));
p1.add(h3('Época hidrológica'));
var selTemp = selector(Object.keys(TEMPORADAS), 'Aguas bajas (jul–oct)', null);
p1.add(selTemp);
p1.add(nota('Compare siempre la misma época: en Loreto el nivel del río varía 8–12 m entre aguas altas y bajas. ' +
  'Aguas bajas muestra mejor las playas y los barrancos.'));
p1.add(h3('Fuente de imágenes'));
var selFuente = selector(['Landsat (30 m, 1985–hoy)', 'Sentinel-2 (10 m, 2019–hoy)', 'JRC Global Surface Water (30 m, 1985–2021)'], 'Landsat (30 m, 1985–hoy)', null);
p1.add(selFuente);
p1.add(boton('✔ Aplicar periodo y fuente', aplicarParametros));
function aplicarParametros() {
  S.a1 = Math.min(sldA1.getValue(), sldA2.getValue()); S.a2 = Math.max(sldA1.getValue(), sldA2.getValue());
  S.temporada = selTemp.getValue(); S.fuente = selFuente.getValue(); S.pila = null; S.transectos = null;
  var r = rangoAnios();
  estado('Periodo ' + r[0] + '–' + r[r.length - 1] + ' · ' + S.temporada + ' · ' + S.fuente);
}
tabs.push(p1);


// =======================================================================================
// 5. ② CAUCE · agua por año, frecuencia, erosión/sedimentación, año de erosión, timelapse
// =======================================================================================
var p2 = P();
p2.add(h2('Dinámica del cauce y meandros'));
p2.add(nota('Clasifica el agua de cada año (MNDWI) y compara periodos para ubicar erosión de orillas, ' +
  'sedimentación (nuevas playas e islas), migración de meandros y cortes de meandro.'));
var sldAnioVer = deslizador(1985, ANIO_ACTUAL, ANIO_ACTUAL - 1, 1);
p2.add(conEtq('Ver agua del año', sldAnioVer));
p2.add(boton('💧 Mostrar agua del año', function () {
  if (!requiereZona()) return;
  aplicarParametros();
  var y = sldAnioVer.getValue(), r = rangoAnios();
  if (y < r[0] || y > r[r.length - 1]) { aviso('Año fuera del periodo y la fuente elegidos (' + r[0] + '–' + r[r.length - 1] + ').'); return; }
  var c = compuestoAnio(S.zona.bounds(1), y, S.temporada, fuenteCorta() === 'JRC' ? 'L' : fuenteCorta()).clip(S.zona);
  capa(c, {bands: ['swir1', 'nir', 'red'], min: 0, max: [0.3, 0.4, 0.15]}, 'Imagen ' + y + ' (SWIR-NIR-R)', true);
  capa(pilaAgua().select('a_' + y).selfMask(), {palette: ['#29B6F6']}, 'Agua ' + y, true, 0.6);
  arriba();
}));
p2.add(h3('Comparar dos periodos'));
var sldPA = deslizador(1985, ANIO_ACTUAL, 1990, 1), sldPB = deslizador(1985, ANIO_ACTUAL, ANIO_ACTUAL - 1, 1), sldVent = deslizador(0, 4, 2, 1);
p2.add(conEtq('Año inicial', sldPA)); p2.add(conEtq('Año final', sldPB)); p2.add(conEtq('± años (ventana)', sldVent));
p2.add(boton('🌀 Erosión y sedimentación', cambioCauce, true));
p2.add(boton('📈 Frecuencia de agua, año de erosión y área por año', historiaCauce));
p2.add(boton('🎞 Timelapse anual', timelapse));
tabs.push(p2);

function aguaPeriodo(y0, v) {
  var pila = pilaAgua(), bs = [];
  S.anios.forEach(function (y) { if (y >= y0 - v && y <= y0 + v) bs.push('a_' + y); });
  if (!bs.length) return null;
  return pila.select(bs).reduce(ee.Reducer.mean()).gte(0.5);     // agua en la mayoría de años de la ventana
}
function cambioCauce() {
  if (!requiereZona()) return;
  aplicarParametros();
  var ya = Math.min(sldPA.getValue(), sldPB.getValue()), yb = Math.max(sldPA.getValue(), sldPB.getValue()), v = sldVent.getValue();
  var A = aguaPeriodo(ya, v), B = aguaPeriodo(yb, v);
  if (!A || !B) { aviso('Sin años disponibles para algún periodo con la fuente elegida.'); return; }
  trabajando('Comparando ' + ya + ' y ' + yb + '…');
  var cls = ee.Image(0).where(A.and(B), 1).where(A.not().and(B), 2).where(A.and(B.not()), 3).selfMask().clip(S.zona).rename('c');
  capa(cls, {min: 1, max: 3, palette: ['#1E88E5', '#D50000', '#FFB300']}, 'Cambio ' + ya + ' → ' + yb, true, 0.85);
  arriba();
  leyenda('Cauce ' + ya + ' → ' + yb, [['#1E88E5', 'Agua en ambos periodos'], ['#D50000', 'EROSIÓN (tierra → agua)'], ['#FFB300', 'SEDIMENTACIÓN (agua → tierra)']]);
  ee.Image.pixelArea().divide(1e4).addBands(cls).reduceRegion({reducer: ee.Reducer.sum().group(1, 'c'), geometry: S.zona, scale: escala(), maxPixels: 1e11, bestEffort: true, tileScale: 4})
    .evaluate(function (r, err) {
      if (err) { aviso('Error: ' + err); return; }
      var h = {1: 0, 2: 0, 3: 0}; (r.groups || []).forEach(function (g) { h[g.c] = g.sum; });
      var anios = yb - ya;
      abrirDer('Erosión y sedimentación ' + ya + ' → ' + yb);
      panelDer.add(kv('Erosión de orillas', num(h[2], 1) + ' ha (' + num(h[2] / anios, 1) + ' ha/año)', C.rojo));
      panelDer.add(kv('Sedimentación (playas, islas)', num(h[3], 1) + ' ha (' + num(h[3] / anios, 1) + ' ha/año)', '#B8860B'));
      panelDer.add(kv('Agua estable', num(h[1], 1) + ' ha'));
      panelDer.add(kv('Balance (sedim. − erosión)', num(h[3] - h[2], 1) + ' ha'));
      panelDer.add(ui.Chart([['Proceso', 'ha', {role: 'style'}], ['Erosión', h[2], '#D50000'], ['Sedimentación', h[3], '#FFB300']], 'ColumnChart',
        {title: 'Superficie que cambió (ha)', legend: {position: 'none'}, height: 180}));
      var pd = P(); panelDer.add(pd);
      cls.toByte().getDownloadURL({name: nombreArchivo('Cambio_cauce_' + ya + '_' + yb + '_' + S.nombre), region: S.zona, scale: escala(), crs: S.epsg, format: 'GEO_TIFF'},
        function (u, e) { if (!e) enlace('Mapa de cambio (GeoTIFF: 1 agua, 2 erosión, 3 sedimentación)', u, pd); });
      cls.eq(2).selfMask().reduceToVectors({geometry: S.zona, scale: escala(), crs: S.epsg, geometryType: 'polygon', eightConnected: true, maxPixels: 1e10, bestEffort: true})
        .map(function (f) { return f.set('area_ha', f.geometry().area(1).divide(1e4), 'proceso', 'erosion', 'periodo', ya + '-' + yb); })
        .filter(ee.Filter.gte('area_ha', 0.5))
        .getDownloadURL('kml', null, nombreArchivo('Erosion_' + ya + '_' + yb + '_' + S.nombre), function (u) { enlace('Polígonos de erosión ≥ 0.5 ha (KML)', u, pd); });
      panelDer.add(nota('Cada periodo usa la mayoría de los años en la ventana ±' + v + ' para reducir el efecto de nubes y de un año atípico. ' +
        'La erosión cerca de poblados (barrancos) se mide mejor con transectos en ③ Orillas.'));
      estado('Cambio calculado.');
    });
}

function historiaCauce() {
  if (!requiereZona()) return;
  aplicarParametros();
  var pila = pilaAgua(), anios = S.anios;
  trabajando('Procesando ' + anios.length + ' años…');
  var frec = pila.reduce(ee.Reducer.mean()).multiply(100).clip(S.zona);
  capa(frec.selfMask(), {min: 0, max: 100, palette: ['#FFF59D', '#81D4FA', '#1E88E5', '#0D47A1']}, 'Frecuencia de agua ' + anios[0] + '–' + anios[anios.length - 1] + ' (%)', true, 0.8);
  // Año de erosión: primer año de agua en píxeles que antes fueron tierra y hoy son agua
  var ultimo = 'a_' + anios[anios.length - 1];
  var anioTierra = ee.Image.cat(anios.map(function (y) { return pila.select('a_' + y).eq(0).multiply(y).unmask(0).rename('t' + y); })).reduce(ee.Reducer.max());
  var anioErosion = anioTierra.add(1).updateMask(pila.select(ultimo).eq(1).and(anioTierra.gt(0))).clip(S.zona);
  capa(anioErosion, {min: anios[0], max: anios[anios.length - 1], palette: ['#FFF176', '#FF9800', '#E53935', '#6A1B9A']}, 'Año de erosión (tierra → agua)', false, 0.9);
  var anioAgua = ee.Image.cat(anios.map(function (y) { return pila.select('a_' + y).eq(1).multiply(y).unmask(0).rename('w' + y); })).reduce(ee.Reducer.max());
  var anioSedim = anioAgua.add(1).updateMask(pila.select(ultimo).eq(0).and(anioAgua.gt(0))).clip(S.zona);
  capa(anioSedim, {min: anios[0], max: anios[anios.length - 1], palette: ['#C8E6C9', '#66BB6A', '#2E7D32', '#1B5E20']}, 'Año de sedimentación (agua → tierra)', false, 0.9);
  arriba();
  leyenda('Frecuencia de agua (%)', [['#FFF59D', '< 25 % (agua ocasional)'], ['#81D4FA', '25–50 %'], ['#1E88E5', '50–90 %'], ['#0D47A1', '> 90 % (cauce estable)']]);
  pila.multiply(ee.Image.pixelArea().divide(1e4)).reduceRegion({reducer: ee.Reducer.sum(), geometry: S.zona, scale: escala(), maxPixels: 1e11, bestEffort: true, tileScale: 4})
    .evaluate(function (r, err) {
      if (err) { aviso('Error: ' + err); return; }
      var filas = [['Año', 'Agua (ha)']];
      anios.forEach(function (y) { filas.push([String(y), r['a_' + y] || null]); });
      abrirDer('Historia del cauce');
      panelDer.add(ui.Chart(filas, 'LineChart', {title: 'Superficie de agua por año (' + S.temporada + ')', legend: {position: 'none'}, height: 230,
        pointSize: 3, colors: ['#1E88E5'], hAxis: {slantedText: true, textStyle: {fontSize: 9}}, vAxis: {title: 'ha'}, interpolateNulls: true}));
      panelDer.add(nota('Capas agregadas (actívelas en el panel de capas del mapa):\n' +
        '• Frecuencia de agua: cauces estables (azul oscuro) vs. zonas que el río ocupó solo algunos años (amarillo: antiguos cauces, cochas, playas).\n' +
        '• Año de erosión: cuándo el río ocupó por última vez tierra firme; muestra el avance de los meandros año a año.\n' +
        '• Año de sedimentación: cuándo una zona de agua pasó a tierra (nuevas playas, islas y meandros abandonados).\n' +
        'Años con muchas nubes pueden aparecer con menos agua: revise el número de imágenes en la serie.'));
      var pd = P(); panelDer.add(pd);
      anioErosion.toInt16().getDownloadURL({name: nombreArchivo('Anio_erosion_' + S.nombre), region: S.zona, scale: escala(), crs: S.epsg, format: 'GEO_TIFF'},
        function (u, e) { if (!e) enlace('Año de erosión (GeoTIFF)', u, pd); });
      frec.toByte().getDownloadURL({name: nombreArchivo('Frecuencia_agua_' + S.nombre), region: S.zona, scale: escala(), crs: S.epsg, format: 'GEO_TIFF'},
        function (u, e) { if (!e) enlace('Frecuencia de agua (GeoTIFF, %)', u, pd); });
      estado('Historia del cauce lista.');
    });
}

function timelapse() {
  if (!requiereZona()) return;
  aplicarParametros();
  var anios = rangoAnios(), region = S.zona.bounds(1);
  if (anios.length > 45) anios = anios.slice(anios.length - 45);
  var fu = fuenteCorta() === 'JRC' ? 'L' : fuenteCorta();
  var borde = ee.Image().byte().paint(ee.FeatureCollection([ee.Feature(S.zona)]), 1, 2).visualize({palette: ['FFFFFF']});
  var frames = ee.ImageCollection(anios.map(function (y) {
    return compuestoAnio(region, y, S.temporada, fu).visualize({bands: ['swir1', 'nir', 'red'], min: 0, max: [0.3, 0.4, 0.15]})
      .blend(borde).set('anio', y);
  }));
  var prm = {region: region, dimensions: 520, framesPerSecond: 2, crs: 'EPSG:3857'};
  abrirDer('Timelapse ' + anios[0] + '–' + anios[anios.length - 1]);
  panelDer.add(ui.Thumbnail({image: frames, params: prm, style: {width: '380px', margin: '4px auto'}}));
  frames.getVideoThumbURL(prm, function (u) { enlace('Descargar timelapse (GIF)', u); });
  panelDer.add(nota('Un cuadro por año (' + S.temporada + '), composición SWIR-NIR-Rojo: agua en azul oscuro, bosque en verde, playas y suelo en rosado. ' +
    'Años sin imágenes aparecen en negro.'));
  estado('Timelapse generado.');
}


// =======================================================================================
// 6. ③ ORILLAS · transectos tipo DSAS y riesgo de desbarrancamiento
// =======================================================================================
var p3 = P();
p3.add(h2('Retroceso de orillas (transectos)'));
p3.add(nota('1) Dibuje una LÍNEA BASE en tierra firme, paralela a la orilla, unos cientos de metros tierra adentro (p. ej. detrás del poblado).\n' +
  '2) Elija hacia qué lado está el río, mirando la línea en el sentido en que la dibujó.\n' +
  '3) La app traza transectos perpendiculares y mide, para cada año, la distancia de la línea base a la orilla.\n' +
  'Los transectos deben quedar dentro de la zona de ① (fuera de ella no hay datos).'));
var selLado = selector(['Río a la IZQUIERDA de la línea', 'Río a la DERECHA de la línea'], 'Río a la IZQUIERDA de la línea', null);
var sldEsp = deslizador(25, 500, 100, 25), sldLargo = deslizador(200, 4000, 1200, 100);
p3.add(selLado); p3.add(conEtq('Separación (m)', sldEsp)); p3.add(conEtq('Largo del transecto (m)', sldLargo));
var chkUrb = chk('Estimar tiempo hasta zonas construidas (Dynamic World)', true);
p3.add(chkUrb);
p3.add(boton('👁 Vista previa de transectos', function () { transectos(true); }));
p3.add(boton('📏 Medir retroceso de orillas', function () { transectos(false); }, true));
tabs.push(p3);

function lineaBase(cb) {
  geomsDibujadas('linea', function (l) {
    if (!l.length) { aviso('Dibuje una línea con la herramienta de línea del mapa.'); return; }
    if (l.length > 1) estado('Hay ' + l.length + ' líneas dibujadas: se usa la primera.', C.naranja);
    cb(l[0].c);
  });
}
// Genera transectos sobre una polilínea en coordenadas geográficas (aproximación métrica local)
function generarTransectos(coords, esp, largo, izquierda, paso) {
  var lat0 = coords[0][1], kx = Math.cos(lat0 * Math.PI / 180) * 111320, ky = 110540;
  var P = coords.map(function (c) { return [c[0] * kx, c[1] * ky]; });
  var tr = [], acum = 0, sig = 0;
  for (var i = 0; i < P.length - 1; i++) {
    var dx = P[i + 1][0] - P[i][0], dy = P[i + 1][1] - P[i][1], L = Math.sqrt(dx * dx + dy * dy);
    if (L === 0) continue;
    var tx = dx / L, ty = dy / L, nx = izquierda ? -ty : ty, ny = izquierda ? tx : -tx;
    while (sig <= acum + L) {
      var t = sig - acum, ox = P[i][0] + tx * t, oy = P[i][1] + ty * t, pts = [];
      for (var d = 0; d <= largo; d += paso) pts.push([(ox + nx * d) / kx, (oy + ny * d) / ky, d]);
      tr.push({id: tr.length + 1, km: sig / 1000, pts: pts});
      sig += esp;
    }
    acum += L;
  }
  return tr;
}
function transectos(previa) {
  if (!requiereZona()) return;
  aplicarParametros();
  lineaBase(function (coords) {
    var paso = fuenteCorta() === 'S2' ? 10 : 15;
    var tr = generarTransectos(coords, sldEsp.getValue(), sldLargo.getValue(), selLado.getValue().indexOf('IZQUIERDA') > 0, paso);
    if (!tr.length) { aviso('No se pudieron generar transectos.'); return; }
    if (tr.length * tr[0].pts.length > 12000) { aviso('Demasiados puntos (' + tr.length + ' transectos): aumente la separación o reduzca el largo.'); return; }
    var lineas = ee.FeatureCollection(tr.map(function (t) {
      return ee.Feature(ee.Geometry.LineString([[t.pts[0][0], t.pts[0][1]], [t.pts[t.pts.length - 1][0], t.pts[t.pts.length - 1][1]]]), {id: t.id});
    }));
    capa(lineas.style({color: 'FFFFFF', width: 1}), {}, '┃ Transectos', true, 0.8);
    if (previa) { estado(tr.length + ' transectos. Si apuntan hacia tierra, cambie el lado del río.'); return; }
    medirTransectos(tr);
  });
}
function medirTransectos(tr) {
  var pila = pilaAgua(), anios = S.anios;
  trabajando('Midiendo la orilla en ' + tr.length + ' transectos y ' + anios.length + ' años…');
  var puntos = [];
  tr.forEach(function (t) { t.pts.forEach(function (p) { puntos.push(ee.Feature(ee.Geometry.Point([p[0], p[1]]), {t: t.id, d: p[2]})); }); });
  var img = pila.unmask(-1);
  var bandas = anios.map(function (y) { return 'a_' + y; });
  if (chkUrb.getValue()) {
    var dw = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1').filterBounds(S.zona).filterDate((ANIO_ACTUAL - 1) + '-01-01', ANIO_ACTUAL + '-12-31')
      .select('label').mode().eq(6).unmask(0).rename('urb');          // clase 6 = construido
    img = img.addBands(dw);
    bandas.push('urb');
  }
  img.reduceRegions({collection: ee.FeatureCollection(puntos), reducer: ee.Reducer.first(), scale: escala(), tileScale: 4})
    .reduceColumns(ee.Reducer.toList(bandas.length + 2), ['t', 'd'].concat(bandas)).get('list')
    .evaluate(function (l, err) {
      if (err) { aviso('Error: ' + err); return; }
      // Agrupar por transecto (ordenado por distancia desde la línea base)
      var porT = {};
      l.forEach(function (r) { (porT[r[0]] = porT[r[0]] || []).push(r); });
      var res = tr.map(function (t) {
        var rs = (porT[t.id] || []).sort(function (a, b) { return a[1] - b[1]; });
        var pos = anios.map(function (y, k) {
          for (var i = 0; i < rs.length; i++) {
            var v = rs[i][2 + k];
            if (v === -1) return null;          // sin dato antes de llegar al agua: posición incierta
            if (v === 1) return rs[i][1];
          }
          return null;
        });
        var xs = [], ys = [];
        pos.forEach(function (p, k) { if (p !== null) { xs.push(anios[k]); ys.push(p); } });
        var o = {id: t.id, km: t.km, pos: pos, n: xs.length, lrr: null, r2: null, nsm: null, epr: null, urbDist: null, anios: null};
        if (xs.length >= 3) {
          var mx = xs.reduce(function (s, x) { return s + x; }, 0) / xs.length, my = ys.reduce(function (s, y) { return s + y; }, 0) / ys.length;
          var sxy = 0, sxx = 0, syy = 0;
          for (var i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += Math.pow(xs[i] - mx, 2); syy += Math.pow(ys[i] - my, 2); }
          o.lrr = sxx ? sxy / sxx : 0; o.r2 = syy ? (sxy * sxy) / (sxx * syy) : 0;
          o.nsm = ys[ys.length - 1] - ys[0]; o.epr = o.nsm / (xs[xs.length - 1] - xs[0]);
          // Riesgo: distancia desde la orilla actual hasta la construcción más cercana, tierra adentro
          if (chkUrb.getValue()) {
            var orilla = ys[ys.length - 1], urb = null;
            rs.forEach(function (r) { if (r[r.length - 1] === 1 && r[1] < orilla) urb = r[1]; });
            if (urb !== null) { o.urbDist = orilla - urb; if (o.lrr < -0.5) o.anios = o.urbDist / -o.lrr; }
          }
        }
        return o;
      });
      S.transectos = res;
      mostrarTransectos(tr, res, anios);
    });
}
function claseTasa(v) {
  if (v === null) return ['#9E9E9E', 'Sin dato'];
  if (v <= -20) return ['#4A0000', 'Erosión muy alta (≤ −20 m/año)'];
  if (v <= -5) return ['#C62828', 'Erosión alta (−20 a −5)'];
  if (v <= -1) return ['#FF7043', 'Erosión moderada (−5 a −1)'];
  if (v < 1) return ['#FFFFFF', 'Estable (−1 a 1)'];
  if (v < 5) return ['#81C784', 'Acreción moderada (1 a 5)'];
  return ['#1B5E20', 'Acreción alta (≥ 5 m/año)'];
}
function mostrarTransectos(tr, res, anios) {
  var fc = ee.FeatureCollection(tr.map(function (t, i) {
    var r = res[i], a = t.pts[0], b = t.pts[t.pts.length - 1];
    return ee.Feature(ee.Geometry.LineString([[a[0], a[1]], [b[0], b[1]]]), {
      id: r.id, km: r.km, lrr_m_anio: r.lrr, epr_m_anio: r.epr, nsm_m: r.nsm, r2: r.r2, anios_dato: r.n,
      dist_construido_m: r.urbDist, anios_hasta_construido: r.anios, style: {color: claseTasa(r.lrr)[0], width: 3}});
  }));
  capa(fc.style({styleProperty: 'style'}), {}, '┃ Tasa de cambio de orilla (LRR)', true);
  quitarCapa('┃ Transectos');
  arriba();
  leyenda('Cambio de orilla (m/año)', [-25, -10, -3, 0, 3, 10].map(function (v) { return claseTasa(v); }));
  var ok = res.filter(function (r) { return r.lrr !== null; });
  abrirDer('Retroceso de orillas');
  if (!ok.length) { panelDer.add(nota('Ningún transecto alcanzó el agua en suficientes años. Alargue los transectos o revise el lado del río.')); estado('Sin resultados.'); return; }
  var tasas = ok.map(function (r) { return r.lrr; }).sort(function (a, b) { return a - b; });
  var ero = ok.filter(function (r) { return r.lrr <= -1; });
  panelDer.add(kv('Transectos con dato', ok.length + ' de ' + res.length));
  panelDer.add(kv('Periodo', anios[0] + '–' + anios[anios.length - 1] + ' (' + S.temporada + ')'));
  panelDer.add(kv('Tasa mediana (LRR)', num(tasas[Math.floor(tasas.length / 2)], 1) + ' m/año'));
  panelDer.add(kv('Retroceso máximo', num(-tasas[0], 1) + ' m/año', C.rojo));
  panelDer.add(kv('Transectos en erosión (≤ −1 m/año)', ero.length + ' (' + num(ero.length / ok.length * 100, 0) + ' %)'));
  var peor = ok.slice().sort(function (a, b) { return a.lrr - b.lrr; })[0];
  panelDer.add(kv('Retroceso neto (NSM) del peor', num(peor.nsm, 0) + ' m en el transecto ' + peor.id));
  var riesgo = ok.filter(function (r) { return r.anios !== null; }).sort(function (a, b) { return a.anios - b.anios; });
  if (riesgo.length) {
    panelDer.add(h3('Desbarrancamiento: tiempo hasta zonas construidas'));
    riesgo.slice(0, 8).forEach(function (r) {
      panelDer.add(kv('Transecto ' + r.id + ' (km ' + num(r.km, 2) + ')', '≈ ' + num(r.anios, 0) + ' años · ' + num(r.urbDist, 0) + ' m a ' + num(-r.lrr, 1) + ' m/año',
        r.anios < 10 ? C.rojo : (r.anios < 25 ? C.naranja : C.texto)));
    });
    panelDer.add(nota('Extrapolación lineal de la tendencia; un cambio de curso o una creciente extraordinaria pueden acelerar o detener el proceso.'));
  }
  // Serie de posiciones para el transecto con mayor retroceso y la mediana
  var med = ok.slice().sort(function (a, b) { return a.lrr - b.lrr; })[Math.floor(ok.length / 2)];
  var filas = [['Año', 'T' + peor.id + ' (mayor retroceso)', 'T' + med.id + ' (mediana)']];
  anios.forEach(function (y, k) { filas.push([String(y), peor.pos[k], med.pos[k]]); });
  panelDer.add(ui.Chart(filas, 'LineChart', {title: 'Distancia de la línea base a la orilla (m)', height: 230, pointSize: 3, interpolateNulls: true,
    colors: ['#C62828', '#1565C0'], legend: {position: 'top'}, hAxis: {slantedText: true, textStyle: {fontSize: 9}}, vAxis: {title: 'm'}}));
  var hist = [['Clase', 'Transectos', {role: 'style'}]];
  [-25, -10, -3, 0, 3, 10].forEach(function (v) {
    var c = claseTasa(v);
    hist.push([c[1], ok.filter(function (r) { return claseTasa(r.lrr)[1] === c[1]; }).length, c[0] === '#FFFFFF' ? '#BDBDBD' : c[0]]);
  });
  panelDer.add(ui.Chart(hist, 'BarChart', {title: 'Transectos por clase de cambio', legend: {position: 'none'}, height: 210, chartArea: {left: 150}}));
  var pd = P(); panelDer.add(h3('Descargas')); panelDer.add(pd);
  var exp = fc.map(function (f) { return f.set('style', null); });
  var cols = ['id', 'km', 'lrr_m_anio', 'epr_m_anio', 'nsm_m', 'r2', 'anios_dato', 'dist_construido_m', 'anios_hasta_construido'];
  exp.getDownloadURL('csv', cols, nombreArchivo('Transectos_' + S.nombre), function (u) { enlace('Tasas por transecto (CSV)', u, pd); });
  exp.getDownloadURL('kml', null, nombreArchivo('Transectos_' + S.nombre), function (u) { enlace('Transectos (KML)', u, pd); });
  exp.getDownloadURL('shp', null, nombreArchivo('Transectos_' + S.nombre), function (u) { enlace('Transectos (SHP, ZIP)', u, pd); });
  panelDer.add(nota('LRR: pendiente de la regresión lineal de la posición de la orilla en el tiempo (como DSAS); negativo = la orilla avanzó hacia la línea base (erosión). ' +
    'EPR: cambio entre el primer y el último año con dato. NSM: desplazamiento neto en metros. ' +
    'Precisión: un píxel Landsat mide 30 m; tasas menores a ~2 m/año en periodos cortos están dentro del error.'));
  estado('Orillas medidas en ' + ok.length + ' transectos.');
}
function quitarCapa(n) { var ls = mapa.layers(); for (var i = ls.length() - 1; i >= 0; i--) if (ls.get(i).getName() === n) ls.remove(ls.get(i)); }


// =======================================================================================
// 7. ④ PLAYAS · bancos de arena e islas en aguas bajas
// =======================================================================================
var p4 = P();
p4.add(h2('Playas e islas de arena'));
p4.add(nota('Detecta arena expuesta (no agua, sin vegetación, brillante) dentro del corredor del río en la época de aguas bajas. ' +
  'Las playas de Loreto se usan para cultivos estacionales, anidamiento de taricayas y puertos: su dinámica importa.'));
var sldCorr = deslizador(100, 2000, 500, 100);
p4.add(conEtq('Corredor del río (m)', sldCorr));
p4.add(boton('🏖 Superficie de playas por año', playas, true));
tabs.push(p4);

function arena(c) {
  var mndwi = c.normalizedDifference(['green', 'swir1']), ndvi = c.normalizedDifference(['nir', 'red']);
  return mndwi.lte(0).and(ndvi.lt(0.2)).and(c.select('red').gt(0.06)).and(c.select('swir1').gt(0.12));
}
function playas() {
  if (!requiereZona()) return;
  aplicarParametros();
  var anios = rangoAnios(), region = S.zona.bounds(1);
  var fu = fuenteCorta() === 'JRC' ? 'L' : fuenteCorta(), esc = fu === 'S2' ? 10 : 30;
  trabajando('Detectando playas en ' + anios.length + ' años…');
  var corredor = ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('max_extent').unmask(0).focalMax(sldCorr.getValue(), 'circle', 'meters');
  var pila = ee.Image.cat(anios.map(function (y) {
    return arena(compuestoAnio(region, y, S.temporada, fu)).and(corredor).rename('p_' + y);
  })).clip(S.zona);
  var ult = anios[anios.length - 1], pri = anios[0];
  capa(pila.select('p_' + ult).selfMask(), {palette: ['#FFD54F']}, 'Playas ' + ult, true);
  capa(pila.select('p_' + pri).selfMask(), {palette: ['#BCAAA4']}, 'Playas ' + pri, false);
  arriba();
  leyenda('Playas de arena', [['#FFD54F', 'Año ' + ult], ['#BCAAA4', 'Año ' + pri + ' (capa apagada)']]);
  pila.multiply(ee.Image.pixelArea().divide(1e4)).reduceRegion({reducer: ee.Reducer.sum(), geometry: S.zona, scale: esc, maxPixels: 1e11, bestEffort: true, tileScale: 4})
    .evaluate(function (r, err) {
      if (err) { aviso('Error: ' + err); return; }
      var filas = [['Año', 'Playas (ha)']];
      anios.forEach(function (y) { filas.push([String(y), r['p_' + y] || null]); });
      abrirDer('Playas e islas de arena');
      panelDer.add(ui.Chart(filas, 'ColumnChart', {title: 'Arena expuesta por año (' + S.temporada + ')', legend: {position: 'none'}, colors: ['#F9A825'],
        height: 240, hAxis: {slantedText: true, textStyle: {fontSize: 9}}, vAxis: {title: 'ha'}}));
      panelDer.add(nota('La superficie de playas depende mucho del nivel del río en la fecha de las imágenes: compare tendencias de varios años, ' +
        'no años aislados. Para resultados confiables use la época de aguas bajas.'));
      var pd = P(); panelDer.add(pd);
      pila.select('p_' + ult).selfMask().reduceToVectors({geometry: S.zona, scale: esc, crs: S.epsg, geometryType: 'polygon', eightConnected: true, maxPixels: 1e10, bestEffort: true})
        .map(function (f) { return f.set('area_ha', f.geometry().area(1).divide(1e4), 'anio', ult); })
        .filter(ee.Filter.gte('area_ha', 0.5))
        .getDownloadURL('kml', null, nombreArchivo('Playas_' + ult + '_' + S.nombre), function (u) { enlace('Playas ' + ult + ' ≥ 0.5 ha (KML)', u, pd); });
      estado('Playas calculadas.');
    });
}


// =======================================================================================
// 8. ⑤ CARRETERAS · población, construcción y deforestación por distancia al eje vial
// =======================================================================================
var p5 = P();
p5.add(h2('Ocupación a lo largo de carreteras'));
p5.add(nota('Analiza franjas de distancia a un eje vial: población (GHSL, 1975–2025), superficie construida (GHSL), ' +
  'pérdida de bosque por año (Hansen) y, opcionalmente, zonas construidas recientes (Dynamic World).'));
var selCarr = selector(['Línea dibujada en el mapa'].concat(Object.keys(CARRETERAS)), 'Línea dibujada en el mapa', null);
p5.add(selCarr);
p5.add(nota('Para otras vías (p. ej. Navarro Cauper u otras), dibuje el eje con la herramienta de línea y elija "Línea dibujada".'));
var txtFranjas = ui.Textbox({value: '1, 2, 5, 10', style: {stretch: 'horizontal', margin: '2px 8px', fontSize: '12px'}});
p5.add(conEtq('Franjas (km)', txtFranjas));
var chkDW = chk('Incluir construcción anual Dynamic World (2016–hoy, más lento)', false);
p5.add(chkDW);
p5.add(boton('🛣 Analizar corredor vial', carretera, true));
tabs.push(p5);

function carretera() {
  var usarDib = selCarr.getValue().indexOf('dibujada') > 0;
  var franjas = txtFranjas.getValue().split(',').map(function (x) { return parseFloat(x); }).filter(function (x) { return x > 0; }).sort(function (a, b) { return a - b; });
  if (!franjas.length) { aviso('Indique franjas de distancia, p. ej. 1, 2, 5, 10.'); return; }
  var seguir = function (eje, nombre) {
    S.eje = eje;
    capa(ee.FeatureCollection([ee.Feature(eje)]).style({color: 'FF1744', width: 3}), {}, '◇ Eje vial ' + nombre);
    var anillos = franjas.map(function (km, i) {
      var g = eje.buffer(km * 1000, 50);
      if (i > 0) g = g.difference(eje.buffer(franjas[i - 1] * 1000, 50), 50);
      return ee.Feature(g, {franja: (i ? franjas[i - 1] : 0) + '–' + km + ' km', orden: i});
    });
    var fcA = ee.FeatureCollection(anillos);
    var nombresF = franjas.map(function (km, i) { return (i ? franjas[i - 1] : 0) + '–' + km + ' km'; });
    capa(fcA.style({color: '00000000', fillColor: 'FFEB3B22', width: 0}), {}, 'Franjas de distancia', true);
    mapa.centerObject(eje.buffer(franjas[franjas.length - 1] * 1000));
    arriba();

    // Panel de resultados con una sección por análisis; cada una se llena cuando llega su resultado
    abrirDer('Corredor vial · ' + nombre);
    var secPob = P([nota('⏳ Calculando población (GHSL)…')]);
    var secCon = P([nota('⏳ Calculando superficie construida (GHSL)…')]);
    var secPer = P([nota('⏳ Calculando pérdida de bosque (Hansen)…')]);
    var secDW = P();
    panelDer.add(h3('Población')); panelDer.add(secPob);
    panelDer.add(h3('Superficie construida')); panelDer.add(secCon);
    panelDer.add(h3('Pérdida de bosque')); panelDer.add(secPer);
    if (chkDW.getValue()) { panelDer.add(h3('Construcción anual (Dynamic World)')); secDW.add(nota('⏳ Calculando…')); panelDer.add(secDW); }
    panelDer.add(nota('GHSL estima población en celdas de 100 m a partir de censos y superficie construida: úsela como tendencia, no como conteo exacto. ' +
      'La franja 0–' + franjas[0] + ' km concentra el efecto directo de la vía.'));
    var pendientes = chkDW.getValue() ? 4 : 3;
    var terminar = function () { pendientes--; if (pendientes === 0) estado('Corredor analizado.'); };
    trabajando('Calculando población, construcción y deforestación…');
    ui.util.setTimeout(function () {
      if (pendientes > 0) estado('El cálculo está tardando más de lo normal; los resultados aparecerán al llegar. Pruebe con menos franjas o una vía más corta.', C.naranja);
    }, 90000);

    // Ejecuta una consulta y dibuja su sección; los errores se muestran en la propia sección
    var consulta = function (objeto, seccion, dibujar) {
      objeto.evaluate(function (r, err) {
        seccion.clear();
        if (err) { seccion.add(L('✖ ' + err, {color: C.rojo, fontSize: '11px', margin: '2px 8px', whiteSpace: 'pre-wrap'})); terminar(); return; }
        try { dibujar(r); }
        catch (e) { seccion.add(L('✖ Error al mostrar resultados: ' + e, {color: C.rojo, fontSize: '11px', margin: '2px 8px'})); }
        terminar();
      });
    };
    // Serie GHSL por epoca: toBands() nombra las bandas "<epoca>_<banda>"; se leen las épocas hasta 2025
    var serieGHSL = function (props, sufijo, factor) {
      var out = [];
      Object.keys(props).forEach(function (k) {
        if (k.indexOf(sufijo) < 0) return;
        var m = k.match(/(19|20)\d{2}/);          // año de la época dentro del nombre de la banda
        if (m && parseInt(m[0], 10) <= 2025) out.push([parseInt(m[0], 10), (props[k] || 0) * factor]);
      });
      return out.sort(function (a, b) { return a[0] - b[0]; });
    };
    // GHSL está en Mollweide; el código 'ESRI:54009' como texto no se puede interpretar, así que se usa la proyección
    // (WKT) de la propia colección. Se suma en su grilla nativa de 100 m para no distorsionar los conteos de población.
    var ghsl = function (id, banda) {
      var col = ee.ImageCollection(id).select(banda);
      var proj = ee.Image(col.first()).projection();
      return col.toBands().reduceRegions({collection: fcA, reducer: ee.Reducer.sum(), crs: proj, scale: 100, tileScale: 4}).sort('orden');
    };
    var datosPob = null;

    consulta(ghsl('JRC/GHSL/P2023A/GHS_POP', 'population_count'), secPob, function (fc) {
      var series = fc.features.map(function (f) { return serieGHSL(f.properties, 'population_count', 1); });
      if (!series.length || !series[0].length) { secPob.add(nota('Sin datos GHSL para esta zona.')); return; }
      var filas = [['Año'].concat(nombresF)];
      series[0].forEach(function (x, k) { filas.push([String(x[0])].concat(series.map(function (s) { return s[k] ? s[k][1] : 0; }))); });
      secPob.add(ui.Chart(filas, 'LineChart', {title: 'Población estimada por franja (2025 = proyección)', height: 230, pointSize: 3,
        legend: {position: 'top'}, hAxis: {slantedText: true, textStyle: {fontSize: 9}}, vAxis: {title: 'habitantes'}}));
      var tot = function (e) { return series.reduce(function (s, ser) { var v = 0; ser.forEach(function (x) { if (x[0] === e) v = x[1]; }); return s + v; }, 0); };
      secPob.add(kv('Población 2000 → 2020', num(tot(2000), 0) + ' → ' + num(tot(2020), 0)));
      secPob.add(kv('Crecimiento 2000–2020', num((tot(2020) / Math.max(tot(2000), 1) - 1) * 100, 0) + ' %', C.rojo));
      datosPob = filas;
      var tabla = ee.FeatureCollection(filas.slice(1).map(function (fl) {
        var p = {anio: parseInt(fl[0], 10)}; nombresF.forEach(function (n, i) { p['franja_' + (i + 1) + '_' + n.replace(/[^0-9]+/g, '_')] = fl[i + 1]; });
        return ee.Feature(eje.centroid(1), p);
      }));
      tabla.getDownloadURL('csv', null, nombreArchivo('Poblacion_corredor_' + nombre), function (u) { enlace('Población por año y franja (CSV)', u, secPob); });
    });

    consulta(ghsl('JRC/GHSL/P2023A/GHS_BUILT_S', 'built_surface'), secCon, function (fc) {
      var series = fc.features.map(function (f) { return serieGHSL(f.properties, 'built_surface', 1 / 1e4); });   // m² → ha
      if (!series.length || !series[0].length) { secCon.add(nota('Sin datos GHSL para esta zona.')); return; }
      var filas = [['Año'].concat(nombresF)];
      series[0].forEach(function (x, k) { filas.push([String(x[0])].concat(series.map(function (s) { return s[k] ? s[k][1] : 0; }))); });
      secCon.add(ui.Chart(filas, 'LineChart', {title: 'Superficie construida por franja (ha)', height: 220, pointSize: 3,
        legend: {position: 'top'}, hAxis: {slantedText: true, textStyle: {fontSize: 9}}, vAxis: {title: 'ha'}}));
    });

    var gfc = ee.Image(CFG.hansen);
    var loss = ee.Image.pixelArea().divide(1e4).updateMask(gfc.select('treecover2000').gte(30).and(gfc.select('lossyear').gt(0)))
      .addBands(gfc.select('lossyear'));
    consulta(loss.reduceRegions({collection: fcA, reducer: ee.Reducer.sum().group(1, 'anio'), scale: 30, tileScale: 4}).sort('orden'), secPer, function (fc) {
      var fl = [['Año'].concat(nombresF)], total = 0;
      for (var a = 1; a <= CFG.hansenUltimoAnio - 2000; a++) {
        fl.push([String(2000 + a)].concat(fc.features.map(function (f) {
          var v = 0; (f.properties.groups || []).forEach(function (g) { if (g.anio === a) v = g.sum; }); total += v; return v;
        })));
      }
      secPer.add(ui.Chart(fl, 'ColumnChart', {title: 'Pérdida de bosque por año y franja (ha)', isStacked: true, height: 230, legend: {position: 'top'},
        hAxis: {slantedText: true, textStyle: {fontSize: 8}}, vAxis: {title: 'ha'}}));
      secPer.add(kv('Pérdida total 2001–' + CFG.hansenUltimoAnio, num(total, 1) + ' ha', C.rojo));
    });

    if (chkDW.getValue()) {
      var dwAnios = [];
      for (var y = 2016; y <= ANIO_ACTUAL - 1; y++) dwAnios.push(y);
      var zonaDW = eje.buffer(franjas[franjas.length - 1] * 1000);
      var dw = ee.Image.cat(dwAnios.map(function (y) {
        var c = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1').filterBounds(zonaDW).filterDate(y + '-01-01', (y + 1) + '-01-01').select('label');
        return ee.Image(ee.Algorithms.If(c.size().gt(0), c.mode().eq(6), ee.Image.constant(0))).multiply(ee.Image.pixelArea().divide(1e4)).rename('dw_' + y);
      }));
      consulta(dw.reduceRegions({collection: fcA, reducer: ee.Reducer.sum(), scale: 30, tileScale: 8}).sort('orden'), secDW, function (fc) {
        var fd = [['Año'].concat(nombresF)];
        dwAnios.forEach(function (y) { fd.push([String(y)].concat(fc.features.map(function (f) { return f.properties['dw_' + y] || 0; }))); });
        secDW.add(ui.Chart(fd, 'LineChart', {title: 'Zonas construidas por año (Dynamic World, ha)', height: 220, pointSize: 3, legend: {position: 'top'}, vAxis: {title: 'ha'}}));
      });
    }
  };
  if (usarDib) {
    lineaBase(function (coords) { seguir(ee.Geometry.LineString(coords), 'dibujado'); });
  } else {
    var n = selCarr.getValue();
    seguir(ee.Geometry.LineString(CARRETERAS[n]), n.split(' (')[0]);
  }
}


// =======================================================================================
// LEGAL Y MARCA GITECA
// =======================================================================================
var LEGAL = {
  para: '',
  finalidad: 'Medir la dinámica de ríos, orillas y playas de la Amazonía peruana y la ocupación del territorio a lo largo de carreteras.',
  avisoResultados: 'Las tasas de erosión y los tiempos estimados hasta las zonas construidas son extrapolaciones de tendencias pasadas: ' +
    'no son pronósticos ni alertas oficiales y no sustituyen la evaluación de riesgo de las autoridades competentes.',
  privacidadExtra: 'La aplicación usa solo datos públicos agregados (imágenes satelitales, población por celdas de 100 m y zonas construidas). ' +
    'No identifica personas ni viviendas individuales.',
  fuentes: [
    ['Landsat 5, 7, 8 y 9 (USGS)', 'Dominio público', 'Agua y orillas 1985–hoy'],
    ['Copernicus Sentinel-2', 'Contiene datos modificados de Copernicus Sentinel', 'Agua y playas recientes'],
    ['Cloud Score+ (Google)', 'CC BY 4.0', 'Máscara de nubes'],
    ['JRC Global Surface Water', 'Uso libre con atribución (Source: EC JRC/Google)', 'Frecuencia de agua'],
    ['GHSL P2023A (JRC)', 'CC BY 4.0', 'Población y construcción'],
    ['Dynamic World', 'CC BY 4.0', 'Zonas construidas anuales'],
    ['Hansen GFC', 'CC BY 4.0', 'Pérdida de bosque'],
    ['Transectos tipo DSAS', 'Implementación propia del autor', 'Tasas de erosión']
  ]
};
var GITECA_AUTOR = 'Gino Machoa';
var GITECA_CORREO = 'gitecaconsulting@gmail.com';
var GITECA_PERFIL = 'Ing. en Ecología de Bosques Tropicales · Universidad Nacional de la Amazonía Peruana (UNAP), Iquitos';
var GITECA_MARCA = 'GITECA · Gestión de Información, Tecnología y Ciencias Ambientales';
var GITECA_WEB = 'https://diangelomachoa.github.io/GITECA-apps/';
var GITECA_ANIO = '2026';
var GITECA_VERDE = '#2E7D3E', GITECA_AZUL = '#1C5D99';
function _p(txt, negrita) {
  return L(txt, {fontSize: '12px', whiteSpace: 'pre-wrap', fontWeight: negrita ? 'bold' : 'normal', margin: '4px 6px'});
}
function _enl(txt, url) { return L(txt, {fontSize: '12px', color: GITECA_AZUL, margin: '2px 6px'}, url); }
// Cabecera: logo GITECA a la izquierda y nombre de la app a la derecha, sobre blanco como el logo
function cabeceraGiteca() {
  var logo = (CFG.logo && CFG.logo !== '') ?
    ui.Thumbnail({image: ee.Image(CFG.logo).visualize({bands: ['b1', 'b2', 'b3'], min: 0, max: 255}),
      params: {dimensions: 90, format: 'png'}, style: {width: '84px', height: '93px', margin: '4px 6px 4px 8px', backgroundColor: C.blanco}}) :
    L('GITECA', {fontSize: '20px', fontWeight: 'bold', color: GITECA_AZUL, margin: '30px 6px 0 8px', backgroundColor: C.blanco});
  var txt = P([
    L('RÍO VIVO', {fontSize: '26px', fontWeight: 'bold', color: GITECA_VERDE, margin: '10px 0 0 4px', backgroundColor: C.blanco}),
    L('Amazonía peruana', {fontSize: '15px', fontWeight: 'bold', color: GITECA_AZUL, margin: '0 0 2px 4px', backgroundColor: C.blanco}),
    L(CFG.subtitulo, {fontSize: '11px', color: C.tenue, margin: '0 0 2px 4px', whiteSpace: 'pre-wrap', backgroundColor: C.blanco}),
    L('Landsat · Sentinel-2 · JRC · GHSL · Dynamic World · Hansen · v' + CFG.version, {fontSize: '9px', color: '#7A8C80', margin: '0 0 4px 4px', backgroundColor: C.blanco})
  ], null, {backgroundColor: C.blanco, width: '262px', padding: '0'});
  return P([logo, txt], ui.Panel.Layout.flow('horizontal'), {backgroundColor: C.blanco, stretch: 'horizontal', padding: '0'});
}
function lineaAutor() {
  return L('Autor y desarrollador: ' + GITECA_AUTOR + ' · ' + GITECA_CORREO + ' · v' + CFG.version, {fontSize: '10px', color: C.tenue, margin: '0', padding: '4px 8px', stretch: 'horizontal'});
}
function _filaFuente(f) {
  return P([
    L(f[0], {fontSize: '11px', fontWeight: 'bold', width: '130px', margin: '2px 4px'}),
    L(f[1], {fontSize: '11px', width: '120px', margin: '2px 4px'}),
    L(f[2], {fontSize: '11px', width: '100px', margin: '2px 4px'})
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
    panelDer.add(_p('La aplicación no recoge datos personales ni guarda las geometrías que el usuario dibuja o carga: se procesan en la sesión y se pierden al cerrarla.'));
    if (LEGAL.privacidadExtra) panelDer.add(_p(LEGAL.privacidadExtra));
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
    for (var i = 0; i < LEGAL.fuentes.length; i++) panelDer.add(_filaFuente(LEGAL.fuentes[i]));
  }
}
function pieLegal() {
  var b = function (txt, s) { return ui.Button({label: txt, onClick: function () { verLegal(s); }, style: {fontSize: '10px', margin: '2px', padding: '0'}}); };
  return P([
    L('© ' + GITECA_ANIO + ' ' + GITECA_AUTOR + '. Todos los derechos reservados.', {fontSize: '11px', color: '#666', margin: '8px 6px 2px'}),
    P([b('Autoría', 'autoria'), b('Términos', 'terminos'), b('Privacidad', 'privacidad'), b('Cookies', 'cookies'), b('Licencias', 'licencias')],
      ui.Panel.Layout.flow('horizontal', true))
  ], null, {border: '1px solid ' + C.linea, margin: '10px 6px 6px 6px', backgroundColor: C.claro});
}


// =======================================================================================
// 9. ARRANQUE
// =======================================================================================
panelIzq.add(cabeceraGiteca());
panelIzq.add(cab);
panelIzq.add(lineaAutor());
panelIzq.add(lblZona);
panelIzq.add(barra);
panelIzq.add(cont);
panelIzq.add(pieLegal());
ui.root.clear();
ui.root.setLayout(ui.Panel.Layout.flow('horizontal'));
ui.root.add(panelIzq);
ui.root.add(mapa);
ui.root.add(panelDer);
tab(0);
