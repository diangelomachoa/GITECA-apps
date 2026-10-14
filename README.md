# GITECA · Apps para la investigación forestal en la Amazonía peruana

**GITECA — Gestión de Información, Tecnología y Ciencias Ambientales**  
© 2026 Gino Machoa. Todos los derechos reservados. Autor y desarrollador: Gino Machoa · Ing. en Ecología de Bosques Tropicales (UNAP, Iquitos) · gitecaconsulting@gmail.com

Herramientas abiertas en R/Shiny y Google Earth Engine construidas sobre la producción
científica de la Facultad de Ciencias Forestales de la Universidad Nacional de la Amazonía
Peruana (UNAP).

## Bloque 1 — Apps en R (listas)

| # | App | Qué hace |
|---|-----|----------|
| 01 | `apps/01_explorador_tesis` | Buscador y bibliometría de 1 063 tesis (1984–2026): temas, tendencias, términos, red asesor–tesista, descarga |
| 02 | `apps/02_calculadora_inventarios` | N/ha, G/ha, volumen, IVI, Shannon/Simpson, curva de acumulación, biomasa (Chave et al. 2014) |
| 03 | `apps/03_planificador_muestreo` | Tamaño de muestra y error de muestreo a partir de un inventario piloto o de un CV |
| 04 | `apps/04_vacios_investigacion` | Mapa de tesis por localidad y matriz localidad × tema para detectar vacíos |

## Apps Shiny en línea

Corren en el navegador con webR/Shinylive (sin servidor; la primera carga tarda 1–2 min). Versión web de un solo archivo en `web_shinylive/`.

| App | Enlace |
|---|---|
| Explorador de tesis | https://diangelomachoa.github.io/GITECA-apps/apps/explorador.html |
| Calculadora de inventarios | https://diangelomachoa.github.io/GITECA-apps/apps/inventarios.html |
| Planificador de muestreo | https://diangelomachoa.github.io/GITECA-apps/apps/muestreo.html |
| Vacíos de investigación | https://diangelomachoa.github.io/GITECA-apps/apps/vacios.html |
| Biblioteca de coeficientes de madera | https://diangelomachoa.github.io/GITECA-apps/apps/coeficientes.html |

## Bloque 2 — Scripts de Google Earth Engine (`gee/`)

**Apps publicadas (abrir en el navegador):**

| App | Enlace |
|---|---|
| Visor de tesis y cobertura | https://gitecapps-511217.projects.earthengine.app/view/giteca---visor-de-tesis-fcf-unap-y-perdida-de-bosque |
| Monitor de biomasa GEDI | https://gitecapps-511217.projects.earthengine.app/view/giteca---monitor-de-biomasa-gedi |
| Fenología de aguajales | https://gitecapps-511217.projects.earthengine.app/view/giteca---fenologia-de-aguajales |
| Alertas de deforestación | https://gitecapps-511217.projects.earthengine.app/view/giteca---alertas-de-deforestacion-y-degradacion |
| Hidroperíodo | https://gitecapps-511217.projects.earthengine.app/view/giteca---hidroperiodo-de-bosques-inundables |
| RÍO VIVO · Amazonía peruana | https://gitecapps-511217.projects.earthengine.app/view/giteca---riovivo |

**App principal:** `gee/GITECA_monitor_amazonia.js` integra los 5 análisis en una sola interfaz con pestañas, ficha y descargas.

Copie cada script en el Code Editor (code.earthengine.google.com) y ejecútelo.

| # | Script | Datos | Qué hace |
|---|--------|-------|----------|
| 01 | `01_visor_tesis_cobertura.js` | Sitios de tesis + Hansen GFC v1.11 | % de bosque perdido en un radio de 5 km de cada sitio después del primer año de estudio |
| 02 | `02_biomasa_gedi.js` | GEDI L4B v2.1 | Biomasa por provincia de Loreto; si subes tus parcelas como asset, calcula RMSE y sesgo de campo vs GEDI |
| 03 | `03_fenologia_aguajales.js` | MODIS MOD13Q1, Sentinel-2 + Cloud Score+ | Series EVI/NDVI y perfil mensual de un polígono |
| 04 | `04_alertas_degradacion.js` | Alertas RADD, Sentinel-1 | Hectáreas alertadas por unidad de manejo y año; ΔVH como indicador de degradación |
| 05 | `05_hidroperiodo.js` | JRC GSW v1.4, Sentinel-1 | Meses con inundación bajo el dosel (várzea/igapó) |
| 07 | `07_rio_vivo.js` (RÍO VIVO · Amazonía peruana) | Landsat, Sentinel-2, JRC GSW, GHSL P2023A, Dynamic World, Hansen | Erosión y sedimentación de cauces, retroceso de orillas con transectos tipo DSAS, playas en aguas bajas y ocupación a lo largo de carreteras. Guía: `GUIA_RIO_VIVO.md` |

Las áreas de ejemplo son rectángulos referenciales: cámbielos por su área de estudio. El umbral de inundación del script 05 debe calibrarse con datos de campo.

## Bloque 3 — Biblioteca de coeficientes de madera

`apps/05_coeficientes_madera` y `data/coeficientes_madera.csv`: 111 valores de 43 especies (densidad básica, contracciones, relación T/R, MOE, MOR) extraídos de los PDF de 23 tesis FCF-UNAP y **curados manualmente**. Cada registro indica si es *resultado de la tesis* o *referencia citada en la tesis* e incluye el enlace a la tesis. `data/densidad_por_especie.csv` resume la mediana por especie; la Calculadora de inventarios la usa para completar la densidad cuando falta en el CSV.

Limitaciones: cobertura parcial (muchas tesis tienen sus resultados en tablas o imágenes que no se leen automáticamente) y aún no hay CV de inventarios extraídos para el Planificador de muestreo.

## Bloque 4 — Mapas con datos abiertos (`mapas/`)

| Script | Qué hace |
|---|---|
| `01_preparar_datos.R` | Descarga capas oficiales: geoservicios SERFOR (límites INEI, concesiones, BPP, deforestación UFMS, incendios, puestos de control), NASA FIRMS VIIRS (7 días) y GBIF (especies maderables CITES). No guarda datos personales de titulares. |
| `02_mapas_estaticos.R` | 5 láminas en ggplot2 + ggspatial → `docs/mapas/img/` |
| `03_datos_visor.R` | Capas livianas (GeoJSON/CSV) para el visor web `docs/mapas/visor_forestal.html` (Leaflet) |
| `04_tablas_looker.R` | Tablas agregadas para el reporte estadístico en Looker Studio (`mapas/looker/`) |

Visor: https://diangelomachoa.github.io/GITECA-apps/mapas/visor_forestal.html

## Uso

```r
install.packages(c("shiny","bslib","dplyr","tidyr","stringr","ggplot2","DT",
                   "visNetwork","leaflet","readr","scales","sf"))
shiny::runApp("apps/01_explorador_tesis")
```

Despliegue en shinyapps.io: copie `data/`, `R/` y `recursos/` dentro de la carpeta de la app (cada app los busca primero en su propia carpeta) y use `rsconnect::deployApp()`.

## Datos y fuentes

- `data/tesis_fcf_unap.csv`: metadatos públicos (Dublin Core) del **Repositorio Institucional de la UNAP**
  (https://repositorio.unapiquitos.edu.pe), comunidad Facultad de Ciencias Forestales, descargados el 10/10/2026
  con `scripts/01_descargar_tesis_unap.R`. Los derechos de cada tesis pertenecen a sus autores (en su mayoría CC BY-NC-ND);
  aquí solo se redistribuyen metadatos, con enlace al handle original.
- `tema_principal` y `temas_todos`: **clasificación automática por palabras clave** hecha por GITECA. Puede tener errores; revísela antes de citarla.
- `data/tesis_localidades.csv` / `gazetteer_loreto.csv`: localidades detectadas en título/resumen, con **coordenadas aproximadas** (a nivel de localidad).
- `data/ejemplo_inventario.csv`: **datos sintéticos**, solo para probar las apps 02 y 03.

## Licencias de datos

| Fuente | Licencia | Dónde se usa |
|---|---|---|
| Metadatos de tesis — Repositorio Institucional UNAP | Metadatos públicos; cada tesis conserva la licencia de su autor (mayormente CC BY-NC-ND) | Apps 01 y 04, GEE 01 |
| Hansen et al. (2013) Global Forest Change v1.11 | CC BY 4.0 | GEE 01 |
| GEDI L4B v2.1 (NASA / ORNL DAAC) | Datos abiertos NASA, cita requerida | GEE 02 |
| MODIS MOD13Q1 v6.1 (NASA) | Datos abiertos NASA, cita requerida | GEE 03 |
| Copernicus Sentinel-1 y Sentinel-2 | Contiene datos modificados de Copernicus Sentinel | GEE 03, 04, 05 |
| Cloud Score+ (Google) | CC BY 4.0 | GEE 03 |
| Alertas RADD (Wageningen University) | CC BY 4.0 | GEE 04 |
| JRC Global Surface Water v1.4 | Uso libre con atribución (Source: EC JRC/Google) | GEE 05 y 07 |
| Landsat 5, 7, 8 y 9 (USGS) | Dominio público | GEE 07 |
| GHSL P2023A (JRC) | CC BY 4.0 | GEE 07 |
| Dynamic World (Google / WRI) | CC BY 4.0 | GEE 07 |
| FAO GAUL 2015 | Uso no comercial con atribución | GEE 02 |
| Esri World Imagery; CARTO / OpenStreetMap | Términos de Esri; © OpenStreetMap contributors (ODbL), © CARTO | App 04 (mapas base) |
| Geoservicios SERFOR (geo.serfor.gob.pe) | Información pública del Estado, cita de la fuente | Mapas y visor |
| NASA FIRMS (VIIRS S-NPP) | Datos abiertos NASA, cita requerida | Mapas y visor |
| GBIF.org | Licencia de cada registro (CC0 / CC BY / CC BY-NC) | Mapas y visor |
| Chave et al. (2014) | Publicación científica, cita obligatoria | App 02 |

## Avisos legales

Cada app incluye la línea de autoría, el pie «© … Todos los derechos reservados» y un panel de **Avisos legales** (autoría y cita, términos y condiciones, privacidad según la Ley N.° 29733, cookies y licencias de datos). En Shiny lo genera `R/legal.R`; en Earth Engine, `gee/recursos/legal_fn.js` con el bloque `LEGAL` de cada script (plantilla en `gee/recursos/legal_cfg_plantilla.js`). Para el logo en GEE ver `gee/GUIA_GEE.md`.

## Cómo citar

Machoa, G. (2026). *GITECA: apps para la investigación forestal en la Amazonía peruana* [software]. GITECA. https://github.com/diangelomachoa/GITECA-apps

## Licencia

© 2026 Gino Machoa. Todos los derechos reservados. Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor (ver `LICENSE`). Los datos de terceros conservan sus licencias.
