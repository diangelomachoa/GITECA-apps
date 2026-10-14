# =============================================================================
# © 2026 Gino Machoa. Todos los derechos reservados.
# Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
# Contacto: gitecaconsulting@gmail.com
# Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.
# GITECA | App 03 — Planificador de muestreo para inventarios forestales
# Calcula el tamaño de muestra (n parcelas) y el error de muestreo esperado a partir
# del coeficiente de variación (CV) de un inventario piloto o de un CV de referencia.
# n = t² · CV² / E²  (iterativo en t de Student) con corrección por población finita.
# =============================================================================
library(shiny); library(bslib); library(dplyr); library(ggplot2)

# --- Datos: se descargan del repositorio GITECA-apps (versión web, webR/shinylive) ---
gh_csv <- function(f) { tmp <- tempfile(fileext = ".csv"); download.file(paste0("https://raw.githubusercontent.com/diangelomachoa/GITECA-apps/main/data/", f), tmp, quiet = TRUE); readr::read_csv(tmp, show_col_types = FALSE) }

# ---- R/forestal.R (incluido) ----
# =============================================================================
# © 2026 Gino Machoa. Todos los derechos reservados.
# Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
# Contacto: gitecaconsulting@gmail.com
# Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.
# GITECA | Funciones forestales compartidas
# Referencias:
#  - Área basal: g = pi/4 * (DAP/100)^2  [m²]
#  - Volumen comercial: V = g * Hc * ff  (ff = factor de forma; 0.65 usual en Amazonía peruana,
#    verifique el coeficiente que exige la normativa/guía aplicable)
#  - IVI (Curtis & McIntosh 1951): Ab% + Fr% + Do%
#  - Biomasa aérea: Chave et al. (2014), Global Change Biology 20:3177–3190, ec. 4:
#      AGB[kg] = 0.0673 * (rho * D^2 * H)^0.976
#  - Diversidad: Shannon H' (ln), Simpson 1-D, Fisher alpha (vía vegan si está instalado)
# =============================================================================

area_basal <- function(dap_cm) pi / 4 * (dap_cm / 100)^2

volumen <- function(dap_cm, h_m, ff = 0.65) area_basal(dap_cm) * h_m * ff

agb_chave14 <- function(dap_cm, h_m, rho) 0.0673 * (rho * dap_cm^2 * h_m)^0.976  # kg

shannon <- function(n) { p <- n[n > 0] / sum(n); -sum(p * log(p)) }
simpson <- function(n) { p <- n / sum(n); 1 - sum(p^2) }

#' Tabla IVI por especie
#' @param d data.frame con columnas: parcela, especie, dap (cm)
#' @param area_ha área total muestreada (ha)
ivi <- function(d, area_ha) {
  np <- dplyr::n_distinct(d$parcela)
  d |>
    dplyr::mutate(g = area_basal(dap)) |>
    dplyr::group_by(especie) |>
    dplyr::summarise(n = dplyr::n(), parcelas = dplyr::n_distinct(parcela),
                     G = sum(g), .groups = "drop") |>
    dplyr::mutate(`N/ha` = n / area_ha, `G/ha` = G / area_ha,
                  Ab_rel = 100 * n / sum(n),
                  Fr_rel = 100 * (parcelas / np) / sum(parcelas / np),
                  Do_rel = 100 * G / sum(G),
                  IVI = Ab_rel + Fr_rel + Do_rel) |>
    dplyr::arrange(dplyr::desc(IVI))
}

#' Curva de acumulación de especies por permutaciones (método "random")
curva_acumulacion <- function(d, perm = 100) {
  m <- table(d$parcela, d$especie) > 0
  k <- nrow(m)
  res <- replicate(perm, { o <- sample(k); vapply(seq_len(k), \(i) sum(colSums(m[o[1:i], , drop = FALSE]) > 0), numeric(1)) })
  res <- matrix(res, nrow = k)
  data.frame(parcelas = seq_len(k), S = rowMeans(res),
             lo = apply(res, 1, quantile, 0.025), hi = apply(res, 1, quantile, 0.975))
}

#' Distribución diamétrica por clases
clases_diametricas <- function(dap, ancho = 10, min = 10) {
  cut(dap, breaks = seq(min, max(dap, na.rm = TRUE) + ancho, by = ancho), right = FALSE, dig.lab = 4)
}

#' Tamaño de muestra para inventario (población infinita / finita)
#' n = t² CV² / E²  ;  corrección finita n / (1 + n/N)
n_muestra <- function(cv, e, conf = 0.95, N = Inf, n0 = 30, iter = 20) {
  n <- n0
  for (i in seq_len(iter)) {
    t <- qt(1 - (1 - conf) / 2, df = max(n - 1, 1))
    n_new <- (t^2 * cv^2) / e^2
    if (is.finite(N)) n_new <- n_new / (1 + n_new / N)
    if (abs(n_new - n) < 0.01) break
    n <- n_new
  }
  ceiling(n)
}

#' Error de muestreo (%) dado n parcelas
error_muestreo <- function(cv, n, conf = 0.95, N = Inf) {
  t <- qt(1 - (1 - conf) / 2, df = n - 1)
  fpc <- if (is.finite(N)) sqrt(1 - n / N) else 1
  t * cv / sqrt(n) * fpc
}

ejemplo <- gh_csv("ejemplo_inventario.csv")

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
