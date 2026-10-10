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

# --- Datos: se descargan del repositorio GITECA-apps (versión web, webR/shinylive) ---
gh_csv <- function(f) { tmp <- tempfile(fileext = ".csv"); download.file(paste0("https://raw.githubusercontent.com/diangelomachoa/GITECA-apps/main/data/", f), tmp, quiet = TRUE); readr::read_csv(tmp, show_col_types = FALSE) }
library(stringr); library(ggplot2); library(DT); library(visNetwork)

tesis <- gh_csv("tesis_fcf_unap.csv") |>
  mutate(anio = as.integer(anio), url = paste0('<a href="', url, '" target="_blank">ver</a>'))

stop_es <- c("de","la","el","en","y","los","las","del","con","por","para","a","un","una","al",
             "se","su","sus","que","como","entre","sobre","mediante","según","loreto","perú",
             "iquitos","distrito","provincia","región","maynas","departamento","tres","dos")

# ---- R/legal.R (incluido) ----
# =============================================================================
# © 2026 Gino Machoa. Todos los derechos reservados.
# Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
# Contacto: diangelomachoa@gmail.com
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
  correo = "diangelomachoa@gmail.com",
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
