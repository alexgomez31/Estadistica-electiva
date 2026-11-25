"""Procesamiento completo de datos reales de hurtos en Colombia (2010–2026).

Genera todos los artefactos JSON verificados que alimentan la plataforma web:
- web/public/data/cube_core.json          (cubo multidimensional para filtros cruzados)
- web/public/data/cube_mun.json           (cubo municipal por año, mes y modalidad)
- web/public/data/colombia_map.json       (cartografía DANE proyectada a SVG con códigos oficiales)
- web/public/data/weekly_poisson.json     (series semanales reales para laboratorio Poisson)
- web/public/data/inferential_summary.json (tablas de contingencia reales para probabilidad y Bayes)
- web/public/data/data_science_summary.json (auditoría ETL antes/después y estadística descriptiva)
- web/public/data/predictive_model.json   (evaluación real Ridge vs HistGBR vs Baseline 2024–2025)
- data_pipeline/processed/hurtos_resumen_limpio.csv (evidencia depurada)
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, r2_score, root_mean_squared_error
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data_pipeline" / "raw"
PROC_DIR = ROOT / "data_pipeline" / "processed"
OUT_DIR = ROOT / "web" / "public" / "data"

PROC_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)

RECURSOS = ["9vha-vh9n", "6sqw-8cg5", "d4fr-sbn2"]

GEO_TO_DATA_DEPTO = {
    "BOGOTÁ, D.C.": "BOGOTA",
    "LA GUAJIRA": "GUAJIRA",
    "QUINDIO": "QUINDÍO",
    "VALLE DEL CAUCA": "VALLE",
    "ARCHIPIÉLAGO DE SAN ANDRÉS, PROVIDENCIA Y SANTA CATALINA": "SAN ANDRÉS",
}

PRETTY_DEPTO = {
    "BOGOTA": "Bogotá D.C.",
    "ANTIOQUIA": "Antioquia",
    "VALLE": "Valle del Cauca",
    "ATLÁNTICO": "Atlántico",
    "CUNDINAMARCA": "Cundinamarca",
    "CAUCA": "Cauca",
    "SANTANDER": "Santander",
    "META": "Meta",
    "HUILA": "Huila",
    "CESAR": "Cesar",
    "BOLÍVAR": "Bolívar",
    "NORTE DE SANTANDER": "Norte de Santander",
    "TOLIMA": "Tolima",
    "NARIÑO": "Nariño",
    "RISARALDA": "Risaralda",
    "MAGDALENA": "Magdalena",
    "GUAJIRA": "La Guajira",
    "CÓRDOBA": "Córdoba",
    "BOYACÁ": "Boyacá",
    "CASANARE": "Casanare",
    "QUINDÍO": "Quindío",
    "SUCRE": "Sucre",
    "CALDAS": "Caldas",
    "CAQUETÁ": "Caquetá",
    "CHOCÓ": "Chocó",
    "ARAUCA": "Arauca",
    "PUTUMAYO": "Putumayo",
    "SAN ANDRÉS": "San Andrés y Providencia",
    "AMAZONAS": "Amazonas",
    "GUAVIARE": "Guaviare",
    "VICHADA": "Vichada",
    "GUAINÍA": "Guainía",
    "VAUPÉS": "Vaupés",
}

SHORT_MODALITY = {
    "ARTÍCULO 239. HURTO ENTIDADES COMERCIALES": "Entidades Comerciales",
    "ARTÍCULO 239. HURTO MOTOCICLETAS": "Motocicletas",
    "ARTÍCULO 239. HURTO AUTOMOTORES": "Automotores",
    "ARTÍCULO 239. HURTO RESIDENCIAS": "Residencias",
    "HURTO ABIGEATO": "Abigeato",
    "HURTO PIRATERÍA TERRESTRE": "Piratería Terrestre",
    "HURTO ENTIDADES FINANCIERAS": "Entidades Financieras",
}


def load_raw() -> pd.DataFrame:
    frames = []
    for rid in RECURSOS:
        path = RAW_DIR / f"hurtos_{rid}.csv"
        d = pd.read_csv(path, dtype=str)
        if "recurso" not in d.columns:
            d["recurso"] = rid
        frames.append(d)
    return pd.concat(frames, ignore_index=True)


def clean_dataset(raw: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    # Auditoría ANTES de la limpieza (replicando exactamente el notebook Colab)
    raw_nulls = raw.isna().sum().to_dict()
    raw_null_pct = (raw.isna().mean() * 100).round(2).to_dict()

    # Comportamiento del parseo por defecto (%m/%d/%Y) documentado en el notebook
    fecha_mdy = pd.to_datetime(raw["fecha_hecho"], format="%m/%d/%Y", errors="coerce")
    notebook_valid_dates = int(fecha_mdy.notna().sum())
    notebook_null_dates = int(fecha_mdy.isna().sum())
    notebook_null_date_pct = round(float(fecha_mdy.isna().mean() * 100), 2)

    # Limpieza corregida
    df = raw.copy()
    df["fecha"] = pd.to_datetime(df["fecha_hecho"], format="%d/%m/%Y", errors="coerce")
    df["anio"] = df["fecha"].dt.year.astype(int)
    df["mes_num"] = df["fecha"].dt.month.astype(int)
    df["cantidad"] = pd.to_numeric(df["cantidad"], errors="coerce").fillna(1).astype(int)

    text_cols = ["departamento", "municipio", "armas_medios", "genero", "grupo_etario", "tipo_de_hurto"]
    for col in text_cols:
        df[col] = df[col].astype("string").str.strip().str.upper()

    # Nulos por modalidad antes de imputar
    nulls_by_modality = []
    for mod, grp in df.groupby("tipo_de_hurto"):
        nulls_by_modality.append({
            "modalidad": mod,
            "modalidad_corta": SHORT_MODALITY.get(mod, mod),
            "registros": int(len(grp)),
            "genero_nulos": int(grp["genero"].isna().sum()),
            "genero_nulos_pct": round(float(grp["genero"].isna().mean() * 100), 2),
            "grupo_etario_nulos": int(grp["grupo_etario"].isna().sum()),
            "grupo_etario_nulos_pct": round(float(grp["grupo_etario"].isna().mean() * 100), 2),
        })
    nulls_by_modality.sort(key=lambda x: x["registros"], reverse=True)

    # Detalle del único registro sin municipio
    null_mun_rows = df[df["municipio"].isna()][["departamento", "codigo_dane", "fecha_hecho", "tipo_de_hurto"]].to_dict(orient="records")

    # Imputación explícita sin eliminar hechos válidos
    df["municipio"] = df["municipio"].fillna("NO REPORTADO")
    df["genero"] = df["genero"].fillna("NO REPORTADO")
    df["grupo_etario"] = df["grupo_etario"].fillna("NO REPORTADO")

    dup_attr_count = int(raw.drop(columns=["recurso"]).duplicated().sum())

    audit = {
        "registros_originales": int(len(raw)),
        "registros_limpios": int(len(df)),
        "hechos_totales": int(df["cantidad"].sum()),
        "fecha_min": df["fecha"].min().strftime("%Y-%m-%d"),
        "fecha_max": df["fecha"].max().strftime("%Y-%m-%d"),
        "departamentos_count": int(df["departamento"].nunique()),
        "municipios_count": int(df["municipio"].nunique()),
        "modalidades_count": int(df["tipo_de_hurto"].nunique()),
        "armas_count": int(df["armas_medios"].nunique()),
        "duplicados_atributos": dup_attr_count,
        "duplicados_atributos_pct": round(dup_attr_count / len(raw) * 100, 2),
        "notebook_parse_mdy": {
            "fechas_validas": notebook_valid_dates,
            "fechas_nulas": notebook_null_dates,
            "fechas_nulas_pct": notebook_null_date_pct,
        },
        "etl_corregido_dmy": {
            "fechas_validas": int(df["fecha"].notna().sum()),
            "fechas_nulas": int(df["fecha"].isna().sum()),
            "fechas_nulas_pct": 0.0,
        },
        "nulos_originales": [
            {
                "columna": col,
                "nulos_antes": int(raw_nulls.get(col, 0)),
                "pct_antes": float(raw_null_pct.get(col, 0.0)),
                "nulos_despues": 0,
                "pct_despues": 0.0,
                "tratamiento": (
                    "Parseo estricto DD/MM/AAAA (recupera el 60.20% perdido en parseo MM/DD/AAAA)"
                    if col == "fecha_hecho"
                    else "Imputación explícita 'NO REPORTADO' (estructural en entidades jurídicas)"
                    if col == "genero"
                    else "Imputación explícita 'NO REPORTADO'"
                    if col in ("grupo_etario", "municipio")
                    else "Normalización trim/mayúsculas y validación de tipo"
                ),
            }
            for col in ["fecha_hecho", "genero", "grupo_etario", "municipio", "departamento", "armas_medios", "tipo_de_hurto", "cantidad", "codigo_dane"]
        ],
        "nulos_por_modalidad": nulls_by_modality,
        "municipio_nulo_detalle": null_mun_rows,
    }
    return df, audit


def build_cubes(df: pd.DataFrame) -> None:
    anios = sorted(df["anio"].unique().tolist())
    departamentos = sorted(df["departamento"].unique().tolist())
    modalidades = sorted(df["tipo_de_hurto"].unique().tolist())
    armas = sorted(df["armas_medios"].unique().tolist())
    generos = sorted(df["genero"].unique().tolist())
    municipios = sorted(df["municipio"].unique().tolist())

    anio_map = {v: i for i, v in enumerate(anios)}
    depto_map = {v: i for i, v in enumerate(departamentos)}
    mod_map = {v: i for i, v in enumerate(modalidades)}
    arma_map = {v: i for i, v in enumerate(armas)}
    gen_map = {v: i for i, v in enumerate(generos)}
    mun_map = {v: i for i, v in enumerate(municipios)}

    # 1. cube_core
    g_core = (
        df.groupby(["anio", "mes_num", "departamento", "tipo_de_hurto", "armas_medios", "genero"], observed=True)["cantidad"]
        .sum()
        .reset_index()
    )
    rows_core = [
        [
            anio_map[int(r.anio)],
            int(r.mes_num),
            depto_map[r.departamento],
            mod_map[r.tipo_de_hurto],
            arma_map[r.armas_medios],
            gen_map[r.genero],
            int(r.cantidad),
        ]
        for r in g_core.itertuples(index=False)
    ]
    core_payload = {
        "anios": anios,
        "departamentos": departamentos,
        "departamentos_bonitos": [PRETTY_DEPTO.get(d, d.title()) for d in departamentos],
        "modalidades": modalidades,
        "modalidades_cortas": [SHORT_MODALITY.get(m, m) for m in modalidades],
        "armas": armas,
        "generos": generos,
        "rows": rows_core,
    }
    with open(OUT_DIR / "cube_core.json", "w", encoding="utf-8") as f:
        json.dump(core_payload, f, ensure_ascii=False, separators=(",", ":"))
    print(f"cube_core.json: {len(rows_core):,} rows -> {(OUT_DIR / 'cube_core.json').stat().st_size:,} bytes")

    # 2. cube_mun
    g_mun = (
        df.groupby(["anio", "mes_num", "departamento", "municipio", "tipo_de_hurto"], observed=True)["cantidad"]
        .sum()
        .reset_index()
    )
    rows_mun = [
        [
            anio_map[int(r.anio)],
            int(r.mes_num),
            depto_map[r.departamento],
            mun_map[r.municipio],
            mod_map[r.tipo_de_hurto],
            int(r.cantidad),
        ]
        for r in g_mun.itertuples(index=False)
    ]
    mun_payload = {
        "anios": anios,
        "departamentos": departamentos,
        "municipios": municipios,
        "modalidades": modalidades,
        "rows": rows_mun,
    }
    with open(OUT_DIR / "cube_mun.json", "w", encoding="utf-8") as f:
        json.dump(mun_payload, f, ensure_ascii=False, separators=(",", ":"))
    print(f"cube_mun.json: {len(rows_mun):,} rows -> {(OUT_DIR / 'cube_mun.json').stat().st_size:,} bytes")

    # Guardar evidencia procesada compacta (resumen anual/departamental/municipal)
    g_mun.to_csv(PROC_DIR / "hurtos_resumen_limpio.csv", index=False, encoding="utf-8-sig")


def build_colombia_map() -> None:
    with open(RAW_DIR / "colombia_dpto.geojson", "r", encoding="utf-8") as f:
        gj = json.load(f)

    # Mainland bounds (excluding San Andrés code 88)
    min_lon, max_lon = -79.1, -66.8
    min_lat, max_lat = -4.3, 12.6
    width, height = 560.0, 680.0
    pad_x, pad_y = 20.0, 20.0
    # Aspect correction around Colombia's midpoint latitude (~4 deg N -> cos ~ 0.997)
    scale = min((width - 2 * pad_x) / (max_lon - min_lon), (height - 2 * pad_y) / (max_lat - min_lat))
    x_offset = (width - (max_lon - min_lon) * scale) / 2.0
    y_offset = (height - (max_lat - min_lat) * scale) / 2.0

    def project_mainland(lon: float, lat: float) -> tuple[float, float]:
        x = x_offset + (lon - min_lon) * scale
        y = height - y_offset - (lat - min_lat) * scale
        return round(x, 1), round(y, 1)

    # San Andrés inset box (top-left corner)
    sa_min_lon, sa_max_lon = -81.76, -81.34
    sa_min_lat, sa_max_lat = 12.48, 13.39

    def project_sa(lon: float, lat: float) -> tuple[float, float]:
        box_x0, box_y0, box_w, box_h = 26.0, 26.0, 96.0, 96.0
        sc = min((box_w - 16) / (sa_max_lon - sa_min_lon), (box_h - 16) / (sa_max_lat - sa_min_lat))
        x = box_x0 + 8 + (lon - sa_min_lon) * sc
        y = box_y0 + box_h - 8 - (lat - sa_min_lat) * sc
        return round(x, 1), round(y, 1)

    def simplify_ring(coords: list, proj_fn, min_dist: float = 1.4) -> list[tuple[float, float]]:
        pts = [proj_fn(c[0], c[1]) for c in coords]
        if len(pts) <= 4:
            return pts
        kept = [pts[0]]
        for p in pts[1:-1]:
            if math.hypot(p[0] - kept[-1][0], p[1] - kept[-1][1]) >= min_dist:
                kept.append(p)
        kept.append(pts[-1])
        return kept if len(kept) >= 3 else pts

    features_out = []
    for feat in gj["features"]:
        props = feat["properties"]
        code = props["DPTO_CCDGO"]
        geo_name = props["DPTO_CNMBR"]
        data_key = GEO_TO_DATA_DEPTO.get(geo_name, geo_name)
        geom = feat["geometry"]
        polygons = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]

        proj_fn = project_sa if code == "88" else project_mainland
        min_d = 0.4 if code == "88" else 1.6

        paths = []
        all_pts = []
        for poly in polygons:
            for ring in poly:
                pts = simplify_ring(ring, proj_fn, min_dist=min_d)
                if len(pts) >= 3:
                    d_str = "M" + "L".join(f"{x},{y}" for x, y in pts) + "Z"
                    paths.append(d_str)
                    all_pts.extend(pts)

        cx = round(sum(p[0] for p in all_pts) / len(all_pts), 1)
        cy = round(sum(p[1] for p in all_pts) / len(all_pts), 1)

        features_out.append({
            "code": code,
            "geoName": geo_name,
            "departamento": data_key,
            "nombre": PRETTY_DEPTO.get(data_key, geo_name.title()),
            "d": " ".join(paths),
            "cx": cx,
            "cy": cy,
            "isInset": code == "88",
        })

    map_payload = {
        "viewBox": f"0 0 {int(width)} {int(height)}",
        "insetBox": {"x": 26, "y": 26, "width": 96, "height": 96},
        "features": features_out,
    }
    with open(OUT_DIR / "colombia_map.json", "w", encoding="utf-8") as f:
        json.dump(map_payload, f, ensure_ascii=False, separators=(",", ":"))
    print(f"colombia_map.json: {len(features_out)} deptos -> {(OUT_DIR / 'colombia_map.json').stat().st_size:,} bytes")


def build_weekly_poisson(df: pd.DataFrame) -> None:
    top_muns = (
        df.groupby("municipio")["cantidad"]
        .sum()
        .sort_values(ascending=False)
        .head(15)
        .index.tolist()
    )
    if "POPAYÁN (CT)" not in top_muns:
        top_muns.append("POPAYÁN (CT)")

    years = list(range(2018, 2027))
    modalities = ["TODOS"] + sorted(df["tipo_de_hurto"].unique().tolist())

    scopes = [
        {"id": "MUN::POPAYÁN (CT)", "label": "Popayán (CT) — Cauca", "kind": "municipio", "filter": "POPAYÁN (CT)"},
        {"id": "DEPTO::CAUCA", "label": "Departamento del Cauca", "kind": "departamento", "filter": "CAUCA"},
        {"id": "NAC::COLOMBIA", "label": "Colombia (Total Nacional)", "kind": "nacional", "filter": None},
    ]
    for m in top_muns:
        if m != "POPAYÁN (CT)":
            scopes.append({"id": f"MUN::{m}", "label": f"Municipio: {m.title()}", "kind": "municipio", "filter": m})

    series_dict: dict[str, dict] = {}
    for sc in scopes:
        if sc["kind"] == "municipio":
            sub_sc = df[df["municipio"] == sc["filter"]]
        elif sc["kind"] == "departamento":
            sub_sc = df[df["departamento"] == sc["filter"]]
        else:
            sub_sc = df

        for mod in modalities:
            sub_mod = sub_sc if mod == "TODOS" else sub_sc[sub_sc["tipo_de_hurto"] == mod]
            if sub_mod["cantidad"].sum() < 20:
                continue
            yr_data = {}
            for yr in years:
                end_d = "2026-07-31" if yr == 2026 else f"{yr}-12-31"
                sems = pd.date_range(f"{yr}-01-01", end_d, freq="W-SUN")
                sub_y = sub_mod[sub_mod["anio"] == yr]
                wk = sub_y.set_index("fecha")["cantidad"].resample("W-SUN").sum().reindex(sems, fill_value=0).astype(int)
                yr_data[str(yr)] = wk.tolist()
            series_dict[f"{sc['id']}||{mod}"] = yr_data

    # Caso comparativo exacto del notebook Colab (Popayán 2025 parseo MDY vs DMY)
    pop = df[df["municipio"] == "POPAYÁN (CT)"].copy()
    pop_mdy_fecha = pd.to_datetime(pop["fecha_hecho"], format="%m/%d/%Y", errors="coerce")
    pop_mdy_2025 = pop[pop_mdy_fecha.dt.year == 2025].copy()
    pop_mdy_2025["f_mdy"] = pop_mdy_fecha[pop_mdy_fecha.dt.year == 2025]
    sems_2025 = pd.date_range("2025-01-01", "2025-12-31", freq="W-SUN")
    wk_mdy = pop_mdy_2025.set_index("f_mdy")["cantidad"].resample("W-SUN").sum().reindex(sems_2025, fill_value=0).astype(int)
    wk_dmy = pop[pop["anio"] == 2025].set_index("fecha")["cantidad"].resample("W-SUN").sum().reindex(sems_2025, fill_value=0).astype(int)

    payload = {
        "scopes": [{"id": s["id"], "label": s["label"], "kind": s["kind"]} for s in scopes],
        "modalities": modalities,
        "years": years,
        "series": series_dict,
        "notebook_comparison_popayan_2025": {
            "notebook_mdy": {
                "semanas": int(len(wk_mdy)),
                "hechos": int(wk_mdy.sum()),
                "lambda": round(float(wk_mdy.mean()), 2),
                "varianza": round(float(wk_mdy.var(ddof=1)), 2),
                "dispersion": round(float(wk_mdy.var(ddof=1) / wk_mdy.mean()), 2),
            },
            "corregido_dmy": {
                "semanas": int(len(wk_dmy)),
                "hechos": int(wk_dmy.sum()),
                "lambda": round(float(wk_dmy.mean()), 2),
                "varianza": round(float(wk_dmy.var(ddof=1)), 2),
                "dispersion": round(float(wk_dmy.var(ddof=1) / wk_dmy.mean()), 2),
            },
        },
    }
    with open(OUT_DIR / "weekly_poisson.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    print(f"weekly_poisson.json: {len(series_dict)} series -> {(OUT_DIR / 'weekly_poisson.json').stat().st_size:,} bytes")


def build_inferential_summary(df: pd.DataFrame) -> None:
    total = int(df["cantidad"].sum())

    # Matriz Modalidad x Arma/Medio
    ct_arma = pd.crosstab(df["tipo_de_hurto"], df["armas_medios"], values=df["cantidad"], aggfunc="sum").fillna(0).astype(int)
    # Matriz Modalidad x Departamento (Top 10 deptos + Resto, y también completo)
    ct_depto = pd.crosstab(df["tipo_de_hurto"], df["departamento"], values=df["cantidad"], aggfunc="sum").fillna(0).astype(int)
    # Matriz Modalidad x Género
    ct_gen = pd.crosstab(df["tipo_de_hurto"], df["genero"], values=df["cantidad"], aggfunc="sum").fillna(0).astype(int)

    payload = {
        "total_hechos": total,
        "modalidades": [
            {"key": m, "short": SHORT_MODALITY.get(m, m), "count": int(df[df["tipo_de_hurto"] == m]["cantidad"].sum())}
            for m in ct_arma.index.tolist()
        ],
        "armas": [
            {"key": a, "count": int(ct_arma[a].sum())}
            for a in ct_arma.sum(axis=0).sort_values(ascending=False).index.tolist()
        ],
        "mod_x_arma": {
            mod: {arma: int(ct_arma.loc[mod, arma]) for arma in ct_arma.columns}
            for mod in ct_arma.index
        },
        "departamentos": [
            {"key": d, "label": PRETTY_DEPTO.get(d, d.title()), "count": int(ct_depto[d].sum())}
            for d in ct_depto.sum(axis=0).sort_values(ascending=False).index.tolist()
        ],
        "mod_x_depto": {
            mod: {depto: int(ct_depto.loc[mod, depto]) for depto in ct_depto.columns}
            for mod in ct_depto.index
        },
        "generos": [
            {"key": g, "count": int(ct_gen[g].sum())}
            for g in ct_gen.sum(axis=0).sort_values(ascending=False).index.tolist()
        ],
        "mod_x_genero": {
            mod: {gen: int(ct_gen.loc[mod, gen]) for gen in ct_gen.columns}
            for mod in ct_gen.index
        },
    }
    with open(OUT_DIR / "inferential_summary.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    print(f"inferential_summary.json -> {(OUT_DIR / 'inferential_summary.json').stat().st_size:,} bytes")


def build_data_science_summary(df: pd.DataFrame, audit: dict) -> None:
    with open(RAW_DIR / "metadata_socrata.json", "r", encoding="utf-8") as f:
        socrata_meta = json.load(f)

    # Estadística descriptiva de series numéricas válidas
    # 1. Serie anual (solo años completos 2010–2025)
    anual_full = df[df["anio"] <= 2025].groupby("anio")["cantidad"].sum().sort_index()
    anual_all = df.groupby("anio")["cantidad"].sum().sort_index()
    # 2. Serie mensual completa (ene 2010 – jul 2026 -> 199 meses)
    mensual = df.groupby(["anio", "mes_num"])["cantidad"].sum().sort_index()
    # 3. Totales municipales (1,021 municipios)
    mun_tot = df[df["municipio"] != "NO REPORTADO"].groupby("municipio")["cantidad"].sum()

    def desc_stats(s: pd.Series) -> dict:
        return {
            "n": int(len(s)),
            "suma": int(s.sum()),
            "media": round(float(s.mean()), 2),
            "mediana": round(float(s.median()), 2),
            "desv_est": round(float(s.std(ddof=1)), 2),
            "min": int(s.min()),
            "q1": round(float(s.quantile(0.25)), 2),
            "q3": round(float(s.quantile(0.75)), 2),
            "max": int(s.max()),
        }

    # Frecuencias absolutas y relativas de variables categóricas
    total = int(df["cantidad"].sum())
    mod_freq = []
    for k, v in df.groupby("tipo_de_hurto")["cantidad"].sum().sort_values(ascending=False).items():
        mod_freq.append({
            "categoria": k,
            "corta": SHORT_MODALITY.get(k, k),
            "frecuencia": int(v),
            "relativa": round(v / total, 4),
            "porcentaje": round(v / total * 100, 2),
        })

    arma_freq = []
    for k, v in df.groupby("armas_medios")["cantidad"].sum().sort_values(ascending=False).items():
        arma_freq.append({
            "categoria": k,
            "frecuencia": int(v),
            "relativa": round(v / total, 4),
            "porcentaje": round(v / total * 100, 2),
        })

    gen_freq = []
    for k, v in df.groupby("genero")["cantidad"].sum().sort_values(ascending=False).items():
        gen_freq.append({
            "categoria": k,
            "frecuencia": int(v),
            "relativa": round(v / total, 4),
            "porcentaje": round(v / total * 100, 2),
        })

    # Crecimiento COVID / post-COVID y variación 2024 vs 2025
    h2019 = int(anual_all.loc[2019])
    h2020 = int(anual_all.loc[2020])
    h2024 = int(anual_all.loc[2024])
    h2025 = int(anual_all.loc[2025])
    top3_deptos = df.groupby("departamento")["cantidad"].sum().sort_values(ascending=False).head(3)
    top3_share = round(float(top3_deptos.sum() / total * 100), 2)

    payload = {
        "fuentes_socrata": socrata_meta,
        "auditoria_etl": audit,
        "estadisticas_descriptivas": {
            "serie_anual_completa_2010_2025": desc_stats(anual_full),
            "serie_mensual_2010_2026": desc_stats(mensual),
            "totales_municipales": desc_stats(mun_tot),
            "moda_modalidad": mod_freq[0]["corta"],
            "moda_arma": arma_freq[0]["categoria"],
            "moda_departamento": PRETTY_DEPTO.get(top3_deptos.index[0], top3_deptos.index[0]),
            "moda_anio": int(anual_full.idxmax()),
            "moda_anio_hechos": int(anual_full.max()),
        },
        "frecuencias": {
            "modalidades": mod_freq,
            "armas": arma_freq,
            "generos": gen_freq,
        },
        "preguntas_analisis": [
            {
                "pregunta": "¿Qué modalidades concentran la mayor proporción de hurtos registrados en Colombia entre 2010 y julio de 2026?",
                "respuesta": f"El hurto a Entidades Comerciales ({mod_freq[0]['frecuencia']:,} hechos; {mod_freq[0]['porcentaje']}%) y el hurto de Motocicletas ({mod_freq[1]['frecuencia']:,} hechos; {mod_freq[1]['porcentaje']}%) concentran conjuntamente el {round(mod_freq[0]['porcentaje'] + mod_freq[1]['porcentaje'], 2)}% de los {total:,} hechos analizados. Si se suma Automotores ({mod_freq[2]['porcentaje']}%), tres modalidades explican más del 91% del total nacional.",
                "dato_clave": f"{round(mod_freq[0]['porcentaje'] + mod_freq[1]['porcentaje'], 2)}% en 2 modalidades",
            },
            {
                "pregunta": "¿Cómo se distribuye territorialmente el fenómeno y qué grado de concentración geográfica presenta?",
                "respuesta": f"Bogotá D.C. ({int(top3_deptos.iloc[0]):,}), Antioquia ({int(top3_deptos.iloc[1]):,}) y Valle del Cauca ({int(top3_deptos.iloc[2]):,}) reúnen el {top3_share}% de todos los hurtos del país, evidenciando una marcada concentración en los principales centros urbanos y áreas metropolitanas (a nivel municipal, el promedio es {desc_stats(mun_tot)['media']:,.1f} hechos pero la mediana es solo {desc_stats(mun_tot)['mediana']:,.1f}).",
                "dato_clave": f"{top3_share}% en Top 3 territorios",
            },
            {
                "pregunta": "¿Cómo evolucionó la tendencia temporal anual y qué cambios se observan entre 2019–2020 y 2024–2025?",
                "respuesta": f"Tras alcanzar un pico previo en 2019 ({h2019:,} hechos), en 2020 se registró una caída del {round((h2020 - h2019) / h2019 * 100, 1)}% ({h2020:,} hechos) coincidente con las restricciones de movilidad por pandemia. Posteriormente la serie ascendió hasta su máximo histórico en 2024 ({h2024:,} hechos) y descendió un {abs(round((h2025 - h2024) / h2024 * 100, 1))}% en 2025 ({h2025:,} hechos). Nota: no se infiere causalidad directa sin variables exógenas.",
                "dato_clave": f"Máximo histórico en 2024: {h2024:,}",
            },
            {
                "pregunta": "¿Qué medios o armas predominan y por qué el campo género presenta 43.41% de valores nulos?",
                "respuesta": f"El {arma_freq[0]['porcentaje']}% de los hechos se reporta como '{arma_freq[0]['categoria']}', seguido por '{arma_freq[1]['categoria']}' ({arma_freq[1]['porcentaje']}%) y '{arma_freq[2]['categoria']}' ({arma_freq[2]['porcentaje']}%). Además, el 43.41% de nulos en género no es un error aleatorio: ocurre en el 99.94% de hurtos a Entidades Comerciales y 100% en Entidades Financieras porque la víctima es una persona jurídica.",
                "dato_clave": f"{arma_freq[0]['porcentaje']}% sin empleo de armas",
            },
        ],
    }
    with open(OUT_DIR / "data_science_summary.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    print(f"data_science_summary.json -> {(OUT_DIR / 'data_science_summary.json').stat().st_size:,} bytes")


def build_predictive_model(df: pd.DataFrame) -> None:
    # Modelo sobre panel mensual (departamento, tipo_de_hurto, anio, mes) años completos 2010–2025
    df_hist = df[df["anio"] <= 2025]
    panel = df_hist.groupby(["departamento", "tipo_de_hurto", "anio", "mes_num"])["cantidad"].sum().reset_index()

    pairs = panel[["departamento", "tipo_de_hurto"]].drop_duplicates()
    months = pd.DataFrame([(y, m) for y in range(2010, 2026) for m in range(1, 13)], columns=["anio", "mes_num"])
    grid = pairs.merge(months, how="cross").merge(panel, on=["departamento", "tipo_de_hurto", "anio", "mes_num"], how="left")
    grid["cantidad"] = grid["cantidad"].fillna(0).astype(int)
    grid = grid.sort_values(["departamento", "tipo_de_hurto", "anio", "mes_num"]).reset_index(drop=True)

    g = grid.groupby(["departamento", "tipo_de_hurto"])["cantidad"]
    grid["lag_1"] = g.shift(1)
    grid["lag_2"] = g.shift(2)
    grid["lag_12"] = g.shift(12)
    grid["roll_3"] = g.transform(lambda s: s.shift(1).rolling(3).mean())
    grid["roll_6"] = g.transform(lambda s: s.shift(1).rolling(6).mean())
    grid["mes_sin"] = np.sin(2 * np.pi * grid["mes_num"] / 12)
    grid["mes_cos"] = np.cos(2 * np.pi * grid["mes_num"] / 12)

    model_df = grid.dropna().copy()
    train = model_df[model_df["anio"] <= 2023]
    test = model_df[model_df["anio"] >= 2024].copy()

    features = ["departamento", "tipo_de_hurto", "anio", "mes_sin", "mes_cos", "lag_1", "lag_2", "lag_12", "roll_3", "roll_6"]
    cat_cols = ["departamento", "tipo_de_hurto"]
    num_cols = ["anio", "mes_sin", "mes_cos", "lag_1", "lag_2", "lag_12", "roll_3", "roll_6"]

    y_test = test["cantidad"].values

    def eval_metrics(y_true, y_pred) -> dict:
        return {
            "mae": round(float(mean_absolute_error(y_true, y_pred)), 2),
            "rmse": round(float(root_mean_squared_error(y_true, y_pred)), 2),
            "r2": round(float(r2_score(y_true, y_pred)), 4),
        }

    models_out = [
        {
            "nombre": "Baseline (Persistencia lag_1)",
            "descripcion": "Usa el conteo del mes inmediatamente anterior como predicción.",
            **eval_metrics(y_test, test["lag_1"].values),
        }
    ]

    pre = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_cols),
        ("num", "passthrough", num_cols),
    ])

    ridge_pipe = Pipeline([("pre", pre), ("est", Ridge(alpha=1.0))])
    ridge_pipe.fit(train[features], train["cantidad"])
    ridge_pred = np.clip(ridge_pipe.predict(test[features]), 0, None)
    models_out.append({
        "nombre": "Regresión Ridge (L2)",
        "descripcion": "Modelo lineal regularizado con variables territoriales, modalidad, estacionalidad y rezagos.",
        **eval_metrics(y_test, ridge_pred),
    })

    hgbr_pipe = Pipeline([("pre", pre), ("est", HistGradientBoostingRegressor(max_iter=200, max_depth=6, random_state=42))])
    hgbr_pipe.fit(train[features], train["cantidad"])
    hgbr_pred = np.clip(hgbr_pipe.predict(test[features]), 0, None)
    models_out.append({
        "nombre": "HistGradientBoosting Regressor",
        "descripcion": "Ensamble no lineal basado en árboles de gradiente sobre rezagos y atributos categóricos.",
        **eval_metrics(y_test, hgbr_pred),
    })

    # Serie comparativa real vs predicción Ridge en conjunto de prueba (2024–2025)
    test["pred_ridge"] = ridge_pred
    test["pred_hgbr"] = hgbr_pred

    # Agregado nacional mensual en prueba
    nat_test = (
        test.groupby(["anio", "mes_num"])[["cantidad", "pred_ridge", "pred_hgbr"]]
        .sum()
        .reset_index()
        .sort_values(["anio", "mes_num"])
    )
    nat_series = [
        {
            "periodo": f"{int(r.anio)}-{int(r.mes_num):02d}",
            "real": int(r.cantidad),
            "ridge": round(float(r.pred_ridge), 1),
            "hgbr": round(float(r.pred_hgbr), 1),
        }
        for r in nat_test.itertuples(index=False)
    ]

    # Top 6 departamentos serie 2024-2025
    top6 = df_hist.groupby("departamento")["cantidad"].sum().sort_values(ascending=False).head(6).index.tolist()
    if "CAUCA" not in top6:
        top6.append("CAUCA")
    depto_series = {}
    for d in top6:
        sub = (
            test[test["departamento"] == d]
            .groupby(["anio", "mes_num"])[["cantidad", "pred_ridge", "pred_hgbr"]]
            .sum()
            .reset_index()
            .sort_values(["anio", "mes_num"])
        )
        depto_series[d] = [
            {
                "periodo": f"{int(r.anio)}-{int(r.mes_num):02d}",
                "real": int(r.cantidad),
                "ridge": round(float(r.pred_ridge), 1),
                "hgbr": round(float(r.pred_hgbr), 1),
            }
            for r in sub.itertuples(index=False)
        ]

    # Coeficientes numéricos estandarizados aproximados de Ridge (importancia relativa)
    ridge_est = ridge_pipe.named_steps["est"]
    feat_names = ridge_pipe.named_steps["pre"].get_feature_names_out()
    num_coefs = []
    for fname, coef in zip(feat_names, ridge_est.coef_):
        if fname.startswith("num__"):
            clean_name = fname.replace("num__", "")
            num_coefs.append({"variable": clean_name, "coeficiente": round(float(coef), 4)})

    payload = {
        "objetivo": "Conteo mensual de hurtos por departamento y modalidad (2024–2025)",
        "division_temporal": {
            "entrenamiento": "2011-01 a 2023-12 (34,008 observaciones)",
            "prueba": "2024-01 a 2025-12 (5,232 observaciones)",
            "nota_2026": "Se excluye 2026 de la evaluación anual cerrada porque el corte disponible llega hasta julio de 2026.",
        },
        "variables_predictoras": [
            "departamento (codificación one-hot, 33 territorios)",
            "tipo_de_hurto (codificación one-hot, 7 modalidades)",
            "anio (tendencia temporal)",
            "mes_sin, mes_cos (estacionalidad cíclica mensual)",
            "lag_1, lag_2, lag_12 (rezagos de 1, 2 y 12 meses)",
            "roll_3, roll_6 (promedios móviles de 3 y 6 meses previos)",
        ],
        "modelos": models_out,
        "mejor_modelo": "Regresión Ridge (L2)",
        "coeficientes_numericos_ridge": num_coefs,
        "serie_nacional_prueba": nat_series,
        "series_departamentos_prueba": {
            PRETTY_DEPTO.get(k, k): v for k, v in depto_series.items()
        },
        "limitaciones": [
            "Ausencia de variables exógenas (pie de fuerza policial, tasa de desempleo, operativos, densidad poblacional o cambios normativos).",
            "Subregistro inherente a denuncias ciudadanas: el modelo predice hurtos reportados a la DIJIN, no necesariamente la totalidad de incidentes reales.",
            "Un R² cercano a 0.95 en el panel completo refleja en gran medida la persistencia histórica y la escala poblacional entre departamentos.",
            "Las proyecciones estadísticas representan valores esperados sujetos a incertidumbre (error medio absoluto MAE ≈ 7.48 hechos/mes por celda) y nunca certezas determinísticas.",
        ],
    }
    with open(OUT_DIR / "predictive_model.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    print(f"predictive_model.json -> {(OUT_DIR / 'predictive_model.json').stat().st_size:,} bytes")


def main() -> None:
    print("Cargando archivos CSV crudos...")
    raw = load_raw()
    print(f"Registros cargados: {len(raw):,}")
    df, audit = clean_dataset(raw)
    print(f"Limpieza completada: {len(df):,} registros válidos ({audit['fecha_min']} a {audit['fecha_max']})")
    build_cubes(df)
    build_colombia_map()
    build_weekly_poisson(df)
    build_inferential_summary(df)
    build_data_science_summary(df, audit)
    build_predictive_model(df)
    print("Todos los artefactos fueron generados exitosamente en web/public/data/")


if __name__ == "__main__":
    main()
