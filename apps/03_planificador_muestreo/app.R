# =============================================================================
# © 2026 Gino Machoa. Todos los derechos reservados.
# Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
# Contacto: diangelomachoa@gmail.com
# Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.
# GITECA | App 03 — Planificador de muestreo para inventarios forestales
# Calcula el tamaño de muestra (n parcelas) y el error de muestreo esperado a partir
# del coeficiente de variación (CV) de un inventario piloto o de un CV de referencia.
# n = t² · CV² / E²  (iterativo en t de Student) con corrección por población finita.
# =============================================================================
library(shiny); library(bslib); library(dplyr); library(ggplot2)

raiz <- if (dir.exists("R")) "." else "../.."
source(file.path(raiz, "R/forestal.R"))
ejemplo <- readr::read_csv(file.path(raiz, "data/ejemplo_inventario.csv"), show_col_types = FALSE)

raiz_legal <- if (dir.exists("R")) "." else "../.."
source(file.path(raiz_legal, "R/legal.R"))
LEGAL <- list(nombre = "Planificador de muestreo forestal", version = "1.0",
  finalidad = "Estimar el tamaño de muestra y el error de muestreo de inventarios forestales.",
  avisoResultados = "Verifique el error máximo e intensidad mínima que exija la normativa aplicable. Los datos de ejemplo son sintéticos.",
  privacidadExtra = "",
  fuentes = data.frame(matrix(c(
  "Datos de ejemplo", "Sintéticos, generados por GITECA", "Prueba de la app"), ncol = 3, byrow = TRUE, dimnames = list(NULL, c("fuente", "licencia", "uso")))))

ui <- page_sidebar(
  title = giteca_logo("Planificador de muestreo forestal"),
  theme = bs_theme(version = 5, primary = "#1F5E3B", secondary = "#1C5D99"),
  sidebar = sidebar(width = 330,
    giteca_autor(),
    radioButtons("fuente", "Origen del CV", c("Inventario piloto (CSV)" = "piloto", "Ingresar CV manualmente" = "manual")),
    conditionalPanel("input.fuente == 'piloto'",
      fileInput("f", "CSV piloto (parcela, especie, dap, altura)", accept = ".csv"),
      helpText("Sin archivo se usan los datos de ejemplo (sintéticos)."),
      selectInput("var", "Variable de interés", c("Área basal" = "g", "Volumen" = "v", "N° individuos" = "n")),
      numericInput("tam", "Tamaño de parcela piloto (ha)", 0.1, 0.01, 10, 0.01)),
    conditionalPanel("input.fuente == 'manual'",
      numericInput("cv_man", "CV (%)", 35, 1, 200)),
    sliderInput("e", "Error de muestreo admisible (%)", 5, 30, 10),
    selectInput("conf", "Nivel de confianza", c("90 %" = .90, "95 %" = .95, "99 %" = .99), .95),
    numericInput("area", "Superficie a inventariar (ha)", 1000, 1),
    numericInput("tam_def", "Tamaño de parcela definitiva (ha)", 0.1, 0.01, 10, 0.01), giteca_pie()
  ),
  layout_columns(fill = FALSE,
    value_box("CV usado", textOutput("cv")),
    value_box("Parcelas necesarias", textOutput("n"), theme = "primary"),
    value_box("Intensidad de muestreo", textOutput("int"))),
  card(card_header("Error de muestreo esperado según n° de parcelas"), plotOutput("curva")),
  card(markdown("**Notas.** El CV depende del tamaño de parcela: si la parcela definitiva difiere de la piloto,
  recalcule con un piloto del mismo tamaño. Verifique siempre el error máximo y la intensidad mínima que exija
  la normativa aplicable (lineamientos de SERFOR para planes de manejo)."))
)

server <- function(input, output, session) {
  giteca_legal_server(input, LEGAL)
  cv <- reactive({
    if (input$fuente == "manual") return(input$cv_man)
    d <- if (is.null(input$f)) ejemplo else readr::read_csv(input$f$datapath, show_col_types = FALSE)
    names(d) <- tolower(names(d))
    x <- d |> mutate(g = area_basal(dap), v = if ("altura" %in% names(d)) volumen(dap, altura) else NA) |>
      group_by(parcela) |> summarise(g = sum(g), v = sum(v), n = n()) |> pull(input$var)
    validate(need(sum(!is.na(x)) >= 3, "Se necesitan al menos 3 parcelas piloto con la variable elegida."))
    100 * sd(x, na.rm = TRUE) / mean(x, na.rm = TRUE)
  })
  N <- reactive(input$area / input$tam_def)
  n_req <- reactive(n_muestra(cv(), input$e, as.numeric(input$conf), N()))

  output$cv  <- renderText(paste0(round(cv(), 1), " %"))
  output$n   <- renderText(n_req())
  output$int <- renderText(paste0(round(100 * n_req() * input$tam_def / input$area, 3), " %"))
  output$curva <- renderPlot({
    k <- 3:max(60, n_req() * 2)
    df <- data.frame(n = k, E = error_muestreo(cv(), k, as.numeric(input$conf), N()))
    ggplot(df, aes(n, E)) + geom_line(colour = "#1F5E3B", linewidth = 1) +
      geom_hline(yintercept = input$e, linetype = 2, colour = "#B23A48") +
      geom_vline(xintercept = n_req(), linetype = 3) +
      annotate("label", x = n_req(), y = input$e, label = paste0("n = ", n_req()), hjust = -0.1) +
      labs(x = "N° de parcelas", y = "Error de muestreo (%)") + theme_minimal(14)
  })
}

shinyApp(ui, server)
