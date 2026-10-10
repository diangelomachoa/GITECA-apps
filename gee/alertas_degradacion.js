// =============================================================================
// © 2026 Gino Machoa. Todos los derechos reservados.
// Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
// Contacto: diangelomachoa@gmail.com
// Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.
// =============================================================================
// GITECA · ALERTAS DE DEFORESTACIÓN Y DEGRADACIÓN  (app Google Earth Engine)
// Basada en el núcleo del Monitor Forestal Amazónico; módulos visibles: ① Área, ⑤, ⑦ Ficha.
// Módulos:
//  ① Área de trabajo   dibujar o elegir un sitio de tesis FCF-UNAP
//  ② Cobertura          bosque 2000 y pérdida anual (Hansen GFC v1.11)
//  ③ Biomasa            biomasa aérea GEDI L4B y carbono estimado
//  ④ Fenología          series EVI (MODIS) y NDVI (Sentinel-2 + Cloud Score+)
//  ⑤ Alertas            alertas RADD por año (prioridad de atención)
//  ⑥ Hidroperíodo       agua superficial JRC y meses inundados bajo dosel (Sentinel-1)
//  ⑦ Ficha              resumen de resultados y descargas
// Solo ES5.
// =============================================================================

// ---------------------------------- CFG ---------------------------------------
var CFG = {
  nombre: 'Alertas de deforestación y degradación',
  subtitulo: 'Prioridad de atención por área de trabajo',
  version: '1.0',
  logo: 'projects/gitecapps-511217/assets/giteca_logo_gee', // ID del asset del logo GITECA (recursos/giteca_logo_gee.tif); vacío = cabecera en texto
  planet: '', // no se usa en apps abiertas
  ds: {
    gfc: 'UMD/hansen/global_forest_change_2023_v1_11',
    gedi: 'LARSE/GEDI/GEDI04_B_002',
    modis: 'MODIS/061/MOD13Q1',
    s2: 'COPERNICUS/S2_SR_HARMONIZED',
    csp: 'GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED',
    radd: 'projects/radar-wur/raddalert/v1',
    s1: 'COPERNICUS/S1_GRD',
    jrc: 'JRC/GSW1_4/GlobalSurfaceWater'
  },
  umbralBosque: 30,      // % de cobertura de dosel para "bosque" (Hansen)
  fraccionCarbono: 0.47, // IPCC 2006
  umbralInundDb: 2.0,    // dB sobre aguas bajas (referencial, calibrar)
  maxAreaHa: 50000,      // tope para análisis interactivo
  centro: [-73.45, -3.95], zoom: 10,
  modulos: ['①', '⑤', '⑦'] // pestañas visibles
};

// Sitios de tesis FCF-UNAP (localidades citadas; coordenadas aproximadas)
var SITIOS = {
  'Allpahuayo-Mishana': [-73.43, -3.95], 'Puerto Almendra': [-73.38, -3.83],
  'Arboretum El Huayo': [-73.37, -3.82], 'Jenaro Herrera': [-73.67, -4.90],
  'Carretera Iquitos-Nauta': [-73.45, -4.10], 'Nauta': [-73.58, -4.51],
  'Río Nanay': [-73.60, -3.75], 'Quistococha': [-73.32, -3.83],
  'Zungarococha': [-73.36, -3.83], 'Tamshiyacu': [-73.16, -4.00],
  'Mazán': [-73.09, -3.50], 'Indiana': [-73.04, -3.50],
  'Requena': [-73.85, -5.06], 'Pacaya-Samiria': [-74.80, -5.30]
};

// --------------------------------- Estado -------------------------------------
var S = {aoi: null, areaHa: null, epsg: null, res: {}};

// -------------------------------- Utilidades ----------------------------------
function num(x, d) { if (x === null || x === undefined || isNaN(x)) { return '—'; } return Number(x).toFixed(d === undefined ? 1 : d); }
function fmtFecha(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function epsgUTM(lon, lat) { var z = Math.floor((lon + 180) / 6) + 1; return (lat < 0 ? 'EPSG:327' : 'EPSG:326') + ('0' + z).slice(-2); }
function capa(img, vis, nombre, mostrar) {
  var ls = mapa.layers();
  for (var i = ls.length() - 1; i >= 0; i--) { if (ls.get(i).getName() === nombre) { ls.remove(ls.get(i)); } }
  var l = ui.Map.Layer(img, vis, nombre, mostrar === undefined ? true : mostrar);
  ls.add(l); arriba(); return l;
}
function arriba() {
  var ls = mapa.layers(), vect = [];
  for (var i = ls.length() - 1; i >= 0; i--) { var n = ls.get(i).getName(); if (n.charAt(0) === '◇' || n.charAt(0) === '●') { vect.push(ls.get(i)); ls.remove(ls.get(i)); } }
  for (var j = vect.length - 1; j >= 0; j--) { ls.add(vect[j]); }
}

// ------------------------------ Constructores UI ------------------------------
var FONDO = '#F0F2ED'; // color de fondo del logo GITECA
var VERDE = '#2E7D3E', AZUL = '#1C5D99', ROJO = '#B23A48', NARANJA = '#E07B00';
function h2(t) { return ui.Label(t, {backgroundColor: FONDO, fontSize: '15px', fontWeight: 'bold', color: AZUL, margin: '10px 6px 4px'}); }
function h3(t) { return ui.Label(t, {backgroundColor: FONDO, fontSize: '13px', fontWeight: 'bold', margin: '8px 6px 2px'}); }
function nota(t) { return ui.Label(t, {backgroundColor: FONDO, fontSize: '11px', color: '#555', whiteSpace: 'pre-wrap', margin: '2px 6px'}); }
function kv(k, v, color) {
  return ui.Panel([ui.Label(k, {backgroundColor: FONDO, fontSize: '12px', width: '190px', margin: '2px 6px'}),
    ui.Label(v, {backgroundColor: FONDO, fontSize: '12px', fontWeight: 'bold', color: color || '#222', margin: '2px 6px'})], ui.Panel.Layout.flow('horizontal'), {backgroundColor: FONDO});
}
function boton(t, fn, color) { return ui.Button({label: t, onClick: fn, style: {color: color || VERDE, margin: '4px 6px'}}); }
function fila(ws) { return ui.Panel(ws, ui.Panel.Layout.flow('horizontal', true), {backgroundColor: FONDO}); }
function selector(items, ph, fn) { return ui.Select({items: items, placeholder: ph, onChange: fn, style: {margin: '4px 6px', width: '330px'}}); }
function deslizador(min, max, val, paso, fn) { return ui.Slider({min: min, max: max, value: val, step: paso, onChange: fn, style: {width: '330px', margin: '2px 6px'}}); }
function campoFechas(ini, fin) {
  var a = ui.Textbox({value: ini, style: {width: '150px', margin: '2px 6px'}});
  var b = ui.Textbox({value: fin, style: {width: '150px', margin: '2px 6px'}});
  return {panel: fila([a, b]), a: a, b: b};
}
function leerFechas(c) {
  var re = /^\d{4}-\d{2}-\d{2}$/; var a = c.a.getValue(), b = c.b.getValue();
  if (!re.test(a) || !re.test(b)) { aviso('Use fechas AAAA-MM-DD.'); return null; }
  if (a >= b) { aviso('La fecha inicial debe ser anterior a la final.'); return null; }
  return [a, b];
}
function enlace(t, url) { return ui.Label(t, {backgroundColor: FONDO, fontSize: '12px', color: AZUL, margin: '2px 6px'}, url); }

// -------------------------------- Estructura ----------------------------------
var panelIzq = ui.Panel({style: {width: '385px', padding: '6px', backgroundColor: FONDO}});
var panelDer = ui.Panel({style: {width: '395px', padding: '8px', shown: false, backgroundColor: FONDO}});
var mapa = ui.Map();
mapa.setOptions('HYBRID');
mapa.setCenter(CFG.centro[0], CFG.centro[1], CFG.zoom);
mapa.style().set('cursor', 'crosshair');
ui.root.clear();
ui.root.setLayout(ui.Panel.Layout.flow('horizontal'), {backgroundColor: FONDO});
ui.root.add(panelIzq); ui.root.add(mapa); ui.root.add(panelDer);

var lblEstado = ui.Label('Listo. Defina un área de trabajo.', {backgroundColor: FONDO, fontSize: '12px', margin: '2px 8px'});
mapa.add(ui.Panel([lblEstado], null, {position: 'bottom-center', padding: '2px 6px'}));
function estado(t) { lblEstado.setValue(t || 'Listo.'); lblEstado.style().set('color', '#222'); }
function trabajando(t) { lblEstado.setValue('⏳ ' + t); lblEstado.style().set('color', NARANJA); }
function aviso(t) { lblEstado.setValue('⚠ ' + t); lblEstado.style().set('color', ROJO); }

var leyenda = ui.Panel({style: {position: 'top-right', padding: '6px', shown: false}});
mapa.add(leyenda);
function setLeyenda(titulo, colores, etiquetas) {
  leyenda.clear(); leyenda.style().set('shown', true);
  leyenda.add(ui.Label(titulo, {backgroundColor: FONDO, fontWeight: 'bold', fontSize: '12px', margin: '0 0 4px'}));
  for (var i = 0; i < colores.length; i++) {
    leyenda.add(ui.Panel([ui.Label('', {backgroundColor: colores[i], padding: '7px', margin: '2px 4px'}),
      ui.Label(etiquetas[i], {backgroundColor: FONDO, fontSize: '11px', margin: '2px 4px'})], ui.Panel.Layout.flow('horizontal'), {backgroundColor: FONDO}));
  }
}

function abrirDer(titulo) {
  panelDer.clear(); panelDer.style().set('shown', true);
  panelDer.add(ui.Panel([ui.Label(titulo, {backgroundColor: FONDO, fontWeight: 'bold', fontSize: '15px', color: AZUL}),
    ui.Button({label: '✕', onClick: function() { panelDer.style().set('shown', false); }})], ui.Panel.Layout.flow('horizontal'), {backgroundColor: FONDO}));
}

// --------------------------- ① Área de trabajo --------------------------------
var dt = mapa.drawingTools();
dt.setShown(true); dt.setDrawModes(['rectangle', 'polygon']); dt.setLinked(false);
dt.onDraw(function() { definirAOIdesdeDibujo(); });
dt.onEdit(function() { definirAOIdesdeDibujo(); });

function definirAOIdesdeDibujo() {
  var ls = dt.layers(); if (ls.length() === 0) { return; }
  var g = ls.get(ls.length() - 1).getEeObject();
  fijarAOI(ee.Geometry(g), 'Polígono dibujado');
}
function fijarAOI(geom, etiqueta) {
  S.aoi = geom; S.res = {};
  capa(ee.Image().paint(ee.FeatureCollection([ee.Feature(geom)]), 0, 2), {palette: ['00FFFF']}, '◇ Área de trabajo');
  mapa.centerObject(geom);
  trabajando('Calculando superficie…');
  geom.area(10).divide(1e4).evaluate(function(ha, err) {
    if (err) { aviso('No se pudo calcular el área: ' + err); return; }
    try {
      S.areaHa = ha;
      var c = geom.centroid(10).coordinates();
      c.evaluate(function(xy) { if (xy) { S.epsg = epsgUTM(xy[0], xy[1]); } });
      lblArea.setValue(etiqueta + ' · ' + num(ha, 1) + ' ha');
      if (ha > CFG.maxAreaHa) { aviso('Área de ' + num(ha, 0) + ' ha: reduzca a menos de ' + CFG.maxAreaHa + ' ha para análisis interactivo.'); return; }
    } catch (e) { aviso(String(e)); return; }
    estado('Área definida: ' + num(ha, 1) + ' ha. Elija un módulo.');
  });
}
function requiereAOI() { if (!S.aoi) { aviso('Primero defina el área de trabajo (①).'); return false; } if (S.areaHa > CFG.maxAreaHa) { aviso('Área demasiado grande.'); return false; } return true; }

// ------------------------------ ② Cobertura -----------------------------------
function moduloCobertura() {
  if (!requiereAOI()) { return; }
  var gfc = ee.Image(CFG.ds.gfc);
  var bosque = gfc.select('treecover2000').gte(CFG.umbralBosque);
  var perdida = gfc.select('loss').and(bosque);
  var anio = gfc.select('lossyear').add(2000).updateMask(perdida);
  capa(bosque.selfMask().clip(S.aoi), {palette: ['1B5E20']}, 'Bosque 2000 (Hansen)', false);
  capa(anio.clip(S.aoi), {min: 2001, max: 2023, palette: ['FFFF66', 'FF8C00', 'B22222']}, 'Año de pérdida (Hansen)');
  setLeyenda('Año de pérdida', ['#FFFF66', '#FF8C00', '#B22222'], ['2001', '2012', '2023']);
  abrirDer('② Cobertura de bosque');
  var cont = ui.Panel({style: {backgroundColor: FONDO}}); panelDer.add(cont); cont.add(nota('Calculando…'));
  trabajando('Calculando bosque y pérdida…');
  var px = ee.Image.pixelArea().divide(1e4);
  var st = px.updateMask(bosque).rename('b').addBands(px.updateMask(perdida).rename('p'))
    .reduceRegion({reducer: ee.Reducer.sum(), geometry: S.aoi, scale: 30, maxPixels: 1e10, bestEffort: true});
  st.evaluate(function(r, err) {
    cont.clear();
    if (err) { aviso('Error en cobertura: ' + err); return; }
    try {
      S.res.cobertura = {bosque2000: r.b, perdida: r.p, pct: 100 * r.p / Math.max(r.b, 1)};
      cont.add(kv('Bosque 2000 (dosel ≥ ' + CFG.umbralBosque + ' %)', num(r.b, 1) + ' ha'));
      cont.add(kv('Pérdida 2001–2023', num(r.p, 1) + ' ha', ROJO));
      cont.add(kv('Proporción perdida', num(S.res.cobertura.pct, 2) + ' %', ROJO));
    } catch (e) { aviso(String(e)); return; }
    estado('Cobertura calculada.');
  });
  // Serie anual en una consulta separada
  var porAnio = px.addBands(gfc.select('lossyear').updateMask(perdida)).reduceRegion({
    reducer: ee.Reducer.sum().group({groupField: 1, groupName: 'anio'}), geometry: S.aoi, scale: 30, maxPixels: 1e10, bestEffort: true});
  var fc = ee.FeatureCollection(ee.List(porAnio.get('groups')).map(function(g) {
    g = ee.Dictionary(g); return ee.Feature(null, {anio: ee.Number(g.get('anio')).add(2000), ha: g.get('sum')});
  }));
  panelDer.add(ui.Chart.feature.byFeature(fc, 'anio', 'ha').setChartType('ColumnChart')
    .setOptions({title: 'Pérdida de bosque por año (ha)', legend: 'none', colors: [ROJO], hAxis: {format: '####'}}));
  panelDer.add(nota('Hansen GFC detecta pérdida de dosel a 30 m; puede omitir degradación selectiva. Fuente: Hansen et al. (2013), CC BY 4.0.'));
}

// ------------------------------- ③ Biomasa ------------------------------------
function moduloBiomasa() {
  if (!requiereAOI()) { return; }
  var g = ee.Image(CFG.ds.gedi);
  var mu = g.select('MU').updateMask(g.select('MU').gt(0));
  capa(mu.clip(S.aoi.buffer(2000)), {min: 0, max: 350, palette: ['f7fcf5', 'a1d99b', '41ab5d', '006d2c', '00441b']}, 'Biomasa GEDI L4B (Mg/ha)');
  setLeyenda('Biomasa aérea (Mg/ha)', ['#f7fcf5', '#41ab5d', '#00441b'], ['0', '175', '≥ 350']);
  abrirDer('③ Biomasa aérea (GEDI L4B)');
  var cont = ui.Panel({style: {backgroundColor: FONDO}}); panelDer.add(cont); cont.add(nota('Calculando…'));
  trabajando('Consultando GEDI L4B…');
  var r = mu.rename('mu').addBands(g.select('SE').rename('se'))
    .reduceRegion({reducer: ee.Reducer.mean().combine(ee.Reducer.count(), '', true), geometry: S.aoi, scale: 1000, maxPixels: 1e9, bestEffort: true});
  r.evaluate(function(v, err) {
    cont.clear();
    if (err) { aviso('Error en biomasa: ' + err); return; }
    try {
      if (!v || v.mu_mean === null) { cont.add(nota('GEDI no tiene celdas válidas en esta área (cobertura de 1 km). Amplíe el área.')); estado('Sin datos GEDI.'); return; }
      var c = v.mu_mean * CFG.fraccionCarbono;
      S.res.biomasa = {media: v.mu_mean, se: v.se_mean, celdas: v.mu_count, carbono: c};
      cont.add(kv('Biomasa aérea media', num(v.mu_mean, 1) + ' Mg/ha'));
      cont.add(kv('Error estándar medio (GEDI)', '± ' + num(v.se_mean, 1) + ' Mg/ha', NARANJA));
      cont.add(kv('Carbono aéreo estimado', num(c, 1) + ' Mg C/ha'));
      cont.add(kv('Celdas GEDI de 1 km usadas', String(v.mu_count), v.mu_count < 5 ? ROJO : '#222'));
      if (S.areaHa) { cont.add(kv('Carbono aéreo total aprox.', num(c * S.areaHa / 1000, 2) + ' Gg C')); }
      cont.add(nota('Con menos de 5 celdas el promedio es poco representativo. GEDI no reemplaza un inventario de campo. Carbono = 0,47 × biomasa (IPCC 2006).'));
    } catch (e) { aviso(String(e)); return; }
    estado('Biomasa calculada.');
  });
}

// ------------------------------ ④ Fenología -----------------------------------
var fechasFeno = campoFechas('2019-01-01', fmtFecha(new Date()));
function moduloFenologia() {
  if (!requiereAOI()) { return; }
  var f = leerFechas(fechasFeno); if (!f) { return; }
  abrirDer('④ Fenología');
  trabajando('Generando series (puede tardar)…');
  var modis = ee.ImageCollection(CFG.ds.modis).filterDate(f[0], f[1]).map(function(i) {
    return i.select('EVI').multiply(0.0001).updateMask(i.select('SummaryQA').lte(1)).copyProperties(i, ['system:time_start']);
  });
  var s2 = ee.ImageCollection(CFG.ds.s2).filterBounds(S.aoi).filterDate(f[0], f[1])
    .linkCollection(ee.ImageCollection(CFG.ds.csp), ['cs'])
    .map(function(i) { return i.normalizedDifference(['B8', 'B4']).rename('NDVI').updateMask(i.select('cs').gte(0.6)).copyProperties(i, ['system:time_start']); });
  capa(s2.median().clip(S.aoi), {min: 0.4, max: 0.9, palette: ['fff7bc', '78c679', '005a32']}, 'NDVI mediano Sentinel-2');
  setLeyenda('NDVI mediano', ['#fff7bc', '#78c679', '#005a32'], ['0,4', '0,65', '0,9']);
  panelDer.add(ui.Chart.image.series(modis, S.aoi, ee.Reducer.mean(), 250)
    .setOptions({title: 'EVI MODIS (250 m)', lineWidth: 1, pointSize: 2, colors: [VERDE], legend: 'none'}));
  panelDer.add(ui.Chart.image.series(s2, S.aoi, ee.Reducer.mean(), 20)
    .setOptions({title: 'NDVI Sentinel-2 (nubes enmascaradas)', lineWidth: 0, pointSize: 3, colors: [AZUL], legend: 'none'}));
  var meses = ee.List.sequence(1, 12);
  var clim = ee.FeatureCollection(meses.map(function(m) {
    var v = modis.filter(ee.Filter.calendarRange(m, m, 'month')).mean().reduceRegion(ee.Reducer.mean(), S.aoi, 250).get('EVI');
    return ee.Feature(null, {mes: m, EVI: v});
  }));
  panelDer.add(ui.Chart.feature.byFeature(clim, 'mes', 'EVI').setChartType('ColumnChart')
    .setOptions({title: 'Perfil mensual promedio de EVI', legend: 'none', colors: ['#C9A227'], hAxis: {title: 'Mes'}}));
  S.res.fenologia = {inicio: f[0], fin: f[1]};
  panelDer.add(nota('La nubosidad amazónica deja vacíos en la serie de Sentinel-2. Interprete tendencias con datos de campo.'));
  estado('Series solicitadas; los gráficos aparecen al terminar el cálculo.');
}

// ------------------------------- ⑤ Alertas ------------------------------------
function moduloAlertas() {
  if (!requiereAOI()) { return; }
  var radd = ee.ImageCollection(CFG.ds.radd).filterMetadata('layer', 'contains', 'alert')
    .filterMetadata('geography', 'equals', 'sa').sort('system:time_end', false).first();
  var conf = radd.select('Alert');
  var anio = radd.select('Date').divide(1000).floor().add(2000).rename('anio');
  var alta = anio.updateMask(conf.eq(3)), baja = anio.updateMask(conf.eq(2));
  capa(anio.updateMask(conf.gte(2)).clip(S.aoi), {min: 2019, max: 2026, palette: ['ffffb2', 'fd8d3c', 'bd0026']}, 'Alertas RADD (año)');
  setLeyenda('Alertas RADD', ['#ffffb2', '#fd8d3c', '#bd0026'], ['2019', '2022', '2026']);
  abrirDer('⑤ Alertas de pérdida de bosque (RADD)');
  var cont = ui.Panel({style: {backgroundColor: FONDO}}); panelDer.add(cont); cont.add(nota('Calculando…'));
  trabajando('Contando alertas RADD…');
  var px = ee.Image.pixelArea().divide(1e4);
  px.updateMask(alta).rename('alta').addBands(px.updateMask(baja).rename('baja'))
    .reduceRegion({reducer: ee.Reducer.sum(), geometry: S.aoi, scale: 10, maxPixels: 1e10, bestEffort: true})
    .evaluate(function(r, err) {
      cont.clear();
      if (err) { aviso('Error en alertas: ' + err); return; }
      try {
        var tot = (r.alta || 0) + (r.baja || 0);
        var pr = tot === 0 ? 'Baja' : (tot < 5 ? 'Media' : 'Alta');
        S.res.alertas = {alta: r.alta, baja: r.baja, total: tot, prioridad: pr};
        cont.add(kv('Alertas de confianza alta', num(r.alta, 2) + ' ha', ROJO));
        cont.add(kv('Alertas de confianza baja', num(r.baja, 2) + ' ha', NARANJA));
        cont.add(kv('Prioridad de atención', pr, pr === 'Alta' ? ROJO : (pr === 'Media' ? NARANJA : VERDE)));
        cont.add(nota('Prioridad: Baja = sin alertas; Media = < 5 ha; Alta = ≥ 5 ha. Criterio orientativo para planificar verificaciones, no un dictamen. Las alertas RADD requieren verificación de campo o con imágenes de alta resolución.'));
      } catch (e) { aviso(String(e)); return; }
      estado('Alertas calculadas.');
    });
  var porAnio = px.addBands(anio.updateMask(conf.gte(2)).int()).reduceRegion({
    reducer: ee.Reducer.sum().group({groupField: 1, groupName: 'anio'}), geometry: S.aoi, scale: 10, maxPixels: 1e10, bestEffort: true});
  var fc = ee.FeatureCollection(ee.List(porAnio.get('groups')).map(function(g) {
    g = ee.Dictionary(g); return ee.Feature(null, {anio: g.get('anio'), ha: g.get('sum')});
  }));
  panelDer.add(ui.Chart.feature.byFeature(fc, 'anio', 'ha').setChartType('ColumnChart')
    .setOptions({title: 'Hectáreas con alerta por año', legend: 'none', colors: [ROJO], hAxis: {format: '####'}}));
}

// ----------------------------- ⑥ Hidroperíodo ---------------------------------
var sldAnio = deslizador(2017, new Date().getFullYear() - 1, new Date().getFullYear() - 1, 1, null);
function moduloHidro() {
  if (!requiereAOI()) { return; }
  var a = sldAnio.getValue();
  var jrc = ee.Image(CFG.ds.jrc);
  capa(jrc.select('occurrence').selfMask().clip(S.aoi), {min: 0, max: 100, palette: ['c6dbef', '08306b']}, 'JRC: ocurrencia de agua (%)', false);
  var s1 = ee.ImageCollection(CFG.ds.s1).filterBounds(S.aoi).filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV')).select('VV');
  var base = s1.filterDate(a + '-08-01', a + '-10-31').median().focalMedian(50, 'circle', 'meters'); // filtro de moteado
  var mensual = ee.ImageCollection(ee.List.sequence(1, 12).map(function(m) {
    var ini = ee.Date.fromYMD(a, m, 1);
    var img = s1.filterDate(ini, ini.advance(1, 'month')).median().focalMedian(50, 'circle', 'meters');
    return img.subtract(base).gt(CFG.umbralInundDb).rename('inundado').set('system:time_start', ini.advance(14, 'day').millis());
  }));
  var hp = mensual.sum().rename('meses').clip(S.aoi);
  capa(hp.selfMask(), {min: 1, max: 8, palette: ['d9f0a3', '41ab5d', '004529']}, 'Meses inundados bajo dosel (' + a + ')');
  setLeyenda('Meses inundados (' + a + ')', ['#d9f0a3', '#41ab5d', '#004529'], ['1', '4', '≥ 8']);
  abrirDer('⑥ Hidroperíodo ' + a);
  var cont = ui.Panel({style: {backgroundColor: FONDO}}); panelDer.add(cont); cont.add(nota('Calculando…'));
  trabajando('Procesando Sentinel-1…');
  hp.gte(1).multiply(ee.Image.pixelArea().divide(1e4)).rename('ha')
    .addBands(jrc.select('occurrence').gt(50).multiply(ee.Image.pixelArea().divide(1e4)).rename('agua'))
    .reduceRegion({reducer: ee.Reducer.sum(), geometry: S.aoi, scale: 30, maxPixels: 1e10, bestEffort: true})
    .evaluate(function(r, err) {
      cont.clear();
      if (err) { aviso('Error en hidroperíodo: ' + err); return; }
      try {
        S.res.hidro = {anio: a, inundadoHa: r.ha, aguaPermHa: r.agua};
        cont.add(kv('Área con ≥ 1 mes inundado bajo dosel', num(r.ha, 1) + ' ha', AZUL));
        cont.add(kv('Agua abierta frecuente (JRC > 50 %)', num(r.agua, 1) + ' ha'));
        cont.add(nota('Umbral referencial de ' + CFG.umbralInundDb + ' dB sobre aguas bajas (ago–oct), con filtro de moteado de 50 m. En tierra firme pueden quedar píxeles aislados por ruido del radar: calibre el umbral con puntos de campo inundados y no inundados.'));
      } catch (e) { aviso(String(e)); return; }
      estado('Hidroperíodo calculado.');
    });
  panelDer.add(ui.Chart.image.series(mensual, S.aoi, ee.Reducer.mean(), 50)
    .setOptions({title: 'Fracción del área inundada por mes', legend: 'none', colors: [AZUL], vAxis: {title: 'Fracción', minValue: 0, maxValue: 1}}));
}

// -------------------------------- ⑦ Ficha -------------------------------------
function moduloFicha() {
  if (!requiereAOI()) { return; }
  abrirDer('⑦ Ficha del área de trabajo');
  var R = S.res;
  panelDer.add(kv('Superficie', num(S.areaHa, 1) + ' ha'));
  panelDer.add(kv('Sistema UTM sugerido', S.epsg || '—'));
  panelDer.add(h3('Cobertura (Hansen)'));
  panelDer.add(R.cobertura ? kv('Pérdida 2001–2023', num(R.cobertura.perdida, 1) + ' ha (' + num(R.cobertura.pct, 2) + ' %)') : nota('No calculado (módulo ②).'));
  panelDer.add(h3('Biomasa (GEDI L4B)'));
  panelDer.add(R.biomasa ? kv('Biomasa / carbono', num(R.biomasa.media, 1) + ' Mg/ha · ' + num(R.biomasa.carbono, 1) + ' Mg C/ha') : nota('No calculado (módulo ③).'));
  panelDer.add(h3('Alertas (RADD)'));
  panelDer.add(R.alertas ? kv('Área alertada / prioridad', num(R.alertas.total, 2) + ' ha · ' + R.alertas.prioridad) : nota('No calculado (módulo ⑤).'));
  panelDer.add(h3('Hidroperíodo'));
  panelDer.add(R.hidro ? kv('Inundado bajo dosel ' + R.hidro.anio, num(R.hidro.inundadoHa, 1) + ' ha') : nota('No calculado (módulo ⑥).'));
  panelDer.add(h3('Descargas'));
  var fc = ee.FeatureCollection([ee.Feature(S.aoi, {
    area_ha: S.areaHa, perdida_ha: R.cobertura ? R.cobertura.perdida : null,
    biomasa_mgha: R.biomasa ? R.biomasa.media : null, alertas_ha: R.alertas ? R.alertas.total : null,
    inund_ha: R.hidro ? R.hidro.inundadoHa : null, fuente: 'GITECA - ' + CFG.nombre + ' v' + CFG.version})]);
  var formatos = ['CSV', 'GeoJSON', 'KML', 'SHP'];
  var pnl = ui.Panel({style: {backgroundColor: FONDO}}); panelDer.add(pnl);
  trabajando('Preparando enlaces de descarga…');
  formatos.forEach(function(fm) {
    fc.getDownloadURL({format: fm, filename: 'GITECA_ficha'}, function(url, err) {
      if (err) { pnl.add(nota(fm + ': ' + err)); return; }
      pnl.add(enlace('Descargar ficha (' + fm + ')', url));
      estado('Ficha lista.');
    });
  });
  panelDer.add(nota('Resultados referenciales; no constituyen prueba ni pronunciamiento oficial.'));
}

// ============================ LEGAL Y MARCA GITECA ============================
var LEGAL = {
  para: '',
  finalidad: 'Caracterizar áreas de trabajo en la Amazonía peruana: cobertura y pérdida de bosque, biomasa aérea, fenología, alertas de pérdida e inundación bajo dosel.',
  avisoResultados: 'Cada módulo tiene límites propios de resolución e incertidumbre (indicados en pantalla); las alertas y el hidroperíodo requieren verificación de campo.',
  privacidadExtra: '',
  fuentes: [
    ['Alertas RADD (Wageningen University)', 'CC BY 4.0', 'Alertas de pérdida']
  ]
};
// ---- legal_fn.js (GITECA) pegado sin cambios ----
var GITECA_AUTOR = 'Gino Machoa';
var GITECA_CORREO = 'diangelomachoa@gmail.com';
var GITECA_PERFIL = 'Ing. en Ecología de Bosques Tropicales · Universidad Nacional de la Amazonía Peruana (UNAP), Iquitos';
var GITECA_MARCA = 'GITECA · Gestión de Información, Tecnología y Ciencias Ambientales';
var GITECA_WEB = 'https://diangelomachoa.github.io/GITECA-apps/';
var GITECA_ANIO = '2026';
var GITECA_VERDE = '#2E7D3E', GITECA_AZUL = '#1C5D99';
function _p(txt, negrita) { return ui.Label(txt, {backgroundColor: FONDO, fontSize: '12px', whiteSpace: 'pre-wrap', fontWeight: negrita ? 'bold' : 'normal', margin: '4px 6px'}); }
function _enl(txt, url) { return ui.Label(txt, {backgroundColor: FONDO, fontSize: '12px', color: GITECA_AZUL, margin: '2px 6px'}, url); }
function cabeceraGiteca() {
  var p = ui.Panel({style: {padding: '4px 0', backgroundColor: FONDO}});
  if (CFG.logo && CFG.logo !== '') {
    p.add(ui.Thumbnail({image: ee.Image(CFG.logo).visualize({bands: ['b1', 'b2', 'b3'], min: 0, max: 255}),
      params: {dimensions: '180x200', format: 'png'}, style: {width: '180px', height: '200px', margin: '0 0 0 92px', backgroundColor: FONDO}}));
  } else {
    p.add(ui.Label('GITECA', {backgroundColor: FONDO, fontSize: '26px', fontWeight: 'bold', color: GITECA_AZUL, margin: '0 6px'}));
    p.add(ui.Label('Gestión de Información, Tecnología y Ciencias Ambientales', {backgroundColor: FONDO, fontSize: '11px', color: GITECA_VERDE, margin: '0 6px'}));
  }
  p.add(ui.Label(CFG.nombre, {backgroundColor: FONDO, fontSize: '17px', fontWeight: 'bold', margin: '8px 6px 0'}));
  if (CFG.subtitulo) { p.add(ui.Label(CFG.subtitulo, {backgroundColor: FONDO, fontSize: '12px', color: '#555', margin: '2px 6px'})); }
  return p;
}
function lineaAutor() { return ui.Label('Autor y desarrollador: ' + GITECA_AUTOR + ' · ' + GITECA_CORREO + ' · v' + CFG.version, {backgroundColor: FONDO, fontSize: '11px', color: '#666', margin: '0 6px 8px'}); }
function _filaFuente(f) {
  return ui.Panel([ui.Label(f[0], {backgroundColor: FONDO, fontSize: '11px', fontWeight: 'bold', width: '130px', margin: '2px 4px'}),
    ui.Label(f[1], {backgroundColor: FONDO, fontSize: '11px', width: '120px', margin: '2px 4px'}),
    ui.Label(f[2], {backgroundColor: FONDO, fontSize: '11px', width: '100px', margin: '2px 4px'})], ui.Panel.Layout.flow('horizontal'), {backgroundColor: FONDO});
}
function verLegal(seccion) {
  abrirDer('Avisos legales · ' + CFG.nombre + ' v' + CFG.version);
  if (seccion === 'autoria') {
    panelDer.add(_p('Autoría y copyright', true));
    panelDer.add(_p('© ' + GITECA_ANIO + ' ' + GITECA_AUTOR + '. Todos los derechos reservados. Autor y desarrollador: ' + GITECA_AUTOR + '.'));
    panelDer.add(_p(GITECA_PERFIL)); panelDer.add(_p(GITECA_MARCA));
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
  var b = function(txt, s) { return ui.Button({label: txt, onClick: function() { verLegal(s); }, style: {fontSize: '10px', margin: '2px', padding: '0'}}); };
  return ui.Panel([
    ui.Label('© ' + GITECA_ANIO + ' ' + GITECA_AUTOR + '. Todos los derechos reservados.', {backgroundColor: FONDO, fontSize: '11px', color: '#666', margin: '8px 6px 2px'}),
    ui.Panel([b('Autoría', 'autoria'), b('Términos', 'terminos'), b('Privacidad', 'privacidad'), b('Cookies', 'cookies'), b('Licencias', 'licencias')], ui.Panel.Layout.flow('horizontal', true), {backgroundColor: FONDO})
  ], null, {border: '1px solid #d6dccd', margin: '10px 0 0', backgroundColor: FONDO});
}

// -------------------------------- Arranque ------------------------------------
var lblArea = ui.Label('Sin área definida', {backgroundColor: FONDO, fontSize: '12px', fontWeight: 'bold', color: AZUL, margin: '2px 6px'});
var cuerpo = ui.Panel({style: {backgroundColor: FONDO}});
var pestanas = [
  {t: '① Área', fn: vistaArea}, {t: '② Cobertura', fn: vistaCobertura}, {t: '③ Biomasa', fn: vistaBiomasa},
  {t: '④ Fenología', fn: vistaFeno}, {t: '⑤ Alertas', fn: vistaAlertas}, {t: '⑥ Inundación', fn: vistaHidro}, {t: '⑦ Ficha', fn: vistaFicha}
];
var botonesTab = [];
pestanas = pestanas.filter(function(p) { return CFG.modulos.indexOf(p.t.charAt(0)) >= 0; });
function activar(i) {
  for (var j = 0; j < botonesTab.length; j++) { botonesTab[j].style().set('color', j === i ? ROJO : '#333'); }
  cuerpo.clear(); pestanas[i].fn();
}
for (var k = 0; k < pestanas.length; k++) {
  (function(i) { botonesTab.push(ui.Button({label: pestanas[i].t, onClick: function() { activar(i); }, style: {margin: '2px', fontSize: '11px'}})); })(k);
}
function vistaArea() {
  cuerpo.add(h2('① Área de trabajo'));
  cuerpo.add(nota('Dibuje un rectángulo o polígono con las herramientas del mapa, o elija un sitio de tesis FCF-UNAP (se usa un radio de 3 km).'));
  cuerpo.add(selector(Object.keys(SITIOS), 'Sitio de tesis FCF-UNAP…', function(n) {
    var c = SITIOS[n]; fijarAOI(ee.Geometry.Point(c).buffer(3000).bounds(), n + ' (radio 3 km)');
  }));
  cuerpo.add(boton('Limpiar dibujo', function() { while (dt.layers().length() > 0) { dt.layers().remove(dt.layers().get(0)); } }, '#555'));
  cuerpo.add(lblArea);
  cuerpo.add(nota('Tope interactivo: ' + CFG.maxAreaHa + ' ha. Coordenadas de sitios aproximadas a nivel de localidad.'));
}
function vistaCobertura() { cuerpo.add(h2('② Cobertura de bosque')); cuerpo.add(nota('Bosque 2000 (dosel ≥ ' + CFG.umbralBosque + ' %) y pérdida anual 2001–2023 con Hansen GFC.')); cuerpo.add(boton('Calcular cobertura', moduloCobertura)); }
function vistaBiomasa() { cuerpo.add(h2('③ Biomasa aérea')); cuerpo.add(nota('Media de GEDI L4B (grilla 1 km) y carbono aéreo estimado.')); cuerpo.add(boton('Calcular biomasa', moduloBiomasa)); }
function vistaFeno() { cuerpo.add(h2('④ Fenología')); cuerpo.add(nota('Periodo (AAAA-MM-DD):')); cuerpo.add(fechasFeno.panel); cuerpo.add(boton('Generar series', moduloFenologia)); }
function vistaAlertas() { cuerpo.add(h2('⑤ Alertas de pérdida')); cuerpo.add(nota('Alertas RADD (Sentinel-1, 10 m) desde 2019, con prioridad de atención.')); cuerpo.add(boton('Calcular alertas', moduloAlertas)); }
function vistaHidro() { cuerpo.add(h2('⑥ Inundación bajo dosel')); cuerpo.add(nota('Año de análisis:')); cuerpo.add(sldAnio); cuerpo.add(boton('Calcular hidroperíodo', moduloHidro)); }
function vistaFicha() { cuerpo.add(h2('⑦ Ficha')); cuerpo.add(nota('Resumen de los módulos calculados y descargas (CSV, GeoJSON, KML, SHP).')); cuerpo.add(boton('Generar ficha', moduloFicha)); }

panelIzq.add(cabeceraGiteca());
panelIzq.add(lineaAutor());
panelIzq.add(fila(botonesTab));
panelIzq.add(cuerpo);
panelIzq.add(pieLegal());
activar(0);
