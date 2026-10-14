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

raiz_legal <- if (dir.exists("R")) "." else "../.."
source(file.path(raiz_legal, "R/legal.R"))
LEGAL <- list(nombre = "Biblioteca de coeficientes de madera", version = "1.0",
  finalidad = "Consultar propiedades físicas y mecánicas de maderas amazónicas reportadas en tesis de la FCF-UNAP.",
  avisoResultados = "Los valores se extrajeron de los PDF y se revisaron manualmente; distinga resultados propios de referencias citadas y verifique en la tesis original antes de usarlos.",
  privacidadExtra = "",
  fuentes = data.frame(matrix(c(
  "Tesis FCF-UNAP — Repositorio Institucional UNAP", "Cada tesis conserva la licencia de su autor (mayormente CC BY-NC-ND); se citan valores con enlace", "Coeficientes por especie",
  "Fichas técnicas citadas en las tesis (Aróstegui 1982, JUNAC, Valderrama, etc.)", "Cita obligatoria de la fuente original", "Valores de referencia"),
  ncol = 3, byrow = TRUE, dimnames = list(NULL, c("fuente", "licencia", "uso")))))

raiz <- if (dir.exists("data")) "." else "../.."
co <- readr::read_csv(file.path(raiz, "data/coeficientes_madera.csv"), show_col_types = FALSE)
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
