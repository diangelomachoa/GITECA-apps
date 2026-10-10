// =============================================================================
// GITECA | GEE 02 — Monitor de biomasa aérea: GEDI L4B vs. parcelas de campo
// GEDI L4B v2.1 (Dubayah et al.): biomasa aérea media (Mg/ha) en grilla de 1 km.
// Uso: suba sus parcelas como asset (columnas: id, agb_campo en Mg/ha, especie/tipo opcional)
// y reemplace PARCELAS_ASSET. Sin asset, el script muestra solo el mapa y estadísticas por
// provincia. La comparación sirve para validar ecuaciones alométricas usadas en las tesis.
// Carbono ≈ 0.47 × biomasa (IPCC 2006).
// =============================================================================
var PARCELAS_ASSET = ''; // ej. 'projects/mi-proyecto/assets/parcelas_loreto'

var loreto = ee.FeatureCollection('FAO/GAUL/2015/level1').filter(ee.Filter.eq('ADM1_NAME', 'Loreto'));
var prov   = ee.FeatureCollection('FAO/GAUL/2015/level2').filter(ee.Filter.eq('ADM1_NAME', 'Loreto'));
var gedi = ee.Image('LARSE/GEDI/GEDI04_B_002');
var agb = gedi.select('MU').updateMask(gedi.select('MU').gt(0)).clip(loreto);
var se  = gedi.select('SE').clip(loreto);

Map.centerObject(loreto, 6);
Map.addLayer(agb, {min: 0, max: 350, palette: ['#f7fcf5','#a1d99b','#41ab5d','#006d2c','#00441b']}, 'GEDI L4B biomasa (Mg/ha)');
Map.addLayer(se, {min: 0, max: 60, palette: ['white','purple']}, 'Error estándar', false);
Map.addLayer(ee.Image().paint(prov, 0, 1), {palette: 'white'}, 'Provincias');

// Estadísticas por provincia
var stats = agb.reduceRegions({collection: prov, reducer: ee.Reducer.mean().combine(ee.Reducer.stdDev(), '', true), scale: 1000});
print('Biomasa media por provincia (Mg/ha)', ui.Chart.feature.byFeature(stats, 'ADM2_NAME', 'mean')
  .setChartType('ColumnChart').setOptions({legend: 'none', colors: ['#1F5E3B'], vAxis: {title: 'Mg/ha'}}));
Export.table.toDrive({collection: stats.select(['ADM2_NAME', 'mean', 'stdDev']), description: 'GITECA_GEDI_biomasa_provincias', fileFormat: 'CSV'});

// Comparación con parcelas de campo
if (PARCELAS_ASSET !== '') {
  var parcelas = ee.FeatureCollection(PARCELAS_ASSET);
  var cmp = agb.rename('agb_gedi').reduceRegions({collection: parcelas, reducer: ee.Reducer.first(), scale: 1000})
    .filter(ee.Filter.notNull(['agb_gedi', 'agb_campo']));
  Map.addLayer(parcelas, {color: 'yellow'}, 'Parcelas de campo');
  print(ui.Chart.feature.byFeature(cmp, 'agb_campo', 'agb_gedi').setChartType('ScatterChart')
    .setOptions({title: 'Campo vs GEDI (Mg/ha)', hAxis: {title: 'Campo'}, vAxis: {title: 'GEDI L4B'},
                 trendlines: {0: {showR2: true, visibleInLegend: true}}, pointSize: 5, colors: ['#1C5D99']}));
  var d = cmp.map(function(f) { return f.set('dif', ee.Number(f.get('agb_gedi')).subtract(f.get('agb_campo'))); });
  var rmse = ee.Number(d.aggregate_array('dif').map(function(x){return ee.Number(x).pow(2);}).reduce(ee.Reducer.mean())).sqrt();
  print('RMSE (Mg/ha):', rmse, 'Sesgo medio (Mg/ha):', d.aggregate_mean('dif'));
  Export.table.toDrive({collection: d, description: 'GITECA_parcelas_vs_GEDI', fileFormat: 'CSV'});
}
