# Blog GITECA · Novedades GIS

Cada entrada es una página HTML propia en `docs/blog/`, así se puede compartir en LinkedIn con su título e imagen.

## Publicar una entrada

1. Copia `plantilla.html` como `<slug>.html`. El slug va en minúsculas y con guiones, por ejemplo `alphaearth-embeddings.html`.
2. Reemplaza todo lo que está entre `[corchetes]` y borra la línea `<meta name="robots" content="noindex">`.
3. Guarda la imagen de portada en `img/<slug>.jpg`, en 1200 × 675 px y menos de 200 KB.
4. Agrega la entrada al inicio de la lista `window.GITECA_BLOG` en `entradas.js`.

La sección **Blog** de la portada muestra las 3 entradas más recientes. `blog/index.html` muestra todas y permite filtrarlas por etiqueta.

## Estructura de cada entrada

- **La novedad:** qué se anunció y quién lo anunció.
- **Por qué importa para el bosque.**
- **Cómo lo aplicaríamos:** de 2 a 3 casos en control, inventarios o monitoreo.
- **Limitaciones y cuidados.**
- **Fuente:** siempre se enlaza la publicación original y se le da crédito al autor.
