// =============================================================================
// GITECA | GEE 04 — Detector de deforestación y degradación en unidades de manejo
// - Alertas RADD (Reiche et al. 2021, Wageningen Univ.) basadas en Sentinel-1, 10 m.
// - Cambio de retrodispersión Sentinel-1 VH (antes vs. después) como indicador de degradación.
// Uso: reemplace UNIDADES_ASSET por sus polígonos (concesiones, comunidades, ámbitos de
// tesis o de planes de manejo). Sin asset usa un rectángulo referencial.
// Resultado: hectáreas alertadas por unidad y por año, exportables a Drive.
// =============================================================================
var UNIDADES_ASSET = ''; // ej. 'projects/mi-proyecto/assets/unidades_manejo'
var unidades = UNIDADES_ASSET !== '' ? ee.FeatureCollection(UNIDADES_ASSET)
  : ee.FeatureCollection([ee.Feature(ee.Geometry.Rectangle([-73.9, -4.2, -73.4, -3.8]), {nombre: 'Área referencial'})]);
var CAMPO = 'nombre'; // campo identificador de las unidades

// --- RADD: Date (yyDOY: 2 primeros dígitos = año 20yy), Alert (2 = baja, 3 = alta confianza)
var radd = ee.ImageCollection('projects/radar-wur/raddalert/v1')
  .filterMetadata('layer', 'contains', 'alert').filterMetadata('geography', 'equals', 'sa').sort('system:time_end', false).first();
var conf = radd.select('Alert');
var anio = radd.select('Date').divide(1000).floor().add(2000).rename('anio');
var alertas = anio.updateMask(conf.gte(2));

Map.centerObject(unidades, 10);
Map.addLayer(alertas, {min: 2019, max: 2026, palette: ['#ffffb2', '#fd8d3c', '#bd0026']}, 'Alertas RADD (año)');
Map.addLayer(ee.Image().paint(unidades, 0, 2), {palette: '00FFFF'}, 'Unidades');

// Hectáreas alertadas por unidad y año
var area = ee.Image.pixelArea().divide(1e4).addBands(alertas.int());
var porAnio = area.reduceRegions({collection: unidades,
  reducer: ee.Reducer.sum().group({groupField: 1, groupName: 'anio'}), scale: 10, tileScale: 4});
var tabla = porAnio.map(function(f) {
  var g = ee.List(f.get('groups'));
  return ee.FeatureCollection(g.map(function(x) {
    x = ee.Dictionary(x);
    return ee.Feature(null, {unidad: f.get(CAMPO), anio: x.get('anio'), ha: x.get('sum')});
  }));
}).flatten();
print('Hectáreas con alerta por unidad y año', tabla);
print(ui.Chart.feature.groups(tabla, 'anio', 'ha', 'unidad').setChartType('ColumnChart')
  .setOptions({title: 'Alertas RADD (ha/año)', isStacked: true}));
Export.table.toDrive({collection: tabla, description: 'GITECA_alertas_RADD_unidades', fileFormat: 'CSV'});

// --- Indicador de degradación: caída de VH (dB) entre dos periodos de verano seco
function s1(ini, fin) {
  return ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(unidades).filterDate(ini, fin)
    .filter(ee.Filter.eq('instrumentMode', 'IW')).filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
    .select('VH').median();
}
var dVH = s1('2025-06-01', '2025-10-31').subtract(s1('2020-06-01', '2020-10-31')).rename('dVH');
Map.addLayer(dVH.clip(unidades.geometry().bounds()), {min: -4, max: 4, palette: ['#b2182b', '#f7f7f7', '#2166ac']},
  'ΔVH 2025−2020 (dB, rojo = posible apertura)', false);
