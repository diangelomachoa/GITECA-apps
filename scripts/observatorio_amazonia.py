#!/usr/bin/env python3
"""Observatorio de amenazas de la Amazonía peruana – GITECA (fase 1).
- Ríos: caudal GloFAS vs. climatología 1991–2020 → creciente / vaciante, riesgo de inundación o sequía hidrológica.
- Lluvia: acumulado pronosticado 16 días y lluvia de los últimos 30 días.
- Incendios: focos de calor VIIRS (NASA FIRMS, 7 días) dentro del Perú e Índice Meteorológico de
  Incendios (FWI, sistema canadiense) para hoy y los próximos 7 días.
- Sequía meteorológica: lluvia de los últimos 30 y 90 días frente a 1991–2020 (percentiles).
Escribe docs/datos/observatorio.json. Solo biblioteca estándar de Python.
© 2026 Gino Machoa – GITECA Consulting E.I.R.L.
"""
import csv, io, json, os, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fwi as FWI
from datetime import date, datetime, timezone

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs", "datos")
SALIDA = os.path.join(BASE, "observatorio.json")
CLIMA = os.path.join(BASE, "rios_amazonicos_clima.json")
PERU = os.path.join(BASE, "peru.geojson")
CLIMA_LL = os.path.join(BASE, "lluvia_clima.json")

ESTACIONES = [  # celdas GloFAS (~5 km) verificadas sobre el cauce principal
    {"id": "iquitos", "rio": "Amazonas", "lugar": "Iquitos", "region": "Loreto", "lat": -3.725, "lon": -73.225},
    {"id": "nauta", "rio": "Marañón", "lugar": "Nauta", "region": "Loreto", "lat": -4.525, "lon": -73.625},
    {"id": "sanlorenzo", "rio": "Marañón", "lugar": "San Lorenzo", "region": "Loreto", "lat": -4.925, "lon": -76.425},
    {"id": "requena", "rio": "Ucayali", "lugar": "Requena", "region": "Loreto", "lat": -5.025, "lon": -73.875},
    {"id": "pucallpa", "rio": "Ucayali", "lugar": "Pucallpa", "region": "Ucayali", "lat": -8.375, "lon": -74.525},
    {"id": "atalaya", "rio": "Ucayali", "lugar": "Atalaya", "region": "Ucayali", "lat": -10.725, "lon": -73.775},
    {"id": "yurimaguas", "rio": "Huallaga", "lugar": "Yurimaguas", "region": "Loreto", "lat": -5.925, "lon": -76.125},
    {"id": "santaclotilde", "rio": "Napo", "lugar": "Santa Clotilde", "region": "Loreto", "lat": -2.575, "lon": -73.575},
    {"id": "elestrecho", "rio": "Putumayo", "lugar": "El Estrecho", "region": "Loreto", "lat": -2.425, "lon": -72.575},
    {"id": "ptomaldonado", "rio": "Madre de Dios", "lugar": "Puerto Maldonado", "region": "Madre de Dios", "lat": -12.575, "lon": -69.125},
]
CIUDADES = [  # puntos para el índice de peligro de incendio
    ("Iquitos", -3.75, -73.25), ("Yurimaguas", -5.90, -76.12), ("Tarapoto", -6.49, -76.37), ("Moyobamba", -6.03, -76.97),
    ("Pucallpa", -8.38, -74.55), ("Tingo María", -9.30, -76.00), ("Satipo", -11.25, -74.64), ("Atalaya", -10.73, -73.76),
    ("Quillabamba", -12.86, -72.69), ("Puerto Maldonado", -12.60, -69.19), ("Bagua", -5.64, -78.53), ("Oxapampa", -10.58, -75.40),
]
FIRMS = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_South_America_7d.csv"

def get(url, txt=False, intentos=3):
    for i in range(intentos):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "GITECA-observatorio/1.0"})
            with urllib.request.urlopen(req, timeout=120) as r:
                b = r.read()
                return b.decode("utf-8") if txt else json.loads(b)
        except urllib.error.HTTPError as e:
            espera = 65 if e.code == 429 else 10 * (i + 1)
            if i == intentos - 1: raise
            time.sleep(espera)
        except Exception:
            if i == intentos - 1: raise
            time.sleep(10 * (i + 1))

def lista(x): return x if isinstance(x, list) else [x]
def coords(pts): return ",".join(str(p[0]) for p in pts), ",".join(str(p[1]) for p in pts)

def pct(v, p):
    v = sorted(v); k = (len(v) - 1) * p / 100; f = int(k); c = min(f + 1, len(v) - 1)
    return v[f] + (v[c] - v[f]) * (k - f)

def climatologia(e):
    d = get(f"https://flood-api.open-meteo.com/v1/flood?latitude={e['lat']}&longitude={e['lon']}"
            "&daily=river_discharge&start_date=1991-01-01&end_date=2020-12-31&cell_selection=nearest")["daily"]
    por = {}
    for t, q in zip(d["time"], d["river_discharge"]):
        if q is None: continue
        por.setdefault(min(datetime.strptime(t, "%Y-%m-%d").timetuple().tm_yday, 365), []).append(q)
    res = {}
    for doy in range(1, 366):
        vals = []
        for k in range(-7, 8): vals += por.get((doy - 1 + k) % 365 + 1, [])
        res[str(doy)] = [round(pct(vals, p), 1) for p in (10, 25, 50, 75, 90)]
    return res

def estado(q, c):
    if q is None: return "sin_dato"
    p10, p25, p50, p75, p90 = c
    return "muy_bajo" if q < p10 else "bajo" if q < p25 else "normal" if q <= p75 else "alto" if q <= p90 else "muy_alto"

def dentro(lon, lat, anillo):
    r = False; j = len(anillo) - 1
    for i in range(len(anillo)):
        xi, yi = anillo[i]; xj, yj = anillo[j]
        if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi: r = not r
        j = i
    return r

def rios(salida):
    clima = json.load(open(CLIMA, encoding="utf-8")) if os.path.exists(CLIMA) else {}
    for e in ESTACIONES:
        if e["id"] not in clima:
            print("Climatología:", e["id"]); clima[e["id"]] = climatologia(e)
            json.dump(clima, open(CLIMA, "w", encoding="utf-8"), separators=(",", ":")); time.sleep(20)
    pts = [(e["lat"], e["lon"]) for e in ESTACIONES]; la, lo = coords(pts)
    fl = lista(get(f"https://flood-api.open-meteo.com/v1/flood?latitude={la}&longitude={lo}"
                   "&daily=river_discharge,river_discharge_median,river_discharge_p25,river_discharge_p75"
                   "&past_days=90&forecast_days=30&cell_selection=nearest"))
    time.sleep(3)
    try:
        ll = lista(get(f"https://api.open-meteo.com/v1/forecast?latitude={la}&longitude={lo}"
                       "&daily=precipitation_sum&past_days=30&forecast_days=16&timezone=America%2FLima"))
    except Exception as ex:
        print("Lluvia no disponible:", ex); ll = [None] * len(ESTACIONES)
    hoy = date.today().isoformat()
    for e, f, l in zip(ESTACIONES, fl, ll):
        f = f["daily"]; c = clima[e["id"]]; serie = []
        for i, t in enumerate(f["time"]):
            doy = str(min(datetime.strptime(t, "%Y-%m-%d").timetuple().tm_yday, 365))
            serie.append({"t": t, "q": f["river_discharge"][i], "med": f["river_discharge_median"][i],
                          "p25": f["river_discharge_p25"][i], "p75": f["river_discharge_p75"][i], "c": c[doy]})
        idx = next((i for i, s in enumerate(serie) if s["t"] == hoy), max(0, len(serie) - 31))
        q0 = serie[idx]["q"]; i14 = min(idx + 14, len(serie) - 1)
        q14 = serie[i14]["med"] or serie[i14]["q"]
        cambio = round((q14 - q0) / q0 * 100, 1) if q0 and q14 else 0
        tend = "creciente" if cambio > 5 else "vaciante" if cambio < -5 else "estable"
        if l:
            lt, lp = l["daily"]["time"], l["daily"]["precipitation_sum"]
            pasado = round(sum(x or 0 for t, x in zip(lt, lp) if t < hoy), 1)
            futuro = round(sum(x or 0 for t, x in zip(lt, lp) if t >= hoy), 1)
        else:
            pasado = futuro = None
        est = estado(q0, serie[idx]["c"])
        if est in ("alto", "muy_alto"):
            amenaza = "posible inundación" if tend != "vaciante" else "nivel alto, en descenso"
        elif est in ("bajo", "muy_bajo"):
            amenaza = "sequía hidrológica" if tend != "creciente" else "nivel bajo, en recuperación"
        else:
            amenaza = "sin alerta"
        salida["rios"].append({**e, "q_hoy": q0, "estado": est, "q_14d": q14, "cambio_14d_pct": cambio,
                               "tendencia": tend, "amenaza": amenaza, "lluvia_30d_mm": pasado,
                               "lluvia_16d_mm": futuro, "serie": serie})

def clima_lluvia(nom, lat, lon):
    d = get(f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}"
            "&start_date=1990-09-01&end_date=2020-12-31&daily=precipitation_sum&timezone=America%2FLima")["daily"]
    t, p = d["time"], [x or 0 for x in d["precipitation_sum"]]
    acc = [0]
    for x in p: acc.append(acc[-1] + x)
    por30, por90 = {}, {}
    for k in range(90, len(t)):
        if t[k] < "1991-01-01": continue
        doy = min(datetime.strptime(t[k], "%Y-%m-%d").timetuple().tm_yday, 365)
        por30.setdefault(doy, []).append(acc[k + 1] - acc[k - 29])
        por90.setdefault(doy, []).append(acc[k + 1] - acc[k - 89])
    res = {}
    for doy in range(1, 366):
        a, b = [], []
        for kk in range(-3, 4):
            dd = (doy - 1 + kk) % 365 + 1; a += por30.get(dd, []); b += por90.get(dd, [])
        res[str(doy)] = {"d30": [round(pct(a, q), 1) for q in (10, 25, 50, 75, 90)],
                         "d90": [round(pct(b, q), 1) for q in (10, 25, 50, 75, 90)]}
    return res

def clase_seq(v, c):
    p10, p25, p50, p75, p90 = c
    return "severa" if v < p10 else "moderada" if v < p25 else "normal" if v <= p75 else "humedo" if v <= p90 else "muy_humedo"

def puntos(salida):
    """FWI (incendios) y sequía meteorológica para las ciudades amazónicas."""
    clima = json.load(open(CLIMA_LL, encoding="utf-8")) if os.path.exists(CLIMA_LL) else {}
    for nom, lat, lon in CIUDADES:
        if nom not in clima:
            try:
                print("Climatología de lluvia:", nom); clima[nom] = clima_lluvia(nom, lat, lon)
                json.dump(clima, open(CLIMA_LL, "w", encoding="utf-8"), separators=(",", ":")); time.sleep(20)
            except Exception as ex:
                print("Sin climatología para", nom, ex); break
    la, lo = coords([(c[1], c[2]) for c in CIUDADES])
    d = lista(get(f"https://api.open-meteo.com/v1/forecast?latitude={la}&longitude={lo}"
                  "&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation"
                  "&past_days=92&forecast_days=7&timezone=America%2FLima"))
    hoy = date.today().isoformat()
    for (nom, lat, lon), r in zip(CIUDADES, d):
        h = r["hourly"]; dias = []; diario = {}
        for k, t in enumerate(h["time"]):
            diario[t[:10]] = diario.get(t[:10], 0) + (h["precipitation"][k] or 0)
            if t.endswith("T12:00"):
                lluvia24 = sum(x or 0 for x in h["precipitation"][max(0, k - 23):k + 1])
                dias.append({"t": t[:10], "T": h["temperature_2m"][k], "H": h["relative_humidity_2m"][k],
                             "W": h["wind_speed_10m"][k], "r": lluvia24})
        ser = FWI.serie(dias, lat)
        prox = [x for x in ser if x["t"] >= hoy][:8]
        for x in prox: x["clase"] = FWI.clase(x["fwi"])
        hoyx = prox[0] if prox else ser[-1]
        peor = max(prox, key=lambda x: x["fwi"]) if prox else hoyx
        salida["incendio_peligro"].append({"lugar": nom, "lat": lat, "lon": lon, "hoy": hoyx, "peor": peor, "dias": prox})
        obs = [(t, v) for t, v in sorted(diario.items()) if t < hoy]
        l30 = round(sum(v for _, v in obs[-30:]), 1); l90 = round(sum(v for _, v in obs[-90:]), 1)
        item = {"lugar": nom, "lat": lat, "lon": lon, "lluvia_30d": l30, "lluvia_90d": l90}
        if nom in clima:
            doy = str(min(date.today().timetuple().tm_yday, 365)); c = clima[nom][doy]
            item.update({"normal_30d": c["d30"][2], "normal_90d": c["d90"][2],
                         "pct_30d": round(100 * l30 / c["d30"][2]) if c["d30"][2] else None,
                         "pct_90d": round(100 * l90 / c["d90"][2]) if c["d90"][2] else None,
                         "clase_30d": clase_seq(l30, c["d30"]), "clase_90d": clase_seq(l90, c["d90"])})
        salida["sequia"].append(item)

def focos(salida):
    g = json.load(open(PERU, encoding="utf-8"))["geometry"]
    anillos = [g["coordinates"][0]] if g["type"] == "Polygon" else [p[0] for p in g["coordinates"]]
    try:
        txt = get(FIRMS, txt=True)
    except Exception as e:
        salida["focos"] = {"error": f"FIRMS no disponible: {e}"}; return
    pts = []; n24 = 0
    for f in csv.DictReader(io.StringIO(txt)):
        lat, lon = float(f["latitude"]), float(f["longitude"])
        if not (-18.5 < lat < 0.2 and -81.5 < lon < -68.5): continue
        if not any(dentro(lon, lat, a) for a in anillos): continue
        if f.get("confidence", "n") == "l": continue  # descarta baja confianza
        p = [round(lon, 4), round(lat, 4), f["acq_date"], f.get("frp", ""), f.get("daynight", "")]
        pts.append(p)
    if pts:
        ult = max(p[2] for p in pts); n24 = sum(1 for p in pts if p[2] == ult)
    por_dia = {}
    for p in pts: por_dia[p[2]] = por_dia.get(p[2], 0) + 1
    salida["focos"] = {"total_7d": len(pts), "ultimo_dia": max(por_dia) if por_dia else None,
                       "n_ultimo_dia": n24, "por_dia": dict(sorted(por_dia.items())), "puntos": pts,
                       "satelite": "NOAA-20 VIIRS 375 m (confianza nominal y alta)"}

def main():
    os.makedirs(BASE, exist_ok=True)
    salida = {"actualizado": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
              "rios": [], "incendio_peligro": [], "sequia": [], "focos": {}}
    for nombre, fn in (("rios", rios), ("puntos", puntos), ("focos", focos)):
        try:
            fn(salida); print("OK", nombre)
        except Exception as ex:
            print("Error en", nombre, ex); salida.setdefault("errores", {})[nombre] = str(ex)
        time.sleep(3)
    json.dump(salida, open(SALIDA, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("Listo", SALIDA)

if __name__ == "__main__":
    main()
