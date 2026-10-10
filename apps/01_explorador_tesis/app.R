# =============================================================================
# © 2026 Gino Machoa. Todos los derechos reservados.
# Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
# Contacto: diangelomachoa@gmail.com
# Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.
# GITECA | App 01 — Explorador bibliométrico de tesis FCF-UNAP
# Fuente de datos: Repositorio Institucional UNAP (repositorio.unapiquitos.edu.pe),
# comunidad Facultad de Ciencias Forestales. Metadatos Dublin Core vía API DSpace.
# =============================================================================
library(shiny); library(bslib); library(dplyr); library(tidyr)
library(stringr); library(ggplot2); library(DT); library(visNetwork)

ruta <- if (file.exists("data/tesis_fcf_unap.csv")) "data/tesis_fcf_unap.csv" else "../../data/tesis_fcf_unap.csv"
tesis <- readr::read_csv(ruta, show_col_types = FALSE) |>
  mutate(anio = as.integer(anio), url = paste0('<a href="', url, '" target="_blank">ver</a>'))

stop_es <- c("de","la","el","en","y","los","las","del","con","por","para","a","un","una","al",
             "se","su","sus","que","como","entre","sobre","mediante","según","loreto","perú",
             "iquitos","distrito","provincia","región","maynas","departamento","tres","dos")

raiz_legal <- if (dir.exists("R")) "." else "../.."
source(file.path(raiz_legal, "R/legal.R"))
LEGAL <- list(nombre = "Explorador de tesis FCF-UNAP", version = "1.0",
  finalidad = "Explorar y analizar la producción de tesis de la Facultad de Ciencias Forestales de la UNAP.",
  avisoResultados = "La clasificación temática es automática por palabras clave y puede contener errores.",
  privacidadExtra = "",
  fuentes = data.frame(matrix(c(
  "Metadatos de tesis — Repositorio Institucional UNAP", "Metadatos públicos; cada tesis conserva la licencia de su autor (mayormente CC BY-NC-ND)", "Base de tesis, títulos, resúmenes y enlaces"), ncol = 3, byrow = TRUE, dimnames = list(NULL, c("fuente", "licencia", "uso")))))

ui <- page_navbar(
  title = giteca_logo("Explorador de tesis FCF-UNAP"),
  theme = bs_theme(version = 5, primary = "#1F5E3B", secondary = "#1C5D99"),
  sidebar = sidebar(
    giteca_autor(),
    textInput("q", "Buscar en título / resumen", placeholder = "ej. shihuahuaco, carbono"),
    selectizeInput("esc", "Escuela", choices = sort(unique(tesis$escuela)), multiple = TRUE),
    selectizeInput("tema", "Tema principal", choices = sort(unique(tesis$tema_principal)), multiple = TRUE),
    sliderInput("anio", "Año", min(tesis$anio, na.rm = TRUE), max(tesis$anio, na.rm = TRUE),
                value = range(tesis$anio, na.rm = TRUE), sep = ""),
    selectizeInput("ases", "Asesor", choices = NULL, multiple = TRUE),
    hr(), downloadButton("dl", "Descargar selección (CSV)"), giteca_pie()
  ),
  nav_panel("Resumen",
    layout_columns(
      value_box("Tesis", textOutput("n_tesis"), theme = "primary"),
      value_box("Asesores", textOutput("n_ases"), theme = "secondary"),
      value_box("Periodo", textOutput("periodo"), theme = "light")),
    layout_columns(card(card_header("Tesis por año"), plotOutput("g_anio")),
                   card(card_header("Temas"), plotOutput("g_tema")))),
  nav_panel("Tendencias por tema", card(plotOutput("g_tend", height = 520))),
  nav_panel("Términos frecuentes", card(plotOutput("g_terms", height = 560))),
  nav_panel("Red asesor–tesista", card(card_header("Asesores con ≥ n tesis en la selección"),
            numericInput("min_n", "n mínimo", 5, 1, 50, width = "150px"),
            visNetworkOutput("red", height = "620px"))),
  nav_panel("Tabla", card(DTOutput("tabla"))),
  nav_spacer(),
  nav_item(tags$small("Fuente: Repositorio Institucional UNAP · Elaborado por GITECA"))
)

server <- function(input, output, session) {
  giteca_legal_server(input, LEGAL)
  ases_all <- tesis |> separate_rows(asesor, sep = " \\| ") |> filter(!is.na(asesor)) |> count(asesor, sort = TRUE)
  updateSelectizeInput(session, "ases", choices = ases_all$asesor, server = TRUE)

  sel <- reactive({
    d <- tesis |> filter(between(anio, input$anio[1], input$anio[2]) | is.na(anio))
    if (length(input$esc))  d <- filter(d, escuela %in% input$esc)
    if (length(input$tema)) d <- filter(d, tema_principal %in% input$tema)
    if (nzchar(input$q)) d <- filter(d, str_detect(str_to_lower(paste(titulo, resumen, palabras_clave)), fixed(str_to_lower(input$q))))
    if (length(input$ases)) d <- filter(d, str_detect(asesor, paste(input$ases, collapse = "|")))
    d
  })

  output$n_tesis <- renderText(format(nrow(sel()), big.mark = ","))
  output$n_ases  <- renderText(sel() |> separate_rows(asesor, sep = " \\| ") |> distinct(asesor) |> nrow())
  output$periodo <- renderText(paste(range(sel()$anio, na.rm = TRUE), collapse = "–"))

  output$g_anio <- renderPlot(ggplot(count(sel(), anio, escuela), aes(anio, n, fill = escuela)) +
    geom_col() + scale_fill_manual(values = c("#1F5E3B", "#1C5D99", "grey60", "grey80")) +
    labs(x = NULL, y = "N° tesis", fill = NULL) + theme_minimal(13) + theme(legend.position = "bottom"))

  output$g_tema <- renderPlot(ggplot(count(sel(), tema_principal), aes(n, reorder(tema_principal, n))) +
    geom_col(fill = "#1F5E3B") + geom_text(aes(label = n), hjust = -0.2) +
    labs(x = "N° tesis", y = NULL) + theme_minimal(13) + expand_limits(x = max(count(sel(), tema_principal)$n) * 1.1))

  output$g_tend <- renderPlot(sel() |> filter(!is.na(anio)) |> mutate(q = anio %/% 5 * 5) |>
    count(q, tema_principal) |> group_by(q) |> mutate(p = n / sum(n)) |>
    ggplot(aes(q, p, colour = tema_principal)) + geom_line(linewidth = 1) + geom_point() +
    scale_y_continuous(labels = scales::percent) + facet_wrap(~tema_principal, ncol = 4) +
    labs(x = "Quinquenio", y = "% de tesis del quinquenio") + theme_minimal(12) + theme(legend.position = "none"))

  output$g_terms <- renderPlot({
    w <- sel() |> transmute(t = str_to_lower(titulo)) |>
      mutate(t = str_split(str_replace_all(t, "[^a-záéíóúñü ]", " "), "\\s+")) |> unnest(t) |>
      filter(nchar(t) > 3, !t %in% stop_es) |> count(t, sort = TRUE) |> slice_head(n = 30)
    ggplot(w, aes(n, reorder(t, n))) + geom_col(fill = "#1C5D99") + labs(x = "Frecuencia en títulos", y = NULL) + theme_minimal(13)
  })

  output$red <- renderVisNetwork({
    e <- sel() |> separate_rows(asesor, sep = " \\| ") |> separate_rows(autores, sep = " \\| ") |>
      filter(!is.na(asesor), !is.na(autores)) |> select(from = asesor, to = autores, tema_principal)
    top <- count(e, from) |> filter(n >= input$min_n) |> pull(from)
    e <- filter(e, from %in% top)
    validate(need(nrow(e) > 0, "Sin asesores con ese mínimo de tesis."))
    nodes <- bind_rows(
      count(e, id = from) |> mutate(group = "Asesor", value = n, title = paste0(id, ": ", n, " tesis")),
      distinct(e, id = to) |> mutate(group = "Tesista", value = 1, title = id)) |>
      distinct(id, .keep_all = TRUE) |> mutate(label = ifelse(group == "Asesor", id, ""))
    visNetwork(nodes, e) |> visGroups(groupname = "Asesor", color = "#1F5E3B") |>
      visGroups(groupname = "Tesista", color = "#9CC5A1") |>
      visOptions(highlightNearest = TRUE, nodesIdSelection = TRUE) |> visPhysics(stabilization = 200)
  })

  output$tabla <- renderDT(sel() |> select(anio, titulo, autores, asesor, escuela, tema_principal, url),
    escape = FALSE, rownames = FALSE, filter = "top", options = list(pageLength = 15, scrollX = TRUE))

  output$dl <- downloadHandler(function() paste0("tesis_fcf_unap_seleccion_", Sys.Date(), ".csv"),
    function(f) readr::write_csv(sel() |> mutate(url = str_extract(url, "http[^\"]+")), f))
}

shinyApp(ui, server)
