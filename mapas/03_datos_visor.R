# =============================================================================
# © 2026 Gino Machoa. Todos los derechos reservados.
# Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
# Contacto: diangelomachoa@gmail.com
# Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.
# GITECA | Mapas 03 — Capas livianas para el visor web (docs/mapas/visor_forestal.html)
# Polígonos simplificados en GeoJSON y puntos en CSV compacto, para carga rápida en GitHub Pages.
# =============================================================================
library(sf); library(dplyr); library(readr)
sf_use_s2(FALSE)
lee  <- function(n) st_read(sprintf("mapas/datos/%s.gpkg", n), quiet = TRUE)
poli <- function(x) x |> st_make_valid() |> st_collection_extract("POLYGON") |> st_cast("MULTIPOLYGON")
d <- "docs/mapas/datos"; dir.create(d, showWarnings = FALSE, recursive = TRUE)
gj <- function(x, n, p = 4) { f <- file.path(d, paste0(n, ".geojson")); unlink(f)
  st_write(x, f, layer_options = c(paste0("COORDINATE_PRECISION=", p), "RFC7946=YES"), quiet = TRUE) }
pts <- function(x, n) { xy <- round(st_coordinates(x), 4)
  write_csv(bind_cols(tibble(lon = xy[, 1], lat = xy[, 2]), st_drop_geometry(x)), file.path(d, paste0(n, ".csv")), na = "") }

gj(lee("dep")  |> st_simplify(dTolerance = .01, preserveTopology = TRUE) |> poli() |> select(NOMBDEP), "departamentos", 3)
gj(lee("conc") |> st_simplify(dTolerance = .003, preserveTopology = TRUE) |> poli() |> transmute(tipo, ha = round(SUPSIG, 1)), "concesiones")
gj(lee("bpp")  |> st_simplify(dTolerance = .01, preserveTopology = TRUE) |> poli() |> transmute(dep = NOMDEP, ha = round(SUPSIG)), "bpp", 3)
pts(lee("def")   |> mutate(ha = round(ha, 2)), "deforestacion")
pts(lee("inc")   |> select(NOMDEP, NOMPRO, NOMDIS, TIPCOB), "incendios")
pts(lee("firms") |> mutate(acq_date = as.character(acq_date)), "focos_calor")
pts(lee("gbif"), "especies_cites")
pts(lee("pc")    |> select(NOMBPC, NOMDEP), "puestos_control")
writeLines(format(Sys.Date(), "%d/%m/%Y"), file.path(d, "actualizado.txt"))

# Las colecciones geométricas que deja la reducción de precisión se convierten a MultiPolygon
for (n in c("departamentos", "bpp", "concesiones")) {
  f <- file.path(d, paste0(n, ".geojson")); g <- jsonlite::read_json(f)
  g$features <- lapply(g$features, function(x) {
    if (identical(x$geometry$type, "GeometryCollection")) {
      partes <- Filter(function(h) h$type %in% c("Polygon", "MultiPolygon"), x$geometry$geometries)
      x$geometry <- list(type = "MultiPolygon", coordinates = do.call(c, lapply(partes, function(h)
        if (h$type == "Polygon") list(h$coordinates) else h$coordinates)))
    }
    x })
  jsonlite::write_json(g, f, auto_unbox = TRUE, digits = NA)
}
