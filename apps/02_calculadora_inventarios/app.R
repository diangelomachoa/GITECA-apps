# =============================================================================
# © 2026 Gino Machoa. Todos los derechos reservados.
# Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
# Contacto: diangelomachoa@gmail.com
# Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.
# GITECA | App 02 — Calculadora de inventarios forestales
# Estandariza el procesamiento que se repite en cientos de tesis de estructura y
# composición: N/ha, G/ha, volumen, IVI, diversidad, acumulación de especies y biomasa.
# Entrada: CSV con columnas parcela, especie, dap (cm); opcionales altura (m), densidad (g/cm³)
# =============================================================================
library(shiny); library(bslib); library(dplyr); library(ggplot2); library(DT)

raiz <- if (dir.exists("R")) "." else "../.."
source(file.path(raiz, "R/forestal.R"))
ejemplo <- readr::read_csv(file.path(raiz, "data/ejemplo_inventario.csv"), show_col_types = FALSE)

raiz_legal <- if (dir.exists("R")) "." else "../.."
source(file.path(raiz_legal, "R/legal.R"))
LEGAL <- list(nombre = "Calculadora de inventarios forestales", version = "1.0",
  finalidad = "Procesar datos de inventarios forestales: estructura, composición, diversidad y biomasa.",
  avisoResultados = "La biomasa se estima con Chave et al. (2014); la calidad depende de los datos de campo cargados. Los datos de ejemplo son sintéticos.",
  privacidadExtra = "",
  fuentes = data.frame(matrix(c(
  "Ecuación de biomasa — Chave et al. (2014), Global Change Biology 20:3177–3190", "Publicación científica (cita obligatoria)", "Cálculo de biomasa aérea",
  "Datos de ejemplo", "Sintéticos, generados por GITECA", "Prueba de la app"), ncol = 3, byrow = TRUE, dimnames = list(NULL, c("fuente", "licencia", "uso")))))

ui <- page_sidebar(
  title = giteca_logo("Calculadora de inventarios forestales"),
  theme = bs_theme(version = 5, primary = "#1F5E3B", secondary = "#1C5D99"),
  sidebar = sidebar(width = 320,
    giteca_autor(),
    fileInput("f", "CSV de inventario", accept = ".csv"),
    helpText("Columnas: parcela, especie, dap (cm). Opcionales: altura (m), densidad (g/cm³)."),
    checkboxInput("usar_ej", "Usar datos de ejemplo (sintéticos)", TRUE),
    numericInput("tam", "Tamaño de cada parcela (ha)", 0.1, 0.01, 10, 0.01),
    numericInput("dmin", "DAP mínimo (cm)", 10, 1, 100),
    numericInput("ff", "Factor de forma", 0.65, 0.3, 1, 0.01),
    numericInput("rho0", "Densidad por defecto (g/cm³)", 0.6, 0.2, 1.2, 0.01),
    helpText("La densidad por defecto se usa solo cuando falta el dato por especie."),
    downloadButton("dl", "Descargar resultados (CSV)"), giteca_pie()
  ),
  layout_columns(fill = FALSE,
    value_box("Individuos/ha", textOutput("nha")),
    value_box("Área basal (m²/ha)", textOutput("gha")),
    value_box("Volumen (m³/ha)", textOutput("vha")),
    value_box("Biomasa aérea (Mg/ha)", textOutput("bha")),
    value_box("Especies", textOutput("S")),
    value_box("Shannon H'", textOutput("H"))),
  navset_card_tab(
    nav_panel("IVI", DTOutput("t_ivi")),
    nav_panel("Distribución diamétrica", plotOutput("g_dd")),
    nav_panel("Acumulación de especies", plotOutput("g_acc")),
    nav_panel("Top 10 IVI", plotOutput("g_ivi")),
    nav_panel("Por parcela", DTOutput("t_parc")),
    nav_panel("Métodos", markdown("
**Área basal:** g = π/4 · (DAP/100)²
**Volumen:** V = g · H · ff
**IVI:** abundancia relativa + frecuencia relativa + dominancia relativa (Curtis & McIntosh, 1951)
**Biomasa aérea:** Chave et al. (2014), ec. 4: AGB = 0.0673 · (ρ·D²·H)^0.976
**Diversidad:** Shannon (ln) y Simpson (1 − Σp²)
**Acumulación:** 100 permutaciones aleatorias del orden de parcelas, IC 95 %
*Los datos de ejemplo son sintéticos y solo sirven para probar la app.*")))
)

server <- function(input, output, session) {
  giteca_legal_server(input, LEGAL)
  datos <- reactive({
    d <- if (!is.null(input$f) && !input$usar_ej) readr::read_csv(input$f$datapath, show_col_types = FALSE) else ejemplo
    names(d) <- tolower(names(d))
    validate(need(all(c("parcela", "especie", "dap") %in% names(d)), "Faltan columnas parcela, especie o dap."))
    if (!"altura" %in% names(d))   d$altura <- NA_real_
    if (!"densidad" %in% names(d)) d$densidad <- NA_real_
    d |> filter(dap >= input$dmin) |>
      mutate(densidad = coalesce(densidad, input$rho0), g = area_basal(dap),
             v = volumen(dap, altura, input$ff), agb = agb_chave14(dap, altura, densidad))
  })
  area <- reactive(n_distinct(datos()$parcela) * input$tam)
  t_ivi <- reactive(ivi(datos(), area()))

  output$nha <- renderText(round(nrow(datos()) / area()))
  output$gha <- renderText(round(sum(datos()$g) / area(), 2))
  output$vha <- renderText({ v <- sum(datos()$v, na.rm = TRUE); if (all(is.na(datos()$altura))) "sin altura" else round(v / area(), 1) })
  output$bha <- renderText(if (all(is.na(datos()$altura))) "sin altura" else round(sum(datos()$agb, na.rm = TRUE) / 1000 / area(), 1))
  output$S   <- renderText(n_distinct(datos()$especie))
  output$H   <- renderText(round(shannon(table(datos()$especie)), 2))

  output$t_ivi <- renderDT(datatable(t_ivi(), rownames = FALSE, options = list(pageLength = 15)) |>
    formatRound(c("N/ha", "G/ha", "G", "Ab_rel", "Fr_rel", "Do_rel", "IVI"), 2))

  output$g_dd <- renderPlot(datos() |> mutate(clase = clases_diametricas(dap, 10, input$dmin)) |>
    count(clase) |> mutate(nha = n / area()) |>
    ggplot(aes(clase, nha)) + geom_col(fill = "#1F5E3B") +
    labs(x = "Clase diamétrica (cm)", y = "Individuos/ha") + theme_minimal(14))

  output$g_acc <- renderPlot(ggplot(curva_acumulacion(datos()), aes(parcelas, S)) +
    geom_ribbon(aes(ymin = lo, ymax = hi), fill = "#9CC5A1", alpha = .5) + geom_line(colour = "#1F5E3B", linewidth = 1) +
    labs(x = "N° de parcelas", y = "Especies acumuladas", caption = "Banda: IC 95 % (100 permutaciones)") + theme_minimal(14))

  output$g_ivi <- renderPlot(t_ivi() |> slice_head(n = 10) |>
    tidyr::pivot_longer(c(Ab_rel, Fr_rel, Do_rel)) |>
    mutate(name = factor(name, c("Ab_rel", "Fr_rel", "Do_rel"), c("Abundancia", "Frecuencia", "Dominancia"))) |>
    ggplot(aes(value, reorder(especie, IVI), fill = name)) + geom_col() +
    scale_fill_manual(values = c("#1F5E3B", "#1C5D99", "#C9A227")) +
    labs(x = "IVI (%)", y = NULL, fill = NULL) + theme_minimal(14) + theme(axis.text.y = element_text(face = "italic"), legend.position = "bottom"))

  output$t_parc <- renderDT(datos() |> group_by(parcela) |>
    summarise(n = n(), S = n_distinct(especie), `G (m²)` = round(sum(g), 3), `H'` = round(shannon(table(especie)), 2),
              `Simpson` = round(simpson(table(especie)), 3)), rownames = FALSE)

  output$dl <- downloadHandler(function() paste0("ivi_", Sys.Date(), ".csv"), function(f) readr::write_csv(t_ivi(), f))
}

shinyApp(ui, server)
