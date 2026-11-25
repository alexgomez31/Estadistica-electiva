# Observatorio Analítico de Hurtos en Colombia (2010 – julio 2026)

Plataforma web académica interdisciplinaria que integra las asignaturas **Electiva III – Introducción a la Ciencia de Datos** (Docente: Carlos E. Ruiz) y **Estadística Inferencial – Proyecto de Aula (Grupo 2: Distribución de Poisson)** de Ingeniería Informática en la **Institución Universitaria Colegio Mayor del Cauca**.

---

## 1. Arquitectura y Estructura del Proyecto

```text
dashboard_estadistiva_electiva3/
├── colab/
│   └── hurtos_colombia_poisson.ipynb     # Notebook original conservado intacto
├── guia electiva 3/                      # Guía oficial de Electiva III
├── guia estadistica/                     # Guía oficial de Estadística Inferencial
├── data_pipeline/
│   ├── fetch_all.py                      # Descarga reproducible desde API Socrata (1,354,442 filas)
│   ├── build_artifacts.py                # ETL corregido (DD/MM/AAAA), modelos y cubos JSON
│   ├── raw/                              # CSV crudos y GeoJSON DANE
│   └── processed/                        # hurtos_resumen_limpio.csv
└── web/                                  # Frontend React + TypeScript + Vite + Tailwind CSS + Recharts
    ├── public/data/                      # Artefactos JSON verificados (cubos, mapa, Poisson, Bayes, predictivo)
    └── src/
        ├── lib/
        │   ├── statistics.ts             # Motor matemático puro (Poisson, TLC, χ², Bayes, IC, prueba z)
        │   ├── statistics.test.ts        # Pruebas unitarias Vitest
        │   ├── cubeEngine.ts             # Motor OLAP para filtros cruzados dinámicos
        │   └── format.ts                 # Formateadores numéricos es-CO
        ├── components/                   # Layout lateral, Tarjetas KPI y Mapa de Colombia DANE SVG
        └── modules/                      # Inicio, Dashboard, Electiva III, Estadística Inferencial, Presentación
```

---

## 2. Fuentes de Datos Oficiales

Todos los indicadores, gráficos y cálculos estadísticos operan sobre los **1,354,442 registros reales** del conjunto *Reporte Hurto por Modalidades – Policía Nacional (DIJIN)* en [datos.gov.co](https://www.datos.gov.co):

- `9vha-vh9n`: Hurto Automotores (158,899) y Motocicletas (497,736) — **656,635** registros.
- `6sqw-8cg5`: Hurto Entidades Comerciales (583,312) y Residencias (70,072) — **653,384** registros.
- `d4fr-sbn2`: Hurto Abigeato (37,775), Piratería Terrestre (4,858) y Entidades Financieras (1,790) — **44,423** registros.

Cobertura temporal verificada tras corrección de formato de fecha (`%d/%m/%Y`): **01/01/2010 al 31/07/2026**.

---

## 3. Instalación y Ejecución Local

### Requisitos previos
- **Node.js** `>= 20` y **npm**
- **Python** `>= 3.10` con `pandas`, `numpy`, `scipy`, `requests`, `scikit-learn` (solo si desea regenerar el ETL desde la API)

### A. Ejecutar la Plataforma Web (los datos procesados ya están incluidos)

```bash
cd web
npm install
npm run dev
```

Luego abra en su navegador: `http://localhost:5173`

### B. Ejecutar Pruebas Unitarias y Compilación de Producción

```bash
cd web
npm test
npm run build
```

### C. Regenerar Datos Reales desde Datos Abiertos Colombia (Opcional)

```bash
python data_pipeline/fetch_all.py
python data_pipeline/build_artifacts.py
```

---

## 4. Módulos de la Plataforma

1. **Inicio – Visión General:** Contexto del problema, objetivos, fuentes oficiales y métricas globales.
2. **Dashboard – Análisis General de Hurtos:** 7 visualizaciones interactivas (incluyendo mapa geográfico DANE de los 33 territorios de Colombia), 5 tarjetas KPI, filtros cruzados en tiempo real y apartados de interpretación bajo cada gráfico.
3. **Electiva III – Ciencia de Datos:** Navegación en 5 etapas (comprensión, extracción Socrata, limpieza/auditoría ETL antes vs después, estadística descriptiva y modelo predictivo `Ridge` vs `HistGradientBoosting` vs `Baseline`).
4. **Estadística Inferencial (Grupo 2 – Poisson):** Experimento aleatorio, reglas de probabilidad interactivas, Teorema de Bayes con simulador y datos reales, laboratorio de Distribución de Poisson con series semanales reales y prueba $\chi^2$, Teorema del Límite Central ($S_m$) y profundización opcional (IC 95%, tamaño de muestra y contraste de hipótesis $z$).
5. **Presentación Académica Integrada:** 18 diapositivas interactivas con navegación por teclado, barra de progreso, gráficos reales embebidos y modo pantalla completa para sustentación (~15 minutos).
