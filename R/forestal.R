# =============================================================================
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
