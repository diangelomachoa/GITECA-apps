# GITECA · Apps para la investigación forestal en la Amazonía peruana

**GITECA — Gestión de Información, Tecnología y Ciencias Ambientales**  
Autor: Gino Di Angelo Machoa Flores · diangelomachoa@gmail.com

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

## Bloque 2 — Scripts de Google Earth Engine (`gee/`)

Copie cada script en el Code Editor (code.earthengine.google.com) y ejecútelo.

| # | Script | Datos | Qué hace |
|---|--------|-------|----------|
| 01 | `01_visor_tesis_cobertura.js` | Sitios de tesis + Hansen GFC v1.11 | % de bosque perdido en un radio de 5 km de cada sitio después del primer año de estudio |
| 02 | `02_biomasa_gedi.js` | GEDI L4B v2.1 | Biomasa por provincia de Loreto; si subes tus parcelas como asset, calcula RMSE y sesgo de campo vs GEDI |
| 03 | `03_fenologia_aguajales.js` | MODIS MOD13Q1, Sentinel-2 + Cloud Score+ | Series EVI/NDVI y perfil mensual de un polígono |
| 04 | `04_alertas_degradacion.js` | Alertas RADD, Sentinel-1 | Hectáreas alertadas por unidad de manejo y año; ΔVH como indicador de degradación |
| 05 | `05_hidroperiodo.js` | JRC GSW v1.4, Sentinel-1 | Meses con inundación bajo el dosel (várzea/igapó) |

Las áreas de ejemplo son rectángulos referenciales: cámbielos por su área de estudio. El umbral de inundación del script 05 debe calibrarse con datos de campo.

Próximo bloque: **3** — biblioteca de coeficientes de madera extraídos de las tesis.

## Uso

```r
install.packages(c("shiny","bslib","dplyr","tidyr","stringr","ggplot2","DT",
                   "visNetwork","leaflet","readr","scales","sf"))
shiny::runApp("apps/01_explorador_tesis")
```

Despliegue en shinyapps.io: copie `data/` y `R/` dentro de la carpeta de la app (cada app los busca primero en su propia carpeta) y use `rsconnect::deployApp()`.

## Datos y fuentes

- `data/tesis_fcf_unap.csv`: metadatos públicos (Dublin Core) del **Repositorio Institucional de la UNAP**
  (https://repositorio.unapiquitos.edu.pe), comunidad Facultad de Ciencias Forestales, descargados el 10/10/2026
  con `scripts/01_descargar_tesis_unap.R`. Los derechos de cada tesis pertenecen a sus autores (en su mayoría CC BY-NC-ND);
  aquí solo se redistribuyen metadatos, con enlace al handle original.
- `tema_principal` y `temas_todos`: **clasificación automática por palabras clave** hecha por GITECA. Puede tener errores; revísela antes de citarla.
- `data/tesis_localidades.csv` / `gazetteer_loreto.csv`: localidades detectadas en título/resumen, con **coordenadas aproximadas** (a nivel de localidad).
- `data/ejemplo_inventario.csv`: **datos sintéticos**, solo para probar las apps 02 y 03.

## Cómo citar

Machoa Flores, G. D. A. (2026). *GITECA: apps para la investigación forestal en la Amazonía peruana* [software]. GitHub.

## Licencia

Código: MIT. Metadatos de tesis: según las licencias de origen del Repositorio UNAP.
