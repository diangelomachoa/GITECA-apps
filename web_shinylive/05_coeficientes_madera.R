# =============================================================================
# © 2026 Gino Machoa. Todos los derechos reservados.
# Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
# Contacto: gitecaconsulting@gmail.com
# Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.
# =============================================================================
# GITECA | App 05 — Biblioteca de coeficientes de madera (tesis FCF-UNAP)
# Densidad básica, contracciones, relación T/R, MOE y MOR por especie, extraídos de los
# PDF de las tesis del Repositorio UNAP y curados manualmente. Cada valor indica si es un
# resultado de la tesis o una referencia citada en ella, con enlace a la tesis.
# =============================================================================
library(shiny); library(bslib); library(dplyr); library(ggplot2); library(DT)

# --- Datos: se descargan del repositorio GITECA-apps (versión web, webR/shinylive) ---
gh_csv <- function(f) { tmp <- tempfile(fileext = ".csv"); download.file(paste0("https://raw.githubusercontent.com/diangelomachoa/GITECA-apps/main/data/", f), tmp, quiet = TRUE); readr::read_csv(tmp, show_col_types = FALSE) }

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

LEGAL <- list(nombre = "Biblioteca de coeficientes de madera", version = "1.0",
  finalidad = "Consultar propiedades físicas y mecánicas de maderas amazónicas reportadas en tesis de la FCF-UNAP.",
  avisoResultados = "Los valores se extrajeron de los PDF y se revisaron manualmente; distinga resultados propios de referencias citadas y verifique en la tesis original antes de usarlos.",
  privacidadExtra = "",
  fuentes = data.frame(matrix(c(
  "Tesis FCF-UNAP — Repositorio Institucional UNAP", "Cada tesis conserva la licencia de su autor (mayormente CC BY-NC-ND); se citan valores con enlace", "Coeficientes por especie",
  "Fichas técnicas citadas en las tesis (Aróstegui 1982, JUNAC, Valderrama, etc.)", "Cita obligatoria de la fuente original", "Valores de referencia"),
  ncol = 3, byrow = TRUE, dimnames = list(NULL, c("fuente", "licencia", "uso")))))

co <- gh_csv("coeficientes_madera.csv")
VAR <- c(densidad_basica = "Densidad básica (g/cm³)", contraccion_tangencial = "Contracción tangencial (%)",
         contraccion_radial = "Contracción radial (%)", contraccion_volumetrica = "Contracción volumétrica (%)",
         relacion_T_R = "Relación T/R", MOE = "MOE flexión (kg/cm²)", MOR = "MOR flexión (kg/cm²)")
co <- co |> mutate(propiedad = unname(VAR[variable]),
                   enlace = paste0('<a href="', url, '" target="_blank">tesis</a>'))

# Clasificación de densidad básica (Aróstegui, 1982)
clase_db <- function(x) cut(x, c(0, .30, .40, .60, .75, 2), right = FALSE,
  labels = c("Muy baja", "Baja", "Media", "Alta", "Muy alta"))

ui <- page_navbar(
  title = giteca_logo("Biblioteca de coeficientes de madera"),
  theme = bs_theme(version = 5, primary = "#1F5E3B", secondary = "#1C5D99"),
  sidebar = sidebar(width = 320,
    giteca_autor(),
    selectizeInput("sp", "Especie", choices = sort(unique(co$especie)), multiple = TRUE,
                   options = list(placeholder = "Todas")),
    checkboxGroupInput("tipo", "Tipo de dato", choices = unique(co$tipo), selected = unique(co$tipo)),
    helpText("Resultado de la tesis = medido por el tesista. Referencia citada = valor de otra fuente que la tesis reproduce."),
    downloadButton("dl", "Descargar selección (CSV)"),
    giteca_pie()
  ),
  nav_panel("Densidad por especie",
    layout_columns(fill = FALSE,
      value_box("Especies", textOutput("n_sp")), value_box("Registros", textOutput("n_reg")),
      value_box("Tesis fuente", textOutput("n_tes"))),
    card(card_header("Densidad básica por especie (puntos = registros; barra = mediana)"), plotOutput("g_db", height = 720))),
  nav_panel("Tabla por especie", card(DTOutput("t_res"))),
  nav_panel("Todos los registros", card(DTOutput("t_all"))),
  nav_panel("Método", card(markdown("
**Origen.** Se descargaron los PDF de las tesis del tema *tecnología de la madera* del Repositorio UNAP (207 con PDF) y se buscaron automáticamente las propiedades físicas y mecánicas. Cada coincidencia se revisó a mano: se asignó la especie, se separaron los **resultados propios** de las **referencias citadas** y se descartaron rangos de clasificación, valores sin especie y datos ambiguos.

**Clasificación de densidad básica** (Aróstegui, 1982): muy baja < 0,30; baja 0,30–0,40; media 0,40–0,60; alta 0,60–0,75; muy alta ≥ 0,75 g/cm³.

**Limitaciones.** La cobertura es parcial (43 especies). Muchas tesis presentan los valores en tablas o imágenes que no se pueden leer automáticamente. Antes de usar un valor, confírmelo en la tesis original con el enlace.")))
)

server <- function(input, output, session) {
  giteca_legal_server(input, LEGAL)
  sel <- reactive({
    d <- co |> filter(tipo %in% input$tipo)
    if (length(input$sp)) d <- filter(d, especie %in% input$sp)
    d
  })
  output$n_sp  <- renderText(n_distinct(sel()$especie))
  output$n_reg <- renderText(nrow(sel()))
  output$n_tes <- renderText(n_distinct(sel()$tesis))
  output$g_db <- renderPlot({
    d <- sel() |> filter(variable == "densidad_basica")
    validate(need(nrow(d) > 0, "Sin registros de densidad para la selección."))
    m <- d |> group_by(especie) |> summarise(med = median(valor), .groups = "drop") |> mutate(clase = clase_db(med))
    ggplot(m, aes(med, reorder(especie, med))) +
      geom_col(aes(fill = clase), alpha = .85, width = .7) +
      geom_point(data = d, aes(valor, especie, shape = tipo), size = 2.3, colour = "#13261C") +
      scale_fill_manual(values = c("Muy baja" = "#d9f0d3", "Baja" = "#a6dba0", "Media" = "#5aae61", "Alta" = "#1b7837", "Muy alta" = "#00441b"), drop = FALSE) +
      labs(x = "Densidad básica (g/cm³)", y = NULL, fill = "Clase (Aróstegui 1982)", shape = NULL) +
      theme_minimal(13) + theme(axis.text.y = element_text(face = "italic"), legend.position = "bottom", legend.box = "vertical")
  })
  output$t_res <- renderDT({
    sel() |> group_by(Especie = especie, Propiedad = propiedad) |>
      summarise(Mediana = median(valor), `Mín` = min(valor), `Máx` = max(valor), Registros = n(),
                `Resultados propios` = sum(tipo == "Resultado de la tesis"), .groups = "drop") |>
      datatable(rownames = FALSE, filter = "top", options = list(pageLength = 25))
  })
  output$t_all <- renderDT(sel() |> select(Especie = especie, Propiedad = propiedad, Valor = valor, Tipo = tipo,
    Nota = nota, Tesis = tesis, `Año` = anio, Enlace = enlace), escape = FALSE, rownames = FALSE, filter = "top",
    options = list(pageLength = 15, scrollX = TRUE))
  output$dl <- downloadHandler(function() paste0("coeficientes_madera_", Sys.Date(), ".csv"),
    function(f) readr::write_csv(select(sel(), -enlace, -propiedad), f))
}

shinyApp(ui, server)
