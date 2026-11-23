"""Sistema canadiense del Índice Meteorológico de Incendios (FWI), Van Wagner (1987).
Implementación propia en Python estándar. © 2026 GITECA Consulting E.I.R.L."""
import math

LE_SUR = [11.5, 10.5, 9.2, 7.9, 6.8, 6.2, 6.5, 7.4, 8.7, 10.0, 11.2, 11.8]   # largo del día efectivo (DMC), 10–30° S
LF_SUR = [6.4, 5.0, 2.4, 0.4, -1.6, -1.6, -1.6, -1.6, -1.6, 0.9, 3.8, 5.8]  # factor de día (DC), hemisferio sur

def ffmc(T, H, W, ro, f0):
    mo = 147.2 * (101 - f0) / (59.5 + f0)
    if ro > 0.5:
        rf = ro - 0.5
        if mo > 150:
            mo = mo + 42.5 * rf * math.exp(-100 / (251 - mo)) * (1 - math.exp(-6.93 / rf)) + 0.0015 * (mo - 150) ** 2 * math.sqrt(rf)
        else:
            mo = mo + 42.5 * rf * math.exp(-100 / (251 - mo)) * (1 - math.exp(-6.93 / rf))
        mo = min(mo, 250)
    ed = 0.942 * H ** 0.679 + 11 * math.exp((H - 100) / 10) + 0.18 * (21.1 - T) * (1 - math.exp(-0.115 * H))
    if mo > ed:
        ko = 0.424 * (1 - (H / 100) ** 1.7) + 0.0694 * math.sqrt(W) * (1 - (H / 100) ** 8)
        m = ed + (mo - ed) * 10 ** (-ko * 0.581 * math.exp(0.0365 * T))
    else:
        ew = 0.618 * H ** 0.753 + 10 * math.exp((H - 100) / 10) + 0.18 * (21.1 - T) * (1 - math.exp(-0.115 * H))
        if mo < ew:
            k1 = 0.424 * (1 - ((100 - H) / 100) ** 1.7) + 0.0694 * math.sqrt(W) * (1 - ((100 - H) / 100) ** 8)
            m = ew - (ew - mo) * 10 ** (-k1 * 0.581 * math.exp(0.0365 * T))
        else:
            m = mo
    return max(0.0, min(101.0, 59.5 * (250 - m) / (147.2 + m)))

def dmc(T, H, ro, d0, mes, lat):
    T = max(T, -1.1)
    le = 9.0 if lat > -10 else LE_SUR[mes - 1]
    rk = 1.894 * (T + 1.1) * (100 - H) * le * 1e-4
    if ro > 1.5:
        re = 0.92 * ro - 1.27
        mo = 20 + math.exp(5.6348 - d0 / 43.43)
        b = 100 / (0.5 + 0.3 * d0) if d0 <= 33 else (14 - 1.3 * math.log(d0) if d0 <= 65 else 6.2 * math.log(d0) - 17.2)
        mr = mo + 1000 * re / (48.77 + b * re)
        pr = max(244.72 - 43.43 * math.log(mr - 20), 0.0)
    else:
        pr = d0
    return max(pr + rk, 0.0)

def dc(T, ro, d0, mes, lat):
    T = max(T, -2.8)
    lf = 1.4 if lat > -10 else LF_SUR[mes - 1]
    pe = max((0.36 * (T + 2.8) + lf) / 2, 0.0)
    if ro > 2.8:
        rd = 0.83 * ro - 1.27
        qr = 800 * math.exp(-d0 / 400) + 3.937 * rd
        dr = max(400 * math.log(800 / qr), 0.0)
    else:
        dr = d0
    return dr + pe

def isi(W, f):
    m = 147.2 * (101 - f) / (59.5 + f)
    return 0.208 * math.exp(0.05039 * W) * 91.9 * math.exp(-0.1386 * m) * (1 + m ** 5.31 / 4.93e7)

def bui(p, d):
    if p <= 0.4 * d:
        u = 0.8 * p * d / (p + 0.4 * d) if p + 0.4 * d > 0 else 0
    else:
        u = p - (1 - 0.8 * d / (p + 0.4 * d)) * (0.92 + (0.0114 * p) ** 1.7)
    return max(u, 0.0)

def fwi(i, u):
    fd = 0.626 * u ** 0.809 + 2 if u <= 80 else 1000 / (25 + 108.64 * math.exp(-0.023 * u))
    b = 0.1 * i * fd
    return math.exp(2.72 * (0.434 * math.log(b)) ** 0.647) if b > 1 else b

def serie(dias, lat, f0=85.0, p0=6.0, d0=15.0):
    """dias: lista de dicts con t (AAAA-MM-DD), T, H, W (km/h) a mediodía y lluvia de 24 h (mm)."""
    out = []
    for x in dias:
        mes = int(x["t"][5:7])
        f0 = ffmc(x["T"], x["H"], x["W"], x["r"], f0)
        p0 = dmc(x["T"], x["H"], x["r"], p0, mes, lat)
        d0 = dc(x["T"], x["r"], d0, mes, lat)
        i = isi(x["W"], f0); u = bui(p0, d0)
        out.append({"t": x["t"], "ffmc": round(f0, 1), "dmc": round(p0, 1), "dc": round(d0, 1),
                    "isi": round(i, 1), "bui": round(u, 1), "fwi": round(fwi(i, u), 1)})
    return out

def clase(v):  # umbrales EFFIS/GWIS
    return "muy_bajo" if v < 5.2 else "bajo" if v < 11.2 else "moderado" if v < 21.3 else "alto" if v < 38 else "muy_alto" if v < 50 else "extremo"
