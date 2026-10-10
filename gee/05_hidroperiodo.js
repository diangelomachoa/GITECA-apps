// =============================================================================
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
