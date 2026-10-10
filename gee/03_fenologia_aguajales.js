// =============================================================================
// GITECA | GEE 03 — Fenología de aguajales y otros tipos de bosque
// Series de tiempo de EVI: MODIS MOD13Q1 v6.1 (250 m, 16 días, desde 2000) y
// NDVI Sentinel-2 SR armonizado (10 m) enmascarado con Cloud Score+ (desde 2017).
// Uso: dibuje uno o varios polígonos con la herramienta de geometría (o importe un asset)
// sobre aguajales (Mauritia flexuosa) u otros bosques. El ejemplo por defecto es un
// rectángulo referencial al sur de Iquitos: REEMPLÁCELO por su área de estudio.
// =============================================================================
var aoi = ee.Geometry.Rectangle([-73.36, -3.86, -73.32, -3.82]); // referencial
var INICIO = '2017-01-01', FIN = '2025-12-31';

// --- MODIS EVI (escala 0.0001) con máscara de calidad (SummaryQA 0–1)
var modis = ee.ImageCollection('MODIS/061/MOD13Q1').filterDate('2000-01-01', FIN)
  .map(function(i) {
    var q = i.select('SummaryQA').lte(1);
    return i.select('EVI').multiply(0.0001).updateMask(q).copyProperties(i, ['system:time_start']);
  });

// --- Sentinel-2 NDVI con Cloud Score+
var csPlus = ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED');
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED').filterBounds(aoi).filterDate(INICIO, FIN)
  .linkCollection(csPlus, ['cs'])
  .map(function(i) {
    return i.normalizedDifference(['B8', 'B4']).rename('NDVI').updateMask(i.select('cs').gte(0.6))
      .copyProperties(i, ['system:time_start']);
  });

Map.centerObject(aoi, 13);
Map.addLayer(s2.median().clip(aoi), {min: 0.4, max: 0.9, palette: ['#fff7bc', '#78c679', '#005a32']}, 'NDVI mediano S2');
Map.addLayer(aoi, {color: 'red'}, 'Área de estudio');

print(ui.Chart.image.series(modis, aoi, ee.Reducer.mean(), 250)
  .setOptions({title: 'EVI MODIS (2000–hoy)', lineWidth: 1, pointSize: 2, colors: ['#1F5E3B'], trendlines: {0: {color: 'red'}}}));
print(ui.Chart.image.series(s2, aoi, ee.Reducer.mean(), 10)
  .setOptions({title: 'NDVI Sentinel-2', lineWidth: 0, pointSize: 3, colors: ['#1C5D99']}));

// Climatología mensual (perfil fenológico promedio)
var meses = ee.List.sequence(1, 12);
var clim = ee.FeatureCollection(meses.map(function(m) {
  var v = modis.filter(ee.Filter.calendarRange(m, m, 'month')).mean()
    .reduceRegion(ee.Reducer.mean(), aoi, 250).get('EVI');
  return ee.Feature(null, {mes: m, EVI: v});
}));
print(ui.Chart.feature.byFeature(clim, 'mes', 'EVI').setChartType('ColumnChart')
  .setOptions({title: 'Perfil mensual promedio de EVI', legend: 'none', colors: ['#C9A227'], hAxis: {title: 'Mes'}}));
Export.table.toDrive({collection: clim, description: 'GITECA_fenologia_EVI_mensual', fileFormat: 'CSV'});
