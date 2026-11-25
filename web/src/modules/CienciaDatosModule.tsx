import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  FileSearch,
  GitBranch,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AllPlatformData } from '../types/analytics';
import { formatDec, formatInt, formatPct } from '../lib/format';

interface CienciaDatosModuleProps {
  data: AllPlatformData;
}

type StageId = 'comprension' | 'extraccion' | 'limpieza' | 'descriptivo' | 'predictivo';

const STAGES: { id: StageId; num: string; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'comprension', num: '01', label: 'Comprensión y Datos', icon: FileSearch },
  { id: 'extraccion', num: '02', label: 'Extracción API', icon: Database },
  { id: 'limpieza', num: '03', label: 'Limpieza y ETL', icon: Sparkles },
  { id: 'descriptivo', num: '04', label: 'Análisis Descriptivo', icon: BarChart2 },
  { id: 'predictivo', num: '05', label: 'Modelo Predictivo', icon: Cpu },
];

export const CienciaDatosModule: React.FC<CienciaDatosModuleProps> = ({ data }) => {
  const [stage, setStage] = useState<StageId>('comprension');
  const [selectedPredDepto, setSelectedPredDepto] = useState<string>('Nacional');

  const { dataScience, predictive } = data;
  const { auditoria_etl, fuentes_socrata, estadisticas_descriptivas, frecuencias, preguntas_analisis } =
    dataScience;

  const predSeries =
    selectedPredDepto === 'Nacional'
      ? predictive.serie_nacional_prueba
      : predictive.series_departamentos_prueba[selectedPredDepto] ?? predictive.serie_nacional_prueba;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Electiva III · Introducción a la Ciencia de Datos (Docente: Carlos E. Ruiz)
            </span>
            <h2 className="text-2xl font-bold text-[#0f294a] mt-1">
              Pipeline Integral de Ciencia de Datos
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Documentación técnica reproducible desde la ingesta Socrata hasta la modelación
              predictiva sobre {formatInt(auditoria_etl.hechos_totales)} hechos reales.
            </p>
          </div>
          <div className="text-xs font-mono bg-slate-100 px-3.5 py-2 rounded-xl text-slate-700 shrink-0">
            colab/hurtos_colombia_poisson.ipynb
          </div>
        </div>

        {/* Navegación interna por etapas */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {STAGES.map((st) => {
            const Icon = st.icon;
            const active = st.id === stage;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setStage(st.id)}
                className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-[#0f294a] text-white border-[#0f294a] shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50/60 hover:border-blue-200'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-sky-300' : 'text-blue-600'}`} />
                <div className="min-w-0">
                  <p className={`text-[10px] font-mono ${active ? 'text-sky-300' : 'text-slate-400'}`}>
                    ETAPA {st.num}
                  </p>
                  <p className="text-xs font-semibold truncate">{st.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ETAPA 1: Comprensión y Selección */}
      {stage === 'comprension' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
              <p className="text-xs font-bold uppercase text-blue-700">Problemática Seleccionada</p>
              <h3 className="text-base font-bold text-[#0f294a]">
                Comportamiento de las Modalidades de Hurto en Colombia
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                El hurto afecta de forma heterogénea al comercio, la movilidad (motocicletas y
                automotores), los hogares y el sector agropecuario. Se requiere una base unificada
                para caracterizar su distribución real sin sesgos de agregación.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
              <p className="text-xs font-bold uppercase text-sky-700">Pregunta Principal</p>
              <h3 className="text-base font-bold text-[#0f294a]">
                ¿Cómo varían las modalidades, medios y concentración territorial del hurto en Colombia?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Evaluar su evolución temporal (2010–2026), identificar los departamentos y municipios
                de mayor incidencia y modelar su tasa de ocurrencia semanal.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
              <p className="text-xs font-bold uppercase text-emerald-700">Objetivo del Análisis</p>
              <h3 className="text-base font-bold text-[#0f294a]">
                Convertir registros públicos en indicadores reproducibles
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Integrar los tres recursos oficiales de la DIJIN, auditar su calidad, generar
                estadísticas descriptivas confiables y validar un modelo predictivo exploratorio.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#0f294a]">
              Descripción de los Conjuntos de Datos y Variables Disponibles
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-4 font-semibold">Recurso</th>
                    <th className="py-2 pr-4 font-semibold">Alcance</th>
                    <th className="py-2 pr-4 font-semibold text-right">Filas</th>
                    <th className="py-2 font-semibold">Variables (9 columnas originales)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fuentes_socrata.map((s) => (
                    <tr key={s.recurso}>
                      <td className="py-3 pr-4 font-mono font-semibold text-blue-700">
                        {s.recurso}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{s.descripcion_corta}</td>
                      <td className="py-3 pr-4 text-right font-mono font-semibold tabular-nums">
                        {formatInt(s.filas)}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {s.columnas.map((c) => (
                            <span
                              key={c}
                              className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-mono text-slate-700"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1.5">
              <p className="text-xs font-bold uppercase text-amber-800">
                Limitaciones Identificadas en la Fuente
              </p>
              <ul className="text-xs sm:text-sm text-amber-900 list-disc pl-5 space-y-1">
                <li>
                  No existen datos personales sensibles (sin nombres ni documentos de identidad); cada
                  fila representa un hecho reportado (<code className="font-mono">cantidad = 1</code>).
                </li>
                <li>
                  La fecha límite de los hechos disponibles es{' '}
                  <strong>{auditoria_etl.fecha_max}</strong> (2026 es un año parcial de enero a
                  julio).
                </li>
                <li>
                  El campo <code className="font-mono">genero</code> es estructuralmente nulo en
                  delitos contra personas jurídicas (99.94% en Entidades Comerciales y 100% en
                  Entidades Financieras).
                </li>
                <li>
                  Refleja denuncias validadas con la Fiscalía General de la Nación; no mide el
                  subregistro de hechos no denunciados.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 2: Extracción */}
      {stage === 'extraccion' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-[#0f294a]">
              Diagrama del Flujo de Extracción vía API Socrata (datos.gov.co)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
              {[
                {
                  title: '1. Metadatos',
                  sub: 'GET /api/views/{id}.json',
                  desc: 'Detecta esquema, fecha de corte y columnas activas',
                },
                {
                  title: '2. Conteo',
                  sub: '$select=count(*)',
                  desc: 'Consulta volumen exacto por recurso (1.35M filas)',
                },
                {
                  title: '3. Paginación',
                  sub: '$limit=50000 &$order=:id',
                  desc: 'Descarga ordenada estable con reintentos HTTP',
                },
                {
                  title: '4. Consolidación',
                  sub: 'pd.concat + recurso',
                  desc: 'Une 9vha-vh9n, 6sqw-8cg5 y d4fr-sbn2 sin traslapes',
                },
                {
                  title: '5. Persistencia',
                  sub: 'CSV / Parquet / JSON',
                  desc: 'Genera cubos verificados para análisis y web',
                },
              ].map((step, i) => (
                <div key={step.title} className="flex items-center gap-2">
                  <div className="flex-1 p-4 rounded-xl bg-slate-50 border border-slate-200 h-full">
                    <p className="text-xs font-bold text-[#0f294a]">{step.title}</p>
                    <p className="text-[11px] font-mono text-blue-700 mt-1 break-all">{step.sub}</p>
                    <p className="text-xs text-slate-600 mt-1.5">{step.desc}</p>
                  </div>
                  {i < 4 && <ArrowRight className="hidden md:block w-4 h-4 text-slate-400 shrink-0" />}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-blue-700" />
                  <h4 className="text-sm font-bold text-[#0f294a]">
                    Endpoints Socrata Utilizados
                  </h4>
                </div>
                <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono space-y-2 overflow-x-auto">
                  <p className="text-sky-300"># Base API Datos Abiertos Colombia</p>
                  <p>https://www.datos.gov.co/resource/9vha-vh9n.json (656,635 filas)</p>
                  <p>https://www.datos.gov.co/resource/6sqw-8cg5.json (653,384 filas)</p>
                  <p>https://www.datos.gov.co/resource/d4fr-sbn2.json (44,423 filas)</p>
                  <p className="text-emerald-300 pt-1">
                    # Total consolidado: 1,354,442 registros (0 traslapes entre recursos)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-sm font-bold text-[#0f294a]">
                    Procedimiento Reproducible del Notebook
                  </h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  En <code className="text-xs bg-slate-100 px-1 rounded">colab/hurtos_colombia_poisson.ipynb</code>{' '}
                  se implementó la función <code className="text-xs bg-slate-100 px-1 rounded">descargar_recurso(rid)</code>{' '}
                  con ordenamiento determinístico por identificador interno (<code className="text-xs">$order=:id</code>),
                  bloques de 50,000 filas, pausa de cortesía de 0.4s y hasta 5 reintentos con
                  backoff incremental ante errores de red.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 3: Limpieza y ETL */}
      {stage === 'limpieza' && (
        <div className="space-y-6">
          {/* Diagrama ETL */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#0f294a]">
              Flujo del Proceso ETL Aplicado
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {[
                ['1. Extracción', 'API Socrata (3 IDs)'],
                ['2. Transformación', 'DD/MM/AAAA + texto'],
                ['3. Limpieza', 'Imputación explícita'],
                ['4. Validación', 'Consistencia DANE/sumas'],
                ['5. Almacenamiento', 'CSV limpio y cubos JSON'],
                ['6. Análisis', 'Descriptivo + Poisson'],
              ].map(([t, s]) => (
                <div
                  key={t}
                  className="p-3.5 rounded-xl bg-gradient-to-b from-blue-50/70 to-white border border-blue-100 text-center"
                >
                  <p className="text-xs font-bold text-[#0f294a]">{t}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hallazgo crítico de auditoría: Notebook MDY vs Corregido DMY */}
          <div className="bg-white rounded-2xl border border-orange-200 p-6 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0f294a]">
                  Mejora Documentada al ETL del Notebook: Corrección del Formato de Fecha
                </h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Al auditar la Celda 12 de{' '}
                  <code className="text-xs bg-slate-100 px-1 rounded">hurtos_colombia_poisson.ipynb</code>,
                  se identificó que <code className="text-xs bg-slate-100 px-1 rounded">pd.to_datetime(df[COL_FECHA], errors="coerce")</code>{' '}
                  interpretó las fechas colombianas (<code className="text-xs">DD/MM/YYYY</code>) bajo el
                  formato estadounidense (<code className="text-xs">MM/DD/YYYY</code>). Eso convirtió
                  en <code className="text-xs">NaT</code> todos los días del 13 al 31 de cada mes (
                  <strong>{formatPct(auditoria_etl.notebook_parse_mdy.fechas_nulas_pct)}</strong> de
                  registros perdidos ={' '}
                  {formatInt(auditoria_etl.notebook_parse_mdy.fechas_nulas)} filas) e invirtió día y
                  mes en los primeros 12 días. Al especificar{' '}
                  <code className="text-xs bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                    format="%d/%m/%Y"
                  </code>
                  , se recuperó el <strong>100.00%</strong> de las fechas reales.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        etapa: 'Fechas Válidas',
                        Antes_Notebook: auditoria_etl.notebook_parse_mdy.fechas_validas,
                        Despues_Corregido: auditoria_etl.etl_corregido_dmy.fechas_validas,
                      },
                      {
                        etapa: 'Fechas Nulas (NaT)',
                        Antes_Notebook: auditoria_etl.notebook_parse_mdy.fechas_nulas,
                        Despues_Corregido: auditoria_etl.etl_corregido_dmy.fechas_nulas,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="etapa" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => formatInt(v)} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatInt(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Antes_Notebook" name="Notebook original (MM/DD)" fill="#f97316" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Despues_Corregido" name="ETL corregido (DD/MM)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3 content-center">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500">Registros originales</p>
                  <p className="text-xl font-bold text-[#0f294a] tabular-nums mt-1">
                    {formatInt(auditoria_etl.registros_originales)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-xs text-emerald-700">Registros conservados</p>
                  <p className="text-xl font-bold text-emerald-800 tabular-nums mt-1">
                    {formatInt(auditoria_etl.registros_limpios)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 col-span-2">
                  <p className="text-xs font-bold text-[#0f294a]">
                    ¿Por qué NO se eliminaron {formatInt(auditoria_etl.duplicados_atributos)} filas
                    con atributos repetidos ({formatPct(auditoria_etl.duplicados_atributos_pct)})?
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Cada fila tiene <code className="font-mono">cantidad = 1</code> sin ID de
                    denuncia único: dos hurtos de motocicleta en Bogotá el mismo día con atributos
                    similares son hechos distintos. Eliminarlos subestimaría en 35% la realidad.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla completa de nulos antes vs después y nulos estructurales */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-[#0f294a]">
                Auditoría de Nulos por Variable (Antes vs Después)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-3 font-semibold">Columna</th>
                      <th className="py-2 pr-3 font-semibold text-right">Nulos Crudos</th>
                      <th className="py-2 pr-3 font-semibold text-right">Después ETL</th>
                      <th className="py-2 font-semibold">Decisión Técnica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditoria_etl.nulos_originales.map((n) => (
                      <tr key={n.columna}>
                        <td className="py-2.5 pr-3 font-mono font-semibold text-[#0f294a]">
                          {n.columna}
                        </td>
                        <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                          {formatInt(n.nulos_antes)} ({formatPct(n.pct_antes)})
                        </td>
                        <td className="py-2.5 pr-3 text-right font-mono text-emerald-700 font-semibold">
                          {n.nulos_despues} (0%)
                        </td>
                        <td className="py-2.5 text-slate-600">{n.tratamiento}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-[#0f294a]">
                Explicación del 43.41% Nulo en Género
              </h3>
              <p className="text-xs text-slate-600">
                Los nulos en <code className="font-mono">genero</code> no son aleatorios; responden
                a la naturaleza jurídica de la víctima en hurtos a comercios y bancos:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-2 font-semibold">Modalidad</th>
                      <th className="py-2 pr-2 font-semibold text-right">% Nulo Género</th>
                      <th className="py-2 font-semibold text-right">% Nulo Edad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditoria_etl.nulos_por_modalidad.map((m) => (
                      <tr key={m.modalidad}>
                        <td className="py-2 pr-2 font-medium text-slate-800">{m.modalidad_corta}</td>
                        <td className="py-2 pr-2 text-right font-mono tabular-nums">
                          {formatPct(m.genero_nulos_pct)}
                        </td>
                        <td className="py-2 text-right font-mono tabular-nums">
                          {formatPct(m.grupo_etario_nulos_pct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Único registro sin municipio: departamento NARIÑO, código DANE{' '}
                <code className="font-mono">52000000</code> (genérico departamental), imputado como{' '}
                <code className="font-mono">NO REPORTADO</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 4: Análisis Descriptivo */}
      {stage === 'descriptivo' && (
        <div className="space-y-6">
          {/* Indicadores de tendencia central y dispersión */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: 'Serie Anual Completa (2010–2025)',
                stats: estadisticas_descriptivas.serie_anual_completa_2010_2025,
                unit: 'hechos / año',
              },
              {
                title: 'Serie Mensual (Ene 2010 – Jul 2026)',
                stats: estadisticas_descriptivas.serie_mensual_2010_2026,
                unit: 'hechos / mes',
              },
              {
                title: 'Totales por Municipio (1,021 muns.)',
                stats: estadisticas_descriptivas.totales_municipales,
                unit: 'hechos / municipio',
              },
            ].map((blk) => (
              <div
                key={blk.title}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3"
              >
                <div>
                  <h3 className="text-sm font-bold text-[#0f294a]">{blk.title}</h3>
                  <p className="text-[11px] text-slate-500">
                    n = {formatInt(blk.stats.n)} observaciones · {blk.unit}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50">
                    <span className="text-slate-500 block">Media</span>
                    <strong className="text-[#0f294a] font-mono text-sm">
                      {formatDec(blk.stats.media)}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50">
                    <span className="text-slate-500 block">Mediana</span>
                    <strong className="text-[#0f294a] font-mono text-sm">
                      {formatDec(blk.stats.mediana)}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50">
                    <span className="text-slate-500 block">Desv. Estándar</span>
                    <strong className="text-[#0f294a] font-mono text-sm">
                      {formatDec(blk.stats.desv_est)}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50">
                    <span className="text-slate-500 block">Rango (Mín – Máx)</span>
                    <strong className="text-[#0f294a] font-mono text-xs">
                      {formatInt(blk.stats.min)} – {formatInt(blk.stats.max)}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Moda categórica y tabla de frecuencias */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-[#0f294a]">
                Tabla de Frecuencias: Modalidades de Hurto
              </h3>
              <p className="text-xs text-slate-500">
                Para variables nominales se reportan frecuencias absolutas, relativas, porcentajes y
                moda (sin promedios artificiales).
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-3 font-semibold">Modalidad</th>
                      <th className="py-2 pr-3 font-semibold text-right">Frec. Absoluta</th>
                      <th className="py-2 pr-3 font-semibold text-right">Frec. Relativa</th>
                      <th className="py-2 font-semibold text-right">Porcentaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {frecuencias.modalidades.map((m) => (
                      <tr key={m.categoria}>
                        <td className="py-2.5 pr-3 font-medium text-slate-800">{m.corta}</td>
                        <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                          {formatInt(m.frecuencia)}
                        </td>
                        <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                          {m.relativa.toFixed(4)}
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold text-blue-700 tabular-nums">
                          {formatPct(m.porcentaje)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#0f294a]">
                Modas Categóricas Identificadas
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                  <span className="text-slate-600">Moda Modalidad</span>
                  <strong className="text-[#0f294a]">{estadisticas_descriptivas.moda_modalidad}</strong>
                </div>
                <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100 flex items-center justify-between">
                  <span className="text-slate-600">Moda Arma/Medio</span>
                  <strong className="text-[#0f294a] text-xs sm:text-sm">
                    {estadisticas_descriptivas.moda_arma}
                  </strong>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                  <span className="text-slate-600">Moda Territorial</span>
                  <strong className="text-[#0f294a]">
                    {estadisticas_descriptivas.moda_departamento}
                  </strong>
                </div>
                <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-100 flex items-center justify-between">
                  <span className="text-slate-600">Año Modal</span>
                  <strong className="text-[#0f294a]">
                    {estadisticas_descriptivas.moda_anio} (
                    {formatInt(estadisticas_descriptivas.moda_anio_hechos)})
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Preguntas de análisis y respuestas */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-700" />
              <h3 className="text-base font-bold text-[#0f294a]">
                Preguntas de Análisis Sustentadas en Datos Reales
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {preguntas_analisis.map((qa, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-blue-700">PREGUNTA {idx + 1}</span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[#0f294a]">
                      {qa.dato_clave}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#0f294a]">{qa.pregunta}</p>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {qa.respuesta}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 5: Modelo Predictivo */}
      {stage === 'predictivo' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase text-emerald-700">
                  Valor Agregado · Modelado Supervisado (scikit-learn)
                </span>
                <h3 className="text-lg font-bold text-[#0f294a]">
                  Predicción Mensual de Hurtos por Departamento y Modalidad
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Objetivo: {predictive.objetivo}
                </p>
              </div>
              <div className="text-xs bg-slate-100 rounded-xl px-3.5 py-2 space-y-0.5">
                <p>
                  <strong>Entrenamiento:</strong> {predictive.division_temporal.entrenamiento}
                </p>
                <p>
                  <strong>Prueba:</strong> {predictive.division_temporal.prueba}
                </p>
              </div>
            </div>

            {/* Comparativa de modelos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {predictive.modelos.map((m) => {
                const isBest = m.nombre === predictive.mejor_modelo;
                return (
                  <div
                    key={m.nombre}
                    className={`p-4 rounded-xl border ${
                      isBest
                        ? 'bg-emerald-50/50 border-emerald-300'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-[#0f294a]">{m.nombre}</p>
                      {isBest && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Mejor
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{m.descripcion}</p>
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/70 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 block">MAE</span>
                        <strong className="font-mono text-sm text-[#0f294a]">{m.mae}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">RMSE</span>
                        <strong className="font-mono text-sm text-[#0f294a]">{m.rmse}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">R²</span>
                        <strong className="font-mono text-sm text-blue-700">{m.r2}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gráfico Real vs Predicho en conjunto de prueba */}
            <div className="pt-2 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h4 className="text-sm font-bold text-[#0f294a]">
                  Serie Real vs Predicción en Conjunto de Prueba (2024–2025)
                </h4>
                <select
                  value={selectedPredDepto}
                  onChange={(e) => setSelectedPredDepto(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800"
                >
                  <option value="Nacional">Total Nacional (agregado)</option>
                  {Object.keys(predictive.series_departamentos_prueba).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predSeries} margin={{ top: 8, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => formatInt(v)} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatDec(v, 1)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="real"
                      name="Valor Real"
                      stroke="#0f294a"
                      strokeWidth={2.5}
                    />
                    <Line
                      type="monotone"
                      dataKey="ridge"
                      name="Predicción Ridge"
                      stroke="#1d4ed8"
                      strokeDasharray="5 3"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="hgbr"
                      name="Predicción HistGBR"
                      stroke="#0ea5e9"
                      strokeWidth={1.8}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Limitaciones explícitas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-xs font-bold uppercase text-[#0f294a]">
                  Variables Predictoras y Coeficientes Ridge
                </p>
                <ul className="text-xs text-slate-600 list-disc pl-4 space-y-1">
                  {predictive.variables_predictoras.map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 space-y-2">
                <p className="text-xs font-bold uppercase text-orange-800">
                  Limitaciones Metodológicas (Sin Certezas Determinísticas)
                </p>
                <ul className="text-xs text-orange-950 list-disc pl-4 space-y-1">
                  {predictive.limitaciones.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
