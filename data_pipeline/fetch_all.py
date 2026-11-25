"""Descarga reproducible de los 3 recursos oficiales de Datos Abiertos Colombia.

Conserva la lógica del notebook `colab/hurtos_colombia_poisson.ipynb` (paginación estable
por `:id`, bloques de 50,000 registros), usando descarga CSV y reintentos automáticos.
"""

from __future__ import annotations

import concurrent.futures
import io
import json
import os
import time
from pathlib import Path

import pandas as pd
import requests

BASE = "https://www.datos.gov.co"
PAGINA = 50_000
HEADERS = {"User-Agent": "Mozilla/5.0 (proyecto-academico-unimayor; Python)"}

RECURSOS = {
    "9vha-vh9n": "Hurto automotores y motocicletas",
    "6sqw-8cg5": "Hurto entidades comerciales y residencias",
    "d4fr-sbn2": "Hurto abigeato, entidades financieras y piratería terrestre",
}

RAW_DIR = Path(__file__).resolve().parent / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)


def get_with_retries(url: str, params: dict | None = None, intentos: int = 5) -> requests.Response:
    ultimo = None
    for i in range(intentos):
        try:
            r = requests.get(url, params=params, headers=HEADERS, timeout=120)
            if r.status_code == 200:
                return r
            ultimo = f"HTTP {r.status_code}"
        except requests.RequestException as exc:
            ultimo = str(exc)
        time.sleep(1.5 * (i + 1))
    raise RuntimeError(f"Error consultando {url}: {ultimo}")


def fetch_metadata(rid: str) -> dict:
    meta = get_with_retries(f"{BASE}/api/views/{rid}.json").json()
    total = int(get_with_retries(f"{BASE}/resource/{rid}.json", {"$select": "count(*)"}).json()[0]["count"])
    return {
        "recurso": rid,
        "descripcion_corta": RECURSOS[rid],
        "nombre": meta.get("name"),
        "atribucion": meta.get("attribution"),
        "descripcion": meta.get("description"),
        "rowsUpdatedAt": meta.get("rowsUpdatedAt"),
        "filas": total,
        "columnas": [c["fieldName"] for c in meta.get("columns", []) if not c["fieldName"].startswith(":")],
    }


def fetch_page(rid: str, offset: int) -> tuple[int, pd.DataFrame]:
    params = {"$limit": PAGINA, "$offset": offset, "$order": ":id"}
    r = get_with_retries(f"{BASE}/resource/{rid}.csv", params=params)
    df_page = pd.read_csv(io.BytesIO(r.content), dtype=str)
    return offset, df_page


def download_resource(rid: str, total: int) -> Path:
    out_path = RAW_DIR / f"hurtos_{rid}.csv"
    if out_path.exists():
        existing_rows = sum(1 for _ in open(out_path, encoding="utf-8-sig")) - 1
        if existing_rows == total:
            print(f"[{rid}] Ya descargado completo ({existing_rows:,} filas).")
            return out_path

    offsets = list(range(0, total, PAGINA))
    print(f"[{rid}] Descargando {total:,} filas en {len(offsets)} páginas...")
    results: dict[int, pd.DataFrame] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futs = {pool.submit(fetch_page, rid, off): off for off in offsets}
        for fut in concurrent.futures.as_completed(futs):
            off, df_page = fut.result()
            results[off] = df_page
            print(f"  [{rid}] página offset={off:,} -> {len(df_page):,} filas")

    ordered = [results[off] for off in sorted(results)]
    df_all = pd.concat(ordered, ignore_index=True)
    df_all["recurso"] = rid
    df_all.to_csv(out_path, index=False, encoding="utf-8-sig")
    print(f"[{rid}] Guardado en {out_path} ({len(df_all):,} filas)")
    return out_path


def main() -> None:
    t0 = time.time()
    metas = []
    for rid in RECURSOS:
        m = fetch_metadata(rid)
        metas.append(m)
        print(f"Recurso {rid}: {m['filas']:,} filas | cols={m['columnas']}")

    with open(RAW_DIR / "metadata_socrata.json", "w", encoding="utf-8") as f:
        json.dump(metas, f, ensure_ascii=False, indent=2)

    for m in metas:
        download_resource(m["recurso"], m["filas"])

    print(f"Descarga completada en {time.time() - t0:.1f}s")


if __name__ == "__main__":
    main()
