<!-- © 2026 Gino Machoa. Todos los derechos reservados. Autor y desarrollador: Gino Machoa · diangelomachoa@gmail.com -->
# Guía de los scripts GEE de GITECA

© 2026 Gino Machoa. Todos los derechos reservados. Autor y desarrollador: Gino Machoa (GITECA).

## Puesta en marcha
1. Abra code.earthengine.google.com y cree un script nuevo por archivo `gee/0X_*.js`.
2. Pegue el contenido completo y presione **Run**. El panel izquierdo muestra la cabecera GITECA, la autoría y el pie legal; los avisos legales se abren en el panel derecho.

## Assets que hay que subir
| Asset | Archivo | Para qué |
|---|---|---|
| Logo GITECA | `recursos/giteca_logo_gee.tif` (bandas b1,b2,b3, 0–255) | Cabecera de las apps: suba como *Image* en Assets → NEW → GeoTIFF y pegue el ID en `CFG.logo` |
| Parcelas de campo (opcional) | su shapefile/CSV con `agb_campo` | GEE 02: `PARCELAS_ASSET` |
| Unidades de manejo (opcional) | su shapefile | GEE 04: `UNIDADES_ASSET` |

Si `CFG.logo` queda vacío, la cabecera se muestra en texto ("GITECA").

## Módulos
| Script | Qué hace |
|---|---|
| 01 Tesis y cobertura | % de bosque perdido alrededor de sitios de tesis después del estudio |
| 02 Biomasa GEDI | Biomasa por provincia y validación contra parcelas |
| 03 Fenología | Series EVI/NDVI y perfil mensual |
| 04 Alertas | Hectáreas con alerta RADD por unidad y año (prioridad de atención) |
| 05 Hidroperíodo | Meses de inundación bajo dosel |

## Precisión y cuidados
- Coordenadas de sitios de tesis aproximadas a nivel de localidad.
- GEDI L4B: grilla de 1 km con error estándar propio; RADD: alertas a verificar; umbral de inundación del script 05 referencial.
- `Export.*` solo funciona en el Code Editor.
- Las apps publicadas exponen su código: no incruste claves, mosaicos Planet ni datos personales.
