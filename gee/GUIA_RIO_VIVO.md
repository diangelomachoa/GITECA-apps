# RÍO VIVO · Amazonía peruana — Guía de uso

© 2026 Gino Machoa · GITECA. Todos los derechos reservados. Contacto: gitecaconsulting@gmail.com · Versión 1.1 (14-oct-2026)

App de Google Earth Engine para medir la dinámica de los ríos amazónicos y la ocupación del territorio con imágenes de 1985 a hoy. Lleva a la Amazonía el método de las líneas de costa (orillas por fecha, transectos al estilo DSAS y tasas de cambio), donde los ríos Ucayali, Marañón, Amazonas y Huallaga migran decenas o cientos de metros al año.

**Uso:** pegue `RIO_VIVO_AMAZONIA_app.js` (en el repositorio, `gee/07_rio_vivo.js`) en https://code.earthengine.google.com y pulse **Run**.
- Para compartirla: **Apps → New App**.
- Si ya la publicó: **Apps → Manage Apps → lápiz → Update**. Así conserva el mismo enlace.

**Assets:** el logo GITECA en `projects/gitecapps-511217/assets/giteca_logo_gee`, con las bandas b1, b2 y b3. Si `CFG.logo` queda vacío, la cabecera muestra «GITECA» en texto.

## Novedades de la versión 1.1
- **⑤ Carreteras:** se corrigió el error «Projection: The CRS of a map projection could not be parsed» en Población y Superficie construida. GHSL ahora se suma en su propia grilla de 100 m (proyección Mollweide leída de la colección) y no con el código `ESRI:54009` escrito como texto.
- **Interfaz con la identidad GITECA:**
  - El logo y el nombre de la app comparten la cabecera.
  - Franja verde y azul del logo.
  - Pestaña activa en azul.
  - Fondo verde muy claro en ambos paneles, para que no queden zonas blancas.
- **Correo de contacto:** gitecaconsulting@gmail.com.

## Pestañas

| Pestaña | Qué hace |
|---|---|
| ① Zona | Lugares de referencia (Tiruntán, Genaro Herrera, Requena, Contamana, Orellana, Nauta, Iquitos, Pebas, Caballococha, San Lorenzo, Yurimaguas, Pucallpa) o un rectángulo dibujado. Periodo, época hidrológica (aguas bajas, aguas altas o todo el año) y fuente: Landsat (30 m, 1985–hoy), Sentinel-2 (10 m, 2019–hoy) o JRC (1985–2021). |
| ② Cauce | Agua de cada año (MNDWI), comparación de dos periodos: **erosión** (tierra → agua) y **sedimentación** (agua → tierra, es decir playas, islas y meandros abandonados), en hectáreas y ha/año. Frecuencia de agua, mapas del **año de erosión** y del año de sedimentación (muestran el avance de los meandros año por año), superficie de agua por año y timelapse en GIF. |
| ③ Orillas | Transectos perpendiculares a una línea base dibujada en tierra firme. Para cada año mide la distancia hasta la orilla y calcula **LRR** (regresión lineal, como DSAS), **EPR** y **NSM**. Con Dynamic World estima la distancia hasta las construcciones y los **años hasta que la erosión las alcance** (riesgo de desbarrancamiento). Descarga en CSV, KML y SHP. |
| ④ Playas | Arena expuesta dentro del corredor del río en aguas bajas: superficie por año y polígonos del último año. |
| ⑤ Carreteras | Franjas de distancia a un eje vial (1, 2, 5 y 10 km, editables): población GHSL de 1975 a 2025, superficie construida, pérdida de bosque por año (Hansen) y, de forma opcional, construcción anual con Dynamic World (2016–hoy). Incluye un eje aproximado de Iquitos–Nauta; para otras vías, dibuje el eje. |

## Cómo medir el desbarrancamiento de un pueblo (p. ej. Tiruntán)

1. ① Zona: elija **Tiruntán**, con un radio de 4–6 km, **Aguas bajas** y Landsat de 1990 a hoy (o Sentinel-2 para más detalle desde 2019).
2. ② Cauce → **Frecuencia de agua y año de erosión**, para ver por dónde avanza el río.
3. ③ Orillas: dibuje con la herramienta de línea una **línea base detrás del pueblo**, paralela a la orilla, a unos 300–800 m del río.
4. **Vista previa**: los transectos deben cruzar el pueblo y llegar al río. Si apuntan hacia tierra, cambie el lado del río.
5. **Medir retroceso**: obtendrá la tasa (m/año) por transecto, el gráfico de la orilla año por año y, si hay construcciones, el tiempo estimado hasta alcanzarlas.

En Genaro Herrera, ② Cauce con dos periodos (p. ej. 1990 frente a hoy) muestra el cambio de cauce y cuánta superficie quedó como sedimentación frente al pueblo.

## Precisión y cuidados

- **Compare la misma época hidrológica.** En Loreto el río sube y baja de 8 a 12 m al año; mezclar aguas altas con aguas bajas produce "erosiones" falsas.
- **Landsat mide 30 m por píxel.** Tasas menores a unos 2 m/año en periodos cortos están dentro del error. Sentinel-2 (10 m) es más preciso, pero solo desde 2019.
- **Landsat 7 (2003–2012)** tiene franjas sin datos. La mediana de varias escenas las rellena en parte; los años con pocas imágenes se ven como huecos.
- **El tiempo hasta las construcciones** es una extrapolación lineal: una creciente extraordinaria o un corte de meandro pueden acelerar o detener el proceso. Es un indicador para priorizar, no un pronóstico.
- **GHSL** estima población en celdas de 100 m a partir de censos y superficie construida: úselo para tendencias, no como conteo exacto.
- **Coordenadas:** las de los lugares de referencia y el eje Iquitos–Nauta son **aproximadas**. Verifíquelas en el mapa o dibuje la geometría exacta.
