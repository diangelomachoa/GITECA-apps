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

# --- Datos: se descargan del repositorio GITECA-apps (versión web, webR/shinylive) ---
gh_csv <- function(f) { tmp <- tempfile(fileext = ".csv"); download.file(paste0("https://raw.githubusercontent.com/diangelomachoa/GITECA-apps/main/data/", f), tmp, quiet = TRUE); readr::read_csv(tmp, show_col_types = FALSE) }

# ---- R/forestal.R (incluido) ----
# =============================================================================
# © 2026 Gino Machoa. Todos los derechos reservados.
# Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
# Contacto: diangelomachoa@gmail.com
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
