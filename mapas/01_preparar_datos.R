# =============================================================================
# © 2026 Gino Machoa. Todos los derechos reservados.
# Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
# Contacto: gitecaconsulting@gmail.com
# Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.
# GITECA | Mapas 01 — Descarga y preparación de datos abiertos oficiales
# Fuentes: Geoservicios SERFOR (ArcGIS REST, uso público), NASA FIRMS (VIIRS S-NPP), GBIF.
# Se excluyen campos con datos personales (titulares, RUC, DNI): solo se publican atributos técnicos.
# =============================================================================
library(sf); library(dplyr); library(jsonlite); library(readr)
sf_use_s2(FALSE)
# Lectura JSON con reintentos (servicios públicos con cortes intermitentes)
leer_json <- function(u, n = 6) { for (i in seq_len(n)) { r <- tryCatch(fromJSON(u), error = function(e) NULL); if (!is.null(r)) return(r); Sys.sleep(3) }; stop("No se pudo leer: ", u) }
dir.create("mapas/datos", showWarnings = FALSE, recursive = TRUE)
B <- "https://geo.serfor.gob.pe/geoservicios/rest/services/"

# Descarga paginada de una capa ArcGIS REST como sf
arcgis_sf <- function(svc, lid, campos, offset = NULL, paso = 1000) {
  out <- list(); o <- 0
  repeat {
    q <- list(where = "1=1", outFields = campos, f = "geojson", outSR = 4326,
              resultOffset = o, resultRecordCount = paso)
    if (!is.null(offset)) q$maxAllowableOffset <- offset
    u <- paste0(B, svc, "/MapServer/", lid, "/query?",
                paste(names(q), sapply(q, function(x) URLencode(as.character(x), TRUE)), sep = "=", collapse = "&"))
    x <- st_read(u, quiet = TRUE); out[[length(out) + 1]] <- x; o <- o + nrow(x)
    if (nrow(x) < paso) break
  }
  bind_rows(out)
}

dep <- arcgis_sf("Visor/Limites_Politicos_Administrativos", 0, "IDDPTO,NOMBDEP", 0.01) |> st_make_valid()
tipos <- c(`80201` = "Conservación", `80202` = "Ecoturismo", `80203` = "Productos diferentes a la madera",
           `80204` = "Fines maderables", `80205` = "Plantaciones forestales",
           `80206` = "Forestación y/o reforestación", `80209` = "Manejo de fauna silvestre")
conc <- arcgis_sf("Visor/Modalidad_Acceso", 0, "TIPCON,NOMDEP,SUPSIG", 0.002) |>
  mutate(tipo = unname(tipos[as.character(TIPCON)]))
bpp  <- arcgis_sf("Visor/Ordenamiento_Forestal", 1, "ZONA,NOMDEP,SUPSIG", 0.005)
pc   <- arcgis_sf("Visor/Monitoreo_Control", 1, "NOMBPC,NOMDEP,NOMPRO")
inc  <- arcgis_sf("Visor/Incendios_Forestales", 1, "NOMDEP,NOMPRO,NOMDIS,FECHA,TIPCOB,SENSAT")

# Deforestación (UFMS-SERFOR): atributos + coordenadas UTM de cada polígono
drivers <- c("Minería", "Agricultura", "Caminos", "Invasiones", "Infraestructura", "Ganadería",
             "Cultivos ilícitos", "Otros", "Tráfico ilícito de drogas")
deps <- setNames(dep$NOMBDEP, dep$IDDPTO)
def_raw <- lapply(seq(0, 40000, 5000), function(o) {
  u <- paste0(B, "Visor/Monitoreo_Deforestacion_Tala/MapServer/1/query?where=1%3D1&outFields=FESATB,SUPAFEC,DRIVER,NOMDEP,COORES,COORNO,ZONUTM&returnGeometry=false&orderByFields=OBJECTID&resultRecordCount=5000&f=json&resultOffset=", o)
  leer_json(u)$features$attributes
}) |> bind_rows()
def <- def_raw |> filter(!is.na(COORES), ZONUTM %in% 17:19) |>
  group_split(ZONUTM) |>
  lapply(function(d) st_as_sf(d, coords = c("COORES", "COORNO"), crs = 32700 + d$ZONUTM[1]) |> st_transform(4326)) |>
  bind_rows() |>
  mutate(anio = as.integer(format(as.POSIXct(FESATB / 1000, origin = "1970-01-01"), "%Y")),
         causa = drivers[DRIVER], departamento = unname(deps[NOMDEP]), ha = SUPAFEC) |>
  select(anio, causa, departamento, ha)

# Focos de calor VIIRS (últimos 7 días) dentro del Perú
firms <- read_csv("https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_South_America_7d.csv",
                  show_col_types = FALSE) |>
  st_as_sf(coords = c("longitude", "latitude"), crs = 4326, remove = FALSE)
firms <- firms[st_union(st_buffer(dep, 0)), ] |> select(acq_date, confidence, frp)

# Especies maderables CITES en GBIF (registros con coordenadas en el Perú)
esp <- c("Swietenia macrophylla", "Cedrela odorata", "Cedrela fissilis", "Dipteryx micrantha",
         "Handroanthus serratifolius", "Amburana cearensis")
gbif <- lapply(esp, function(s) {
  k <- leer_json(paste0("https://api.gbif.org/v1/species/match?name=", URLencode(s)))$usageKey
  res <- list(); o <- 0
  repeat {
    r <- leer_json(sprintf("https://api.gbif.org/v1/occurrence/search?taxonKey=%s&country=PE&hasCoordinate=true&hasGeospatialIssue=false&limit=300&offset=%d", k, o))
    if (length(r$results)) res[[length(res) + 1]] <- tibble(especie = s, lon = r$results$decimalLongitude,
      lat = r$results$decimalLatitude, anio = r$results$year, gbif = r$results$key)
    o <- o + 300; if (isTRUE(r$endOfRecords) || o >= 3000) break
  }
  bind_rows(res)
}) |> bind_rows() |> st_as_sf(coords = c("lon", "lat"), crs = 4326)

for (n in c("dep", "conc", "bpp", "pc", "inc", "def", "firms", "gbif"))
  st_write(get(n), sprintf("mapas/datos/%s.gpkg", n), delete_dsn = TRUE, quiet = TRUE)
