# =============================================================================
# © 2026 Gino Machoa. Todos los derechos reservados.
# Autor y desarrollador: Gino Machoa · GITECA (Gestión de Información, Tecnología y Ciencias Ambientales)
# Contacto: diangelomachoa@gmail.com
# Prohibida su reproducción, modificación o redistribución sin autorización escrita del autor.
# GITECA | Mapas 02 — Láminas cartográficas estáticas (ggplot2 + sf + ggspatial)
# Entrada: mapas/datos/*.gpkg (generados por 01_preparar_datos.R)
# Salida : docs/mapas/img/*.png (lámina completa) y *.jpg (versión web)
# =============================================================================
library(sf); library(dplyr); library(ggplot2); library(ggspatial); library(patchwork); library(scales)
sf_use_s2(FALSE)
lee <- function(n) st_read(sprintf("mapas/datos/%s.gpkg", n), quiet = TRUE)
dep <- lee("dep"); conc <- lee("conc"); bpp <- lee("bpp"); inc <- lee("inc")
def <- lee("def"); firms <- lee("firms"); gbif <- lee("gbif"); pc <- lee("pc")
out <- "docs/mapas/img"; dir.create(out, showWarnings = FALSE, recursive = TRUE)

VERDE <- "#1F5E3B"; AZUL <- "#1C5D99"; FONDO <- "#F4F1EA"
hoy <- format(Sys.Date(), "%d/%m/%Y")
pie <- function(fuente) stringr::str_wrap(paste0("Fuente: ", fuente, ". Elaboración: GITECA · Gino Machoa (", hoy,
                               "). Sistema de referencia: WGS 84 (EPSG:4326). © 2026 Gino Machoa. Todos los derechos reservados."), 160)
tema <- theme_minimal(base_size = 11) +
  theme(plot.background = element_rect(fill = "white", colour = NA),
        panel.background = element_rect(fill = "#EAF2F7", colour = NA),
        panel.grid = element_line(colour = "white", linewidth = .3),
        plot.title = element_text(face = "bold", colour = VERDE, size = 15),
        plot.subtitle = element_text(colour = "grey25"),
        plot.caption = element_text(colour = "grey35", size = 7, hjust = 0),
        legend.position = "right", axis.title = element_blank())
base <- function(xlim = c(-81.5, -68.5), ylim = c(-18.5, 0.2)) list(
  geom_sf(data = dep, fill = FONDO, colour = "grey55", linewidth = .25),
  coord_sf(xlim = xlim, ylim = ylim, expand = FALSE),
  annotation_scale(location = "bl", width_hint = .22, text_cex = .7),
  annotation_north_arrow(location = "tr", height = unit(1, "cm"), width = unit(.8, "cm"),
                         style = north_arrow_fancy_orienteering(text_size = 7)))
guarda <- function(p, n, w = 9, h = 10) {
  ggsave(file.path(out, paste0(n, ".png")), p, width = w, height = h, dpi = 200, bg = "white")
  ggsave(file.path(out, paste0(n, ".jpg")), p, width = w, height = h, dpi = 90, bg = "white", quality = 80)
}
amazonia <- list(xlim = c(-79.8, -68.6), ylim = c(-14.5, -0.0))

# 1 · Concesiones forestales por modalidad sobre Bosques de Producción Permanente ----
pal_conc <- c("Fines maderables" = "#7A5C1E", "Productos diferentes a la madera" = "#2E8B57",
              "Forestación y/o reforestación" = "#8E44AD", "Conservación" = "#1C5D99",
              "Ecoturismo" = "#E67E22", "Plantaciones forestales" = "#C0392B", "Manejo de fauna silvestre" = "#E84393")
res_c <- conc |> st_drop_geometry() |> count(tipo, sort = TRUE)
p1 <- ggplot() + base(amazonia$xlim, amazonia$ylim)[1] +
  geom_sf(data = bpp, aes(fill = "Bosque de Producción Permanente"), colour = NA, alpha = .55) +
  geom_sf(data = conc, aes(colour = tipo), fill = NA, linewidth = .35) +
  geom_sf(data = dep, fill = NA, colour = "grey40", linewidth = .25) +
  base(amazonia$xlim, amazonia$ylim)[-1] +
  scale_fill_manual(NULL, values = "#B7D7A8") +
  scale_colour_manual("Modalidad de concesión", values = pal_conc,
                      labels = function(x) paste0(x, " (", res_c$n[match(x, res_c$tipo)], ")")) +
  labs(title = "Concesiones forestales en la Amazonía peruana",
       subtitle = sprintf("%s concesiones registradas por modalidad y Bosques de Producción Permanente (BPP)", format(nrow(conc), big.mark = " ")),
       caption = pie("Geoservicios SERFOR — Modalidad de acceso y Ordenamiento forestal")) +
  tema + theme(legend.position = "bottom", legend.box = "vertical") + guides(colour = guide_legend(ncol = 2))
guarda(p1, "01_concesiones")

# 2 · Deforestación monitoreada por la UFMS-SERFOR ----
def_ha <- def |> st_drop_geometry()
p2a <- ggplot() + base(amazonia$xlim, amazonia$ylim)[1] +
  stat_summary_hex(data = cbind(def_ha, st_coordinates(def)), aes(X, Y, z = ha), fun = sum, bins = 70, alpha = .9) +
  geom_sf(data = dep, fill = NA, colour = "grey40", linewidth = .25) +
  base(amazonia$xlim, amazonia$ylim)[-1] +
  scale_fill_viridis_c("Hectáreas\nafectadas", option = "inferno", direction = -1, trans = "log10", labels = label_number(big.mark = " ")) +
  labs(title = "Deforestación detectada por monitoreo satelital",
       subtitle = sprintf("%s polígonos · %s ha · %d–%d", format(nrow(def), big.mark = " "),
                          format(round(sum(def_ha$ha, na.rm = TRUE)), big.mark = " "),
                          min(def_ha$anio, na.rm = TRUE), max(def_ha$anio, na.rm = TRUE))) + tema
p2b <- def_ha |> filter(!is.na(causa)) |> count(causa, wt = ha) |>
  ggplot(aes(n, reorder(causa, n))) + geom_col(fill = "#B03A2E") +
  geom_text(aes(label = format(round(n), big.mark = " ")), hjust = -.1, size = 3) +
  scale_x_continuous(expand = expansion(c(0, .25)), labels = label_number(big.mark = " ")) +
  labs(title = "Causa directa (ha)", x = NULL, y = NULL) + theme_minimal(10) + theme(plot.title = element_text(face = "bold", size = 10))
p2c <- def_ha |> count(anio, wt = ha) |> ggplot(aes(anio, n)) + geom_col(fill = "#E67E22") +
  scale_x_continuous(breaks = 2017:2026) + scale_y_continuous(labels = label_number(big.mark = " ")) +
  labs(title = "Hectáreas por año de detección", x = NULL, y = NULL) + theme_minimal(10) + theme(plot.title = element_text(face = "bold", size = 10))
p2 <- p2a + (p2b / p2c) + plot_layout(widths = c(1.6, 1)) +
  plot_annotation(caption = pie("Geoservicios SERFOR — Unidad Funcional de Monitoreo Satelital (Monitoreo de deforestación)"),
                  theme = theme(plot.caption = element_text(colour = "grey35", size = 7, hjust = 0)))
guarda(p2, "02_deforestacion", w = 13, h = 9)

# 3 · Incendios forestales registrados por SERFOR ----
inc_dep <- inc |> st_drop_geometry() |> count(NOMDEP, name = "n")
dep_i <- dep |> left_join(inc_dep, by = c("NOMBDEP" = "NOMDEP"))
p3 <- ggplot() +
  geom_sf(data = dep_i, aes(fill = n), colour = "white", linewidth = .3) +
  geom_sf(data = inc, colour = "#7B241C", size = .35, alpha = .5) +
  geom_sf_text(data = filter(dep_i, n >= 50), aes(label = paste0(NOMBDEP, "\n", n)), size = 2.4, fontface = "bold") +
  coord_sf(xlim = c(-81.5, -68.5), ylim = c(-18.5, 0.2), expand = FALSE) +
  annotation_scale(location = "bl", width_hint = .22, text_cex = .7) +
  annotation_north_arrow(location = "tr", height = unit(1, "cm"), width = unit(.8, "cm"), style = north_arrow_fancy_orienteering(text_size = 7)) +
  scale_fill_gradient("N.° de incendios\n(gris: sin registros)", low = "#FDEBD0", high = "#C0392B", na.value = "grey88") +
  labs(title = "Incendios forestales registrados por departamento (2026)",
       subtitle = sprintf("%s registros de incendio forestal (%s en cobertura forestal)", format(nrow(inc), big.mark = " "),
                          format(sum(inc$TIPCOB == "Cobertura Forestal", na.rm = TRUE), big.mark = " ")),
       caption = pie("Geoservicios SERFOR — Incendios forestales (DGIOFFS)")) + tema
guarda(p3, "03_incendios")

# 4 · Focos de calor VIIRS de los últimos 7 días ----
p4 <- ggplot() + base()[1] +
  stat_density_2d(data = cbind(st_drop_geometry(firms), st_coordinates(firms)), aes(X, Y, fill = after_stat(level)),
                  geom = "polygon", alpha = .45, bins = 12, h = .8) +
  geom_sf(data = firms, colour = "#D35400", size = .25, alpha = .6) +
  geom_sf(data = dep, fill = NA, colour = "grey40", linewidth = .25) + base()[-1] +
  scale_fill_distiller("Densidad\nrelativa", palette = "YlOrRd", direction = 1, labels = NULL) +
  labs(title = "Focos de calor de los últimos 7 días",
       subtitle = sprintf("%s detecciones VIIRS S-NPP del %s al %s", format(nrow(firms), big.mark = " "),
                          format(min(firms$acq_date), "%d/%m/%Y"), format(max(firms$acq_date), "%d/%m/%Y")),
       caption = pie("NASA FIRMS — VIIRS S-NPP 375 m (NRT). Un foco de calor no equivale a un incendio confirmado")) + tema
guarda(p4, "04_focos_calor")

# 5 · Especies maderables CITES con registros en GBIF ----
gb <- gbif |> mutate(especie = factor(especie, names(sort(table(especie), decreasing = TRUE))))
etq <- gb |> st_drop_geometry() |> count(especie)
p5 <- ggplot() + geom_sf(data = dep, fill = FONDO, colour = "grey60", linewidth = .2) +
  geom_sf(data = gb, colour = VERDE, size = .9, alpha = .7) +
  geom_text(data = etq, aes(-80.8, -17.6, label = paste(n, "registros")), hjust = 0, size = 2.8, colour = "grey25") +
  facet_wrap(~especie, ncol = 3) + coord_sf(xlim = c(-81.5, -68.5), ylim = c(-18.5, 0.2), expand = FALSE) +
  labs(title = "Especies maderables listadas en CITES: registros de ocurrencia en el Perú",
       subtitle = "Swietenia, Cedrela, Dipteryx, Handroanthus y Amburana — registros georreferenciados sin problemas geoespaciales",
       caption = pie("GBIF.org (descarga vía API, registros de especímenes y observaciones)")) +
  tema + theme(strip.text = element_text(face = "bold.italic", colour = VERDE), axis.text = element_blank())
guarda(p5, "05_especies_cites", w = 11, h = 9.5)
