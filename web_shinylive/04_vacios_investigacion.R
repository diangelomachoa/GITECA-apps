# =============================================================================
# © 2026 Gino Machoa. Todos los derechos reservados.
# Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
# Contacto: gitecaconsulting@gmail.com
# Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.
# GITECA | App 04 — Detector de vacíos de investigación
# Ubica las tesis FCF-UNAP por las localidades citadas en título/resumen (gazetteer
# aproximado, data/gazetteer_loreto.csv) y muestra dónde y en qué temas hay poca
# investigación. Capa opcional: suba un shapefile/GeoPackage de ecosistemas (MINAM) o
# de unidades de manejo para cruzar con los puntos.
# Nota: coordenadas aproximadas a nivel de localidad; no usar para análisis a escala fina.
# =============================================================================
library(shiny); library(bslib); library(dplyr); library(ggplot2); library(leaflet); library(DT)

# --- Datos: se descargan del repositorio GITECA-apps (versión web, webR/shinylive) ---
gh_csv <- function(f) { tmp <- tempfile(fileext = ".csv"); download.file(paste0("https://raw.githubusercontent.com/diangelomachoa/GITECA-apps/main/data/", f), tmp, quiet = TRUE); readr::read_csv(tmp, show_col_types = FALSE) }

tesis <- gh_csv("tesis_fcf_unap.csv")
loc   <- gh_csv("tesis_localidades.csv") |>
  left_join(select(tesis, uuid, titulo, anio, tema_principal, escuela, url), by = "uuid")
temas <- sort(unique(tesis$tema_principal))

# ---- R/legal.R (incluido) ----
# =============================================================================
# © 2026 Gino Machoa. Todos los derechos reservados.
# Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
# Contacto: gitecaconsulting@gmail.com
# Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.
# =============================================================================
# Módulo legal y de marca para las apps Shiny de GITECA:
#   giteca_logo()        logo para la barra de título
#   giteca_autor()       línea de autoría (bajo la cabecera)
#   giteca_pie(fuentes)  pie legal con enlace a "Avisos legales"
#   giteca_legal_server(input, cfg)  abre el modal con Autoría, Términos,
#                        Privacidad, Cookies y Licencias de datos
# Uso: definir LEGAL <- list(nombre, version, finalidad, avisoResultados,
#      privacidadExtra, fuentes = data.frame(fuente, licencia, uso))
# =============================================================================


GITECA <- list(
  autor  = "Gino Machoa",
  perfil = "Ing. en Ecología de Bosques Tropicales · Universidad Nacional de la Amazonía Peruana (UNAP), Iquitos",
  correo = "gitecaconsulting@gmail.com",
  marca  = "GITECA · Gestión de Información, Tecnología y Ciencias Ambientales",
  web    = "https://diangelomachoa.github.io/GITECA-apps/",
  anio   = format(Sys.Date(), "%Y")
)

giteca_logo <- function(titulo) {
  shiny::tags$span(style = "display:inline-flex;align-items:center;gap:10px",
    shiny::tags$img(src = "https://raw.githubusercontent.com/diangelomachoa/GITECA-apps/main/recursos/giteca_logo_256.png", height = "38px", alt = "Logo GITECA",
                    style = "border-radius:6px"),
    titulo)
}

giteca_autor <- function() {
  shiny::tags$div(class = "small text-muted", style = "margin:-4px 0 8px",
    sprintf("Autor y desarrollador: %s · %s", GITECA$autor, GITECA$correo))
}

giteca_pie <- function() {
  shiny::tags$div(class = "small text-muted", style = "border-top:1px solid #ddd;padding-top:8px;margin-top:8px",
    sprintf("© %s %s. Todos los derechos reservados. ", GITECA$anio, GITECA$autor),
    shiny::actionLink("giteca_legal", "Avisos legales"))
}

.giteca_tabla <- function(df) {
  shiny::tags$table(class = "table table-sm",
    shiny::tags$thead(shiny::tags$tr(lapply(c("Fuente", "Licencia", "Uso en la app"), shiny::tags$th))),
    shiny::tags$tbody(lapply(seq_len(nrow(df)), function(i)
      shiny::tags$tr(shiny::tags$td(df$fuente[i]), shiny::tags$td(df$licencia[i]), shiny::tags$td(df$uso[i])))))
}

giteca_legal_server <- function(input, cfg) {
  shiny::observeEvent(input$giteca_legal, {
    p <- shiny::tags$p
    shiny::showModal(shiny::modalDialog(size = "l", easyClose = TRUE, footer = shiny::modalButton("Cerrar"),
      title = paste("Avisos legales ·", cfg$nombre, cfg$version),
      bslib::navset_tab(
        bslib::nav_panel("Autoría",
          p(sprintf("© %s %s. Todos los derechos reservados. Autor y desarrollador: %s.", GITECA$anio, GITECA$autor, GITECA$autor)),
          p(GITECA$perfil), p(GITECA$marca),
          p("Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor."),
          p(shiny::tags$b("Cita sugerida: "), sprintf("%s (%s). %s, versión %s [aplicación web]. GITECA. %s",
            GITECA$autor, GITECA$anio, cfg$nombre, cfg$version, GITECA$web))),
        bslib::nav_panel("Términos",
          p(shiny::tags$b("Objeto. "), cfg$finalidad),
          p(shiny::tags$b("Uso permitido. "), "Consulta y análisis con fines académicos, de investigación o de gestión. No se permite copiar, modificar ni redistribuir la aplicación o su código sin autorización escrita del autor."),
          p(shiny::tags$b("Naturaleza de los resultados. "), cfg$avisoResultados,
            " Los resultados se entregan «tal cual», con fines referenciales; no constituyen prueba ni pronunciamiento oficial."),
          p(shiny::tags$b("Responsabilidad. "), "El autor no responde por decisiones tomadas con base en los resultados sin la verificación técnica correspondiente."),
          p(shiny::tags$b("Terceros. "), "Los datos y servicios de terceros (repositorios, mapas base, alojamiento) se rigen por sus propios términos."),
          p(shiny::tags$b("Ley aplicable. "), "Legislación peruana, incluido el Decreto Legislativo N.° 822, Ley sobre el Derecho de Autor.")),
        bslib::nav_panel("Privacidad",
          p("La aplicación no recoge datos personales ni guarda los archivos que el usuario carga: se procesan en la sesión y se descartan al cerrarla."),
          if (nzchar(cfg$privacidadExtra %||% "")) p(cfg$privacidadExtra),
          p("El servicio de alojamiento puede registrar datos técnicos (dirección IP, navegador) según su propia política."),
          p("Tratamiento conforme a la Ley N.° 29733, Ley de Protección de Datos Personales. Consultas: ", GITECA$correo)),
        bslib::nav_panel("Cookies",
          p("La aplicación no instala cookies propias. El servicio de alojamiento (por ejemplo, shinyapps.io) y los proveedores de mapas base pueden usar cookies técnicas necesarias para el funcionamiento, según sus políticas.")),
        bslib::nav_panel("Licencias de datos", .giteca_tabla(cfg$fuentes))
      )))
  })
}

`%||%` <- function(a, b) if (is.null(a)) b else a

LEGAL <- list(nombre = "Vacíos de investigación forestal en Loreto", version = "1.0",
  finalidad = "Ubicar las tesis por localidad y detectar zonas y temas poco estudiados.",
  avisoResultados = "Las coordenadas son aproximadas a nivel de localidad y la clasificación temática es automática.",
  privacidadExtra = "",
  fuentes = data.frame(matrix(c(
  "Metadatos de tesis — Repositorio Institucional UNAP", "Metadatos públicos; cada tesis conserva la licencia de su autor (mayormente CC BY-NC-ND)", "Base de tesis, títulos, resúmenes y enlaces",
  "Esri World Imagery", "Términos de uso de Esri (atribución obligatoria)", "Mapa base satelital",
  "CARTO / OpenStreetMap", "© OpenStreetMap contributors (ODbL), © CARTO", "Mapa base"), ncol = 3, byrow = TRUE, dimnames = list(NULL, c("fuente", "licencia", "uso")))))

ui <- page_sidebar(
  title = giteca_logo("Vacíos de investigación forestal en Loreto"),
  theme = bs_theme(version = 5, primary = "#1F5E3B", secondary = "#1C5D99"),
  sidebar = sidebar(width = 320,
    giteca_autor(),
    selectizeInput("tema", "Tema", temas, multiple = TRUE, options = list(placeholder = "Todos")),
    sliderInput("anio", "Año", min(tesis$anio, na.rm = TRUE), max(tesis$anio, na.rm = TRUE),
                range(tesis$anio, na.rm = TRUE), sep = ""),
    checkboxInput("excl_gen", "Excluir menciones genéricas (Maynas, Iquitos)", TRUE),
    fileInput("capa", "Capa opcional (.gpkg o .geojson)", accept = c(".gpkg", ".geojson")),
    helpText(sprintf("%d de %d tesis tienen al menos una localidad identificada.",
                     n_distinct(loc$uuid), nrow(tesis))), giteca_pie()
  ),
  layout_columns(col_widths = c(12, 12),
    card(card_header("Tesis por localidad (tamaño = n° de tesis)"), leafletOutput("mapa", height = 560)),
    card(card_header("Matriz localidad × tema (menos = vacío)"), plotOutput("matriz", height = 620))),
  card(card_header("Localidades con menos investigación en el tema seleccionado"), DTOutput("vacios"))
)

server <- function(input, output, session) {
  giteca_legal_server(input, LEGAL)
  sel <- reactive({
    d <- loc |> filter(between(anio, input$anio[1], input$anio[2]))
    if (input$excl_gen) d <- filter(d, !localidad %in% c("Maynas", "Iquitos"))
    if (length(input$tema)) d <- filter(d, tema_principal %in% input$tema)
    d
  })
  agg <- reactive(sel() |> group_by(localidad, lon, lat) |>
    summarise(n = n_distinct(uuid), temas = paste(unique(tema_principal), collapse = ", "), .groups = "drop"))

  output$mapa <- renderLeaflet({
    m <- leaflet() |> addProviderTiles("Esri.WorldImagery", group = "Satélite") |>
      addProviderTiles("CartoDB.Positron", group = "Mapa") |>
      addLayersControl(baseGroups = c("Satélite", "Mapa"), options = layersControlOptions(collapsed = FALSE))
    a <- agg()
    if (nrow(a)) m <- m |> addCircleMarkers(data = a, ~lon, ~lat, radius = ~3 + 2.5 * sqrt(n),
        color = "#FFFFFF", weight = 1, fillColor = "#1F5E3B", fillOpacity = .8,
        label = ~paste0(localidad, ": ", n, " tesis"), popup = ~paste0("<b>", localidad, "</b><br>", n, " tesis<br><small>", temas, "</small>"))
    if (!is.null(input$capa) && requireNamespace("sf", quietly = TRUE)) {
      cp <- sf::st_transform(sf::st_read(input$capa$datapath, quiet = TRUE), 4326)
      m <- m |> addPolygons(data = cp, color = "#C9A227", weight = 1, fillOpacity = .1, group = "Capa") |>
        addLayersControl(baseGroups = c("Satélite", "Mapa"), overlayGroups = "Capa")
    }
    m
  })

  output$matriz <- renderPlot({
    d <- loc |> filter(between(anio, input$anio[1], input$anio[2]), !(input$excl_gen & localidad %in% c("Maynas", "Iquitos")))
    top <- d |> count(localidad, sort = TRUE) |> slice_head(n = 20) |> pull(localidad)
    d |> filter(localidad %in% top) |> distinct(uuid, localidad, tema_principal) |>
      count(localidad, tema_principal) |> tidyr::complete(localidad, tema_principal = temas, fill = list(n = 0)) |>
      ggplot(aes(tema_principal, localidad, fill = n)) + geom_tile(colour = "white") +
      geom_text(aes(label = n, colour = n > 15), size = 3) +
      scale_colour_manual(values = c("black", "white"), guide = "none") +
      scale_fill_gradient(low = "#F1F5EE", high = "#1F5E3B") + labs(x = NULL, y = NULL, fill = "Tesis") +
      theme_minimal(11) + theme(axis.text.x = element_text(angle = 50, hjust = 1))
  })

  output$vacios <- renderDT({
    g <- gh_csv("gazetteer_loreto.csv")
    g |> left_join(select(agg(), localidad, n), by = "localidad") |> mutate(n = coalesce(n, 0L)) |>
      filter(!(input$excl_gen & localidad %in% c("Maynas", "Iquitos"))) |> arrange(n) |> select(Localidad = localidad, `Tesis en selección` = n)
  }, rownames = FALSE, options = list(pageLength = 10))
}

shinyApp(ui, server)
