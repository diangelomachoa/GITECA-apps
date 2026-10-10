# =============================================================================
# © 2026 Gino Machoa. Todos los derechos reservados.
# Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
# Contacto: diangelomachoa@gmail.com
# Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.
# GITECA | Mapas 04 — Tablas agregadas para el reporte estadístico en Looker Studio
# =============================================================================
library(sf); library(dplyr); library(readr); library(stringr)
sf_use_s2(FALSE)
lee <- function(n) st_read(sprintf("mapas/datos/%s.gpkg", n), quiet = TRUE) |> st_drop_geometry()
tit <- function(x) str_to_title(str_squish(x))
codep <- setNames(lee("dep")$NOMBDEP, lee("dep")$IDDPTO)
def <- lee("def") |> filter(!is.na(anio)) |>
  group_by(anio, departamento = tit(departamento), causa = coalesce(causa, "Sin dato")) |>
  summarise(poligonos = n(), hectareas = round(sum(ha, na.rm = TRUE), 2), .groups = "drop")
conc <- lee("conc") |> group_by(departamento = tit(codep[NOMDEP]), modalidad = tipo) |>
  summarise(concesiones = n(), hectareas = round(sum(SUPSIG, na.rm = TRUE), 1), .groups = "drop")
inc <- lee("inc") |> count(departamento = tit(NOMDEP), provincia = tit(NOMPRO), cobertura = tit(TIPCOB), name = "incendios")
write_csv(def, "mapas/looker/deforestacion.csv"); write_csv(conc, "mapas/looker/concesiones.csv"); write_csv(inc, "mapas/looker/incendios.csv")
