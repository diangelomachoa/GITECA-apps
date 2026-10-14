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

raiz <- if (dir.exists("data")) "." else "../.."
tesis <- readr::read_csv(file.path(raiz, "data/tesis_fcf_unap.csv"), show_col_types = FALSE)
loc   <- readr::read_csv(file.path(raiz, "data/tesis_localidades.csv"), show_col_types = FALSE) |>
  left_join(select(tesis, uuid, titulo, anio, tema_principal, escuela, url), by = "uuid")
temas <- sort(unique(tesis$tema_principal))

raiz_legal <- if (dir.exists("R")) "." else "../.."
source(file.path(raiz_legal, "R/legal.R"))
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
    g <- readr::read_csv(file.path(raiz, "data/gazetteer_loreto.csv"), show_col_types = FALSE)
    g |> left_join(select(agg(), localidad, n), by = "localidad") |> mutate(n = coalesce(n, 0L)) |>
      filter(!(input$excl_gen & localidad %in% c("Maynas", "Iquitos"))) |> arrange(n) |> select(Localidad = localidad, `Tesis en selección` = n)
  }, rownames = FALSE, options = list(pageLength = 10))
}

shinyApp(ui, server)
