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

local({
  r <- c("recursos", "../../recursos")
  r <- r[dir.exists(r)][1]
  if (!is.na(r)) shiny::addResourcePath("giteca", normalizePath(r))
})

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
    shiny::tags$img(src = "giteca/giteca_logo_256.png", height = "38px", alt = "Logo GITECA",
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
