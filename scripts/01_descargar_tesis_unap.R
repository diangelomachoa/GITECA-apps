# =============================================================================
# © 2026 Gino Machoa. Todos los derechos reservados.
# Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
# Contacto: gitecaconsulting@gmail.com
# Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.
# GITECA | Descarga de metadatos de tesis — Repositorio Institucional UNAP
# Fuente: https://repositorio.unapiquitos.edu.pe (DSpace 9, API REST pública)
# Comunidad: Facultad de Ciencias Forestales (423976d4-55de-4c58-a436-56380b978891)
# Solo descarga METADATOS públicos (Dublin Core). Los PDF siguen alojados en la UNAP;
# cite siempre al autor de la tesis y el handle del repositorio.
# =============================================================================
library(jsonlite); library(dplyr); library(purrr)

api   <- "https://api-repositorio.unapiquitos.edu.pe/server/api/discover/search/objects"
scope <- "423976d4-55de-4c58-a436-56380b978891"

pagina <- function(p) {
  u <- sprintf("%s?scope=%s&dsoType=ITEM&size=100&page=%d", api, scope, p)
  objs <- fromJSON(u, simplifyVector = FALSE)$`_embedded`$searchResult$`_embedded`$objects
  map_dfr(objs, \(o) {
    it <- o$`_embedded`$indexableObject; m <- it$metadata
    g <- \(k) paste(map_chr(m[[k]] %||% list(), "value"), collapse = " | ")
    tibble(uuid = it$uuid, titulo = g("dc.title"), autores = g("dc.contributor.author"),
           asesor = g("dc.contributor.advisor"), anio = substr(g("dc.date.issued"), 1, 4),
           escuela = g("thesis.degree.discipline"), grado = g("thesis.degree.name"),
           palabras_clave = g("dc.subject"), ocde = g("dc.subject.ocde"),
           resumen = g("dc.description.abstract"), url = g("dc.identifier.uri"))
  })
}

total <- fromJSON(sprintf("%s?scope=%s&dsoType=ITEM&size=1", api, scope))$`_embedded`$searchResult$page$totalElements
tesis <- map_dfr(0:(ceiling(total / 100) - 1), \(p) { Sys.sleep(1); pagina(p) })  # pausa: respeta el servidor
readr::write_csv(tesis, "data/tesis_fcf_unap_raw.csv")
message(nrow(tesis), " tesis descargadas de ", total)
