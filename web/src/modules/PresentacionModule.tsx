import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Maximize2,
  Minimize2,
  Presentation as PresentationIcon,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AllPlatformData } from '../types/analytics';
import { PROJECT_META, SLIDE_ASSIGNMENTS } from '../data/projectMeta';
import { aggregateDashboard } from '../lib/cubeEngine';
import {
  computeBayesPartition,
  computeHypothesisAndCi,
  computePoissonAnalysis,
  computePoissonClt,
} from '../lib/statistics';
import { CHART_COLORS, formatDec, formatInt, formatPct, formatProb } from '../lib/format';

interface PresentacionModuleProps {
  data: AllPlatformData;
}

export const PresentacionModule: React.FC<PresentacionModuleProps> = ({ data }) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const totalSlides = 18;

  const goNext = useCallback(
    () => setSlideIdx((i) => Math.min(totalSlides - 1, i + 1)),
    []
  );
  const goPrev = useCallback(() => setSlideIdx((i) => Math.max(0, i - 1)), []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && stageRef.current) {
        await stageRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignora bloqueo de fullscreen programático
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev, toggleFullscreen]);

  const nationalAgg = useMemo(
    () =>
      aggregateDashboard(data.cubeCore, data.cubeMun, {
        anio: 'TODOS',
        mes: 'TODOS',
        departamento: 'TODOS',
        municipio: 'TODOS',
        modalidad: 'TODOS',
        arma: 'TODOS',
        genero: 'TODOS',
      }),
    [data]
  );

  const pop2025 = useMemo(
    () => data.weeklyPoisson.series['MUN::POPAYÁN (CT)||TODOS']?.['2025'] ?? [],
    [data]
  );
  const pop2024 = useMemo(
    () => data.weeklyPoisson.series['MUN::POPAYÁN (CT)||TODOS']?.['2024'] ?? [],
    [data]
  );
  const popAuto2025 = useMemo(
    () =>
      data.weeklyPoisson.series['MUN::POPAYÁN (CT)||ARTÍCULO 239. HURTO AUTOMOTORES']?.['2025'] ??
      [],
    [data]
  );

  const popPoissonAll = useMemo(() => computePoissonAnalysis(pop2025, 40, 35, 30, 42), [pop2025]);
  const popPoissonAuto = useMemo(
    () => computePoissonAnalysis(popAuto2025, 6, 4, 2, 5),
    [popAuto2025]
  );
  const popClt = useMemo(() => computePoissonClt(popPoissonAll.lambda, 7), [popPoissonAll]);
  const popHyp = useMemo(() => computeHypothesisAndCi(pop2025, pop2024, 0.95, 2), [pop2025, pop2024]);

  const bayesArmaEjemplo = useMemo(() => {
    const N = data.inferential.total_hechos;
    const items = data.inferential.modalidades.map((m) => ({
      label: m.short,
      prior: m.count / N,
      likelihood: (data.inferential.mod_x_arma[m.key]?.['LLAVE MAESTRA'] ?? 0) / m.count,
    }));
    return computeBayesPartition(items);
  }, [data]);

  const { auditoria_etl, estadisticas_descriptivas, frecuencias } = data.dataScience;

  // 18 diapositivas ordenadas en 6 bloques 100% consecutivos por expositor
  const slides: { title: string; tag: string; render: () => React.ReactNode }[] = [
    // BLOQUE 1 (Slides 1–3): Jessica Vanesa Acosta Galíndez
    {
      tag: 'Portada',
      title: 'Portada del Proyecto Académico',
      render: () => (
        <div className="h-full flex flex-col justify-between bg-gradient-to-br from-[#081529] via-[#0f294a] to-[#1d4ed8] text-white p-6 sm:p-10 rounded-2xl shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-400/20 border border-sky-300/30">
              {PROJECT_META.institution} · {PROJECT_META.program}
            </span>
            <span className="text-xs font-mono text-sky-200">
              Asignaturas: Electiva III y Estadística Inferencial
            </span>
          </div>

          <div className="space-y-3 max-w-4xl my-auto py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-300">
              Proyecto Integrador · Sustentación Académica (15 min)
            </p>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
              {PROJECT_META.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 max-w-3xl">
              Análisis descriptivo, auditoría ETL, inferencia estadística (Grupo 2 – Poisson) y
              actualización bayesiana sobre <strong>{formatInt(auditoria_etl.hechos_totales)}</strong>{' '}
              registros oficiales de la Policía Nacional (DIJIN).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 border-t border-white/15 text-xs">
            <div className="lg:col-span-7">
              <p className="text-sky-300 font-semibold uppercase tracking-wider text-[10px] mb-1.5">
                Integrantes del Equipo
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-white/95">
                {PROJECT_META.teamMembers.map((m) => (
                  <p key={m.name}>
                    • {m.name} <span className="text-sky-300/80">({m.slides})</span>
                  </p>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5 space-y-1.5">
              <p className="text-sky-300 font-semibold uppercase tracking-wider text-[10px]">
                Docentes
              </p>
              <p className="text-white/95">
                • <strong>Edith Janeth Potosi Estrada</strong> (Estadística Inferencial)
              </p>
              <p className="text-white/95">
                • <strong>Carlos Eduardo Ruiz Quiñones</strong> (Electiva III)
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      tag: 'Introducción',
      title: 'Contextualización e Importancia del Análisis',
      render: () => (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-center">
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-2xl font-extrabold text-[#0b1f3b]">
              ¿Por qué analizar probabilísticamente el hurto en Colombia?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              El hurto contra el patrimonio económico afecta de manera diferenciada a comercios,
              usuarios de motocicletas y automotores, residencias y sector rural. Las cifras
              agregadas suelen ocultar contrastes críticos entre modalidades y regiones.
            </p>
            <ul className="space-y-2.5 text-sm text-slate-700">
              <li className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong>Rigor técnico:</strong> Convierte 1.35 millones de registros públicos en
                indicadores reproducibles y auditables.
              </li>
              <li className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
                <strong>Enfoque dual:</strong> Combina ETL y analítica visual (Electiva III) con
                probabilidad, Teorema de Bayes y Modelo de Poisson (Estadística Inferencial).
              </li>
            </ul>
          </div>
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {[
              ['1,354,442', 'Hechos reales analizados'],
              ['7', 'Modalidades Art. 239 CP'],
              ['33', 'Territorios (32 Deptos + Bogotá)'],
              ['1,021', 'Municipios reportados'],
            ].map(([val, lbl]) => (
              <div
                key={lbl}
                className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 text-center shadow-2xs"
              >
                <p className="text-2xl font-extrabold font-mono text-[#0b1f3b]">{val}</p>
                <p className="text-xs text-slate-600 mt-1">{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      tag: 'Planteamiento',
      title: 'Planteamiento del Problema y Pregunta Principal',
      render: () => (
        <div className="space-y-6 my-auto">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0b1f3b] to-[#1d4ed8] text-white space-y-2 shadow-md">
            <p className="text-xs uppercase tracking-widest text-sky-300 font-bold">
              Pregunta Central de Investigación
            </p>
            <p className="text-xl sm:text-2xl font-bold leading-snug">
              ¿Cuál es el comportamiento descriptivo, territorial y probabilístico de las modalidades
              de hurto en Colombia (2010–2026), y en qué medida la Distribución de Poisson y el
              Teorema de Bayes describen su ocurrencia?
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-[#0b1f3b] block mb-1">Situación Estudiada</strong>
              <p className="text-xs text-slate-600">
                Dispersión de registros en tres endpoints separados de la DIJIN e inconsistencias
                críticas en el formato de fecha y nulos estructurales.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-[#0b1f3b] block mb-1">Enfoque Territorial</strong>
              <p className="text-xs text-slate-600">
                Contraste entre grandes capitales (Bogotá, Medellín, Cali) y contexto regional de
                Popayán – Cauca (23,578 hechos).
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-[#0b1f3b] block mb-1">Reto Inferencial</strong>
              <p className="text-xs text-slate-600">
                Evaluar dependencia entre modalidad y armas, actualización bayesiana y ajuste de
                Poisson frente a posible sobredispersión.
              </p>
            </div>
          </div>
        </div>
      ),
    },

    // BLOQUE 2 (Slides 4–6): Andrés Felipe Suaza Cerón
    {
      tag: 'Objetivos',
      title: 'Objetivo General y Objetivos Específicos',
      render: () => (
        <div className="space-y-5 my-auto">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200">
            <p className="text-xs font-bold uppercase text-blue-700 mb-1">Objetivo General</p>
            <p className="text-base font-bold text-[#0b1f3b]">
              Desarrollar un análisis estadístico y probabilístico integral del hurto en Colombia
              mediante Ciencia de Datos, Modelo de Poisson y Teorema de Bayes sobre Datos Abiertos
              de la Policía Nacional, presentado en una plataforma web interactiva.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            {[
              '1. Extraer y unificar vía API Socrata los tres recursos oficiales de hurtos (9vha-vh9n, 6sqw-8cg5, d4fr-sbn2).',
              '2. Auditar y depurar fechas, valores nulos e inconsistencias mediante un pipeline ETL reproducible.',
              '3. Construir un dashboard analítico con filtros cruzados, mapa geográfico de Colombia e indicadores reales.',
              '4. Formular experimento aleatorio, reglas de probabilidad, Teorema de Bayes, modelo de Poisson (Grupo 2) y pruebas z/χ².',
            ].map((obj) => (
              <div
                key={obj}
                className="p-4 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs"
              >
                {obj}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      tag: 'Fuentes',
      title: 'Fuentes de Información (Datos Abiertos Colombia)',
      render: () => (
        <div className="space-y-4 my-auto">
          <p className="text-sm text-slate-600">
            Conjunto oficial <strong>Reporte Hurto por Modalidades – Policía Nacional (DIJIN)</strong>,
            consultado en <span className="font-mono text-blue-700">datos.gov.co</span>. Cobertura
            real verificada: <strong>01/01/2010 al 31/07/2026</strong>.
          </p>
          <table className="w-full text-left text-xs sm:text-sm border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-[#0f294a] text-white">
              <tr>
                <th className="p-3">ID Socrata</th>
                <th className="p-3">Modalidades incluidas</th>
                <th className="p-3 text-right">Registros</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.dataScience.fuentes_socrata.map((s) => (
                <tr key={s.recurso}>
                  <td className="p-3 font-mono font-bold text-blue-700">{s.recurso}</td>
                  <td className="p-3">{s.descripcion_corta}</td>
                  <td className="p-3 text-right font-mono font-bold">{formatInt(s.filas)}</td>
                </tr>
              ))}
              <tr className="bg-blue-50 font-bold">
                <td className="p-3">TOTAL</td>
                <td className="p-3">7 modalidades · 9 variables por registro</td>
                <td className="p-3 text-right font-mono">
                  {formatInt(auditoria_etl.hechos_totales)}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-slate-500">
            Variables: departamento, municipio, codigo_dane, armas_medios, fecha_hecho, genero,
            grupo_etario, tipo_de_hurto, cantidad (= 1 por hecho).
          </p>
        </div>
      ),
    },
    {
      tag: 'Metodología',
      title: 'Metodología Interdisciplinaria (ETL + Inferencia)',
      render: () => (
        <div className="space-y-6 my-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              ['1. Ingesta API', 'Paginación Socrata $order=:id en bloques de 50k'],
              ['2. Limpieza', 'Corrección DD/MM/AAAA e imputación explícita'],
              ['3. Descriptivo', 'Frecuencias, medias, medianas, rangos y mapas'],
              ['4. Predictivo', 'Ridge vs HistGBR con división temporal 2011–25'],
              ['5. Probabilidad', 'Axiomas, independencia y Teorema de Bayes'],
              ['6. Poisson (G2)', 'Tasa λ semanal, TLC S₇, χ², IC 95% y prueba z'],
            ].map(([t, d]) => (
              <div
                key={t}
                className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 shadow-2xs"
              >
                <p className="text-xs font-bold text-blue-700">{t}</p>
                <p className="text-xs text-slate-600 mt-1.5">{d}</p>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-950">
            <strong>Principio de reproducibilidad:</strong> Todos los indicadores del tablero y
            ecuaciones de esta presentación se calculan directamente sobre los 1,354,442 registros
            reales, sin datos simulados.
          </div>
        </div>
      ),
    },

    // BLOQUE 3 (Slides 7–10): Duban Alexander Gómez Hoyos (Electiva III completa)
    {
      tag: 'Limpieza ETL',
      title: 'Preparación y Limpieza de Datos (Antes vs Después)',
      render: () => (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-auto">
          <div className="lg:col-span-6 space-y-3 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
              <strong className="text-orange-800 block">Hallazgo Crítico en Notebook Colab</strong>
              <p className="text-orange-950 mt-1">
                El parseo por defecto (<code className="font-mono">MM/DD/AAAA</code>) descartó el{' '}
                <strong>60.20%</strong> de fechas (815,359 filas) al fallar en días 13–31. Con{' '}
                <code className="font-mono">format="%d/%m/%Y"</code> se recuperó el{' '}
                <strong>100.00%</strong>.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <p>
                • <strong>Nulos en género (43.41%):</strong> Estructurales (99.94% en Entidades
                Comerciales y 100% en Financieras → víctima es persona jurídica).
              </p>
              <p>
                • <strong>1 registro sin municipio (Nariño 52000000):</strong> Imputado como{' '}
                <code className="font-mono">NO REPORTADO</code>.
              </p>
              <p>
                • <strong>474,880 filas con atributos iguales:</strong> Conservadas porque cada fila
                equivale a 1 hecho distinto (<code className="font-mono">cantidad = 1</code>).
              </p>
            </div>
          </div>
          <div className="lg:col-span-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    estado: 'Fechas Válidas',
                    Notebook_MDY: auditoria_etl.notebook_parse_mdy.fechas_validas,
                    ETL_Corregido: auditoria_etl.etl_corregido_dmy.fechas_validas,
                  },
                  {
                    estado: 'Fechas Perdidas',
                    Notebook_MDY: auditoria_etl.notebook_parse_mdy.fechas_nulas,
                    ETL_Corregido: auditoria_etl.etl_corregido_dmy.fechas_nulas,
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="estado" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatInt(v)} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatInt(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Notebook_MDY" name="Antes (MM/DD)" fill="#f97316" />
                <Bar dataKey="ETL_Corregido" name="Después (DD/MM)" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    {
      tag: 'Descriptivo',
      title: 'Análisis Descriptivo: Indicadores y Frecuencias',
      render: () => (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-auto">
          <div className="lg:col-span-5 space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <p className="font-bold text-[#0b1f3b]">Indicadores Numéricos Reales</p>
              <p>
                • <strong>Serie Anual (2010–2025):</strong> Media{' '}
                {formatDec(estadisticas_descriptivas.serie_anual_completa_2010_2025.media)} |
                Mediana {formatDec(estadisticas_descriptivas.serie_anual_completa_2010_2025.mediana)}
              </p>
              <p>
                • <strong>Serie Mensual (199 meses):</strong> Media{' '}
                {formatDec(estadisticas_descriptivas.serie_mensual_2010_2026.media)} | Mín{' '}
                {formatInt(estadisticas_descriptivas.serie_mensual_2010_2026.min)} | Máx{' '}
                {formatInt(estadisticas_descriptivas.serie_mensual_2010_2026.max)}
              </p>
              <p>
                • <strong>Municipios (n=1,021):</strong> Media{' '}
                {formatDec(estadisticas_descriptivas.totales_municipales.media)} vs Mediana{' '}
                {formatDec(estadisticas_descriptivas.totales_municipales.mediana)} (fuerte asimetría)
              </p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1">
              <p className="font-bold text-[#0b1f3b]">Modas Categóricas</p>
              <p>• Modalidad: {estadisticas_descriptivas.moda_modalidad} (43.07%)</p>
              <p>• Medio: {estadisticas_descriptivas.moda_arma} (48.37%)</p>
              <p>• Territorio: {estadisticas_descriptivas.moda_departamento} (21.54%)</p>
            </div>
          </div>
          <div className="lg:col-span-7 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={frecuencias.modalidades}
                layout="vertical"
                margin={{ left: 10, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => formatInt(v)} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="corta" width={135} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatInt(v)} />
                <Bar dataKey="frecuencia" name="Hechos">
                  {frecuencias.modalidades.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    {
      tag: 'Dashboard',
      title: 'Resultados del Dashboard: Tendencia y Concentración',
      render: () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-auto">
          <div>
            <p className="text-xs font-bold text-[#0b1f3b] mb-2">
              Evolución Anual Nacional (2010–2026*)
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={nationalAgg.porAnio}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="anio" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => formatInt(v)} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => formatInt(v)} />
                  <Area
                    type="monotone"
                    dataKey="hechos"
                    stroke="#1d4ed8"
                    fill="#93c5fd"
                    fillOpacity={0.45}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-[#0b1f3b] mb-2">
              Top 8 Departamentos / Bogotá D.C.
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nationalAgg.porDepartamento.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => formatInt(v)} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="nombre" width={115} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => formatInt(v)} />
                  <Bar dataKey="hechos" fill="#0f294a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ),
    },
    {
      tag: 'Predictivo',
      title: 'Componente Predictivo (Valor Agregado Electiva III)',
      render: () => (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-auto">
          <div className="lg:col-span-5 space-y-3 text-xs">
            <p className="text-slate-600">
              Predicción de conteos mensuales por departamento y modalidad (Train: 2011–2023,
              34,008 obs. | Test: 2024–2025, 5,232 obs.).
            </p>
            <div className="space-y-2">
              {data.predictive.modelos.map((m) => (
                <div
                  key={m.nombre}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center"
                >
                  <span className="font-semibold text-[#0b1f3b]">{m.nombre}</span>
                  <span className="font-mono text-blue-700">
                    MAE {m.mae} | R² {m.r2}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-orange-800 bg-orange-50 p-3 rounded-xl border border-orange-200">
              <strong>Limitación:</strong> No incluye variables exógenas ni mide subregistro;
              constituye una proyección estadística y no una certeza.
            </p>
          </div>
          <div className="lg:col-span-7 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.predictive.serie_nacional_prueba}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => formatInt(v)} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatDec(v, 1)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="real" name="Real" stroke="#0f294a" strokeWidth={2.5} />
                <Line
                  type="monotone"
                  dataKey="ridge"
                  name="Ridge (mejor)"
                  stroke="#1d4ed8"
                  strokeDasharray="5 3"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },

    // BLOQUE 4 (Slides 11–12): Yeison Rengifo (100% Estadística Inferencial, sin Electiva III)
    {
      tag: 'Experimento y Reglas',
      title: 'Experimento Aleatorio, Reglas de Probabilidad e Independencia',
      render: () => {
        const N = data.inferential.total_hechos;
        const nM = 497736;
        const nF = 274849;
        const nMF =
          data.inferential.mod_x_arma['ARTÍCULO 239. HURTO MOTOCICLETAS']?.['ARMA DE FUEGO'] ?? 0;
        const pM = nM / N;
        const pF = nF / N;
        const pMF = nMF / N;
        return (
          <div className="space-y-4 my-auto text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#0f294a] text-white">
                <span className="text-[10px] font-bold uppercase text-sky-300">
                  Experimentos y Espacios Muestrales
                </span>
                <p className="mt-1">
                  <strong>ε₁ (Conteo semanal):</strong> Ω₁ = {'{0, 1, 2, ...}'} = ℤ≥₀ (Popayán).
                  <br />
                  <strong>ε₂ (Selección registro):</strong> |Ω₂| = {formatInt(N)} hechos.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-[#0b1f3b]">
                <span className="text-[10px] font-bold uppercase text-blue-700">
                  Eventos Definidos (Motocicletas M y Arma de Fuego F)
                </span>
                <p className="mt-1 font-mono">
                  P(M) = {formatInt(nM)}/{formatInt(N)} = <strong>{formatProb(pM)}</strong> | P(F) ={' '}
                  <strong>{formatProb(pF)}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-blue-700">1. Adición (Unión)</strong>
                <p className="font-mono">
                  P(M ∪ F) = P(M) + P(F) − P(M ∩ F) ={' '}
                  <strong>{formatProb(pM + pF - pMF)}</strong>
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-sky-700">2. Multiplicación (Intersección)</strong>
                <p className="font-mono">
                  P(M ∩ F) = P(M)·P(F|M) = <strong>{formatProb(pMF)}</strong> ({formatInt(nMF)}{' '}
                  hechos)
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-emerald-700">3. Complemento</strong>
                <p className="font-mono">
                  P(Mᶜ) = 1 − P(M) = <strong>{formatProb(1 - pM)}</strong> ({formatPct((1 - pM) * 100)})
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 space-y-1">
                <strong className="text-orange-800">4. Prueba de Independencia</strong>
                <p className="font-mono">
                  P(M)·P(F) = {formatProb(pM * pF)} ≠ P(M∩F) = {formatProb(pMF)} →{' '}
                  <strong>DEPENDIENTES</strong>
                </p>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      tag: 'Teorema de Bayes',
      title: 'Probabilidad Condicional y Teorema de Bayes',
      render: () => (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-auto">
          <div className="lg:col-span-5 space-y-3 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-[#0f294a] text-white space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-sky-300 font-bold">
                Ecuación Formal de Bayes
              </p>
              <div className="text-sm font-mono flex items-center flex-wrap">
                <span>P(Mᵢ | B) =</span>
                <span className="math-frac">
                  <span>P(B | Mᵢ) · P(Mᵢ)</span>
                  <span>∑ⱼ P(B | Mⱼ) · P(Mⱼ)</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-200">
                Evidencia B = «LLAVE MAESTRA» · P(B) ={' '}
                <strong className="font-mono text-sky-300">
                  {formatProb(bayesArmaEjemplo.evidence)}
                </strong>
              </p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Al observar <em>Llave Maestra</em>, la probabilidad a posteriori de{' '}
              <strong>Motocicletas</strong> sube de <strong>36.75%</strong> (previa) a{' '}
              <strong className="text-blue-700">
                {formatPct(
                  (bayesArmaEjemplo.results.find((r) => r.label === 'Motocicletas')?.posterior ?? 0) *
                    100
                )}
              </strong>{' '}
              y la de <strong>Automotores</strong> sube de 11.73% a{' '}
              <strong className="text-blue-700">
                {formatPct(
                  (bayesArmaEjemplo.results.find((r) => r.label === 'Automotores')?.posterior ?? 0) *
                    100
                )}
              </strong>
              .
            </p>
          </div>
          <div className="lg:col-span-7 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bayesArmaEjemplo.results.map((r) => ({
                  modalidad: r.label,
                  Previa: Number((r.prior * 100).toFixed(1)),
                  Posteriori: Number((r.posterior * 100).toFixed(1)),
                }))}
                layout="vertical"
                margin={{ left: 10, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" unit="%" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="modalidad" width={125} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Previa" fill="#94a3b8" />
                <Bar dataKey="Posteriori" fill="#1d4ed8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },

    // BLOQUE 5 (Slides 13–15): Daniel Andrés Mera (Poisson y Ecuaciones)
    {
      tag: 'Poisson · Ecuaciones',
      title: 'Modelo de Poisson (Grupo 2): Ecuaciones y Sobredispersión',
      render: () => (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-auto">
          <div className="lg:col-span-5 space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-[#0f294a] text-white space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-sky-300 font-bold">
                Ecuación PMF y Propiedad de Equidispersión
              </p>
              <div className="text-sm font-mono flex items-center flex-wrap">
                <span>P(X = k) =</span>
                <span className="math-frac">
                  <span>e⁻λ · λᵏ</span>
                  <span>k!</span>
                </span>
                <span className="ml-2 text-sky-300">| E[X] = Var(X) = λ</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <p className="font-bold text-[#0b1f3b]">Popayán 2025 · Agregado (52 semanas)</p>
              <p>
                1,896 hechos · <strong>λ = {formatDec(popPoissonAll.lambda)}</strong> · s² ={' '}
                {formatDec(popPoissonAll.varianza)} · Razón{' '}
                <strong className="text-orange-700">
                  s²/λ = {formatDec(popPoissonAll.dispersionRatio)}
                </strong>{' '}
                (sobredispersión).
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <p className="font-bold text-emerald-900">Popayán 2025 · Hurto Automotores</p>
              <p className="text-emerald-950">
                204 hechos · <strong>λ = {formatDec(popPoissonAuto.lambda)}</strong> · s² ={' '}
                {formatDec(popPoissonAuto.varianza)} ·{' '}
                <strong>s²/λ = {formatDec(popPoissonAuto.dispersionRatio)}</strong> (equidispersión
                casi ideal).
              </p>
            </div>
          </div>
          <div className="lg:col-span-7 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={popPoissonAuto.pmfComparativa}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="k" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => v.toFixed(4)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="observado" name="Observado (Automotores)" fill="#93c5fd" />
                <Line
                  type="monotone"
                  dataKey="poisson"
                  name={`Poisson(λ=${popPoissonAuto.lambda.toFixed(2)})`}
                  stroke="#0f294a"
                  strokeWidth={2.5}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    {
      tag: 'TLC y Bondad χ²',
      title: 'Ecuaciones Avanzadas: Suma S₇ (TLC) y Bondad de Ajuste χ²',
      render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-auto text-xs sm:text-sm">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-[11px] font-bold uppercase text-blue-700">
              Propiedad Reproductiva y Teorema del Límite Central
            </span>
            <div className="p-3 rounded-xl bg-[#0f294a] text-white font-mono text-xs space-y-1">
              <p>S₇ = ∑ᵢ₌₁⁷ Xᵢ ~ Poisson(λ₇ = 7λ = {formatDec(popClt.lamM)})</p>
              <div className="flex items-center">
                <span>Z =</span>
                <span className="math-frac">
                  <span>c + 0.5 − 7λ</span>
                  <span>√(7λ)</span>
                </span>
                <span className="ml-2">= {formatDec(popClt.z)}</span>
              </div>
            </div>
            <p className="text-slate-700">
              Para c = {popClt.c}: Probabilidad exacta P(S₇ &gt; {popClt.c}) ={' '}
              <strong className="font-mono text-blue-700">{formatProb(popClt.exacta)}</strong> vs
              aproximación Normal ={' '}
              <strong className="font-mono text-sky-700">{formatProb(popClt.normalAprox)}</strong>{' '}
              (|Δ| = {formatProb(popClt.diferencia)}).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
            <span className="text-[11px] font-bold uppercase text-emerald-800">
              Prueba Chi-Cuadrado (χ²) de Bondad de Ajuste
            </span>
            <div className="p-3 rounded-xl bg-white border border-emerald-200 font-mono text-xs text-[#0b1f3b]">
              <div className="flex items-center">
                <span>χ² = ∑</span>
                <span className="math-frac">
                  <span>(Oᵢ − Eᵢ)²</span>
                  <span>Eᵢ</span>
                </span>
                <span className="ml-2">
                  (gl = k − 1 − 1 = {popPoissonAuto.chi2Test.df})
                </span>
              </div>
            </div>
            <p className="text-emerald-950">
              En <strong>Popayán Automotores 2025</strong> (λ = {formatDec(popPoissonAuto.lambda)}):
              χ² = <strong className="font-mono">{formatDec(popPoissonAuto.chi2Test.chi2)}</strong>,
              valor-p ={' '}
              <strong className="font-mono">{formatProb(popPoissonAuto.chi2Test.pValor)}</strong> ≥
              0.05 → <strong>El ajuste Poisson es estadísticamente válido.</strong>
            </p>
          </div>
        </div>
      ),
    },
    {
      tag: 'IC y Prueba z',
      title: 'Estimación por Intervalo de Confianza y Contraste z (Opcional)',
      render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-auto text-xs sm:text-sm">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-[11px] font-bold uppercase text-blue-700">
              Unidad 3 · Intervalo de Confianza 95% y Tamaño de Muestra
            </span>
            <div className="p-3 rounded-xl bg-white border border-slate-200 font-mono text-xs text-[#0b1f3b]">
              IC₉₅% = x̄ ± 1.96 · √(x̄ / n) &nbsp;|&nbsp; n* = ⌈(1.96·s / E)²⌉
            </div>
            <p>
              Para Popayán 2025 (n = 52 semanas, x̄ = <strong>{formatDec(popHyp.xBar)}</strong>):
            </p>
            <p className="font-mono font-bold text-blue-700 text-base">
              IC 95% = [{formatDec(popHyp.icPoisson[0])} ; {formatDec(popHyp.icPoisson[1])}]
              hurtos/sem
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-3">
            <span className="text-[11px] font-bold uppercase text-orange-800">
              Unidad 4 · Contraste Bilateral z (2024 vs 2025 en Popayán)
            </span>
            <div className="p-3 rounded-xl bg-white border border-orange-200 font-mono text-xs text-[#0b1f3b] space-y-1">
              <p>
                H₀: λ₂₀₂₅ = λ₀ ({formatDec(popHyp.lam0)}) vs H₁: λ₂₀₂₅ ≠ λ₀
              </p>
              <div className="flex items-center">
                <span>z =</span>
                <span className="math-frac">
                  <span>x̄ − λ₀</span>
                  <span>√(λ₀ / n)</span>
                </span>
                <span className="ml-2">
                  = <strong>{formatDec(popHyp.zStat)}</strong> (valor-p &lt; 0.0001)
                </span>
              </div>
            </div>
            <p className="font-semibold text-orange-950">
              Decisión (α = 0.05): |z| &gt; 1.96 → Se rechaza H₀. Hubo reducción estadísticamente
              significativa frente a 2024.
            </p>
          </div>
        </div>
      ),
    },

    // BLOQUE 6 (Slides 16–18): Santiago Alexis Ordoñez Segura
    {
      tag: 'Hallazgos',
      title: 'Principales Hallazgos Respaldados por Datos',
      render: () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-auto text-xs sm:text-sm">
          {[
            [
              '1. Concentración por Modalidad',
              'Entidades Comerciales (43.07%) y Motocicletas (36.75%) explican el 79.82% de los 1,354,442 hurtos en Colombia.',
            ],
            [
              '2. Concentración Territorial',
              'Bogotá D.C. (21.54%), Antioquia (17.24%) y Valle del Cauca (12.22%) agrupan más del 51% del total nacional.',
            ],
            [
              '3. Impacto Crítico de Calidad de Datos',
              'El parseo erróneo MM/DD ocultaba el 60.20% de los hechos; la auditoría ETL recuperó el 100% y explicó los nulos estructurales en género.',
            ],
            [
              '4. Validez Diferenciada de Poisson y Bayes',
              'En series agregadas existe sobredispersión (s²/λ = 1.78), pero en Automotores Popayán el ajuste Poisson es excelente (s²/λ = 0.96); Bayes demuestra alta dependencia arma-modalidad.',
            ],
          ].map(([t, d]) => (
            <div
              key={t}
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 space-y-1.5 shadow-2xs"
            >
              <p className="font-bold text-[#0b1f3b]">{t}</p>
              <p className="text-slate-600 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      tag: 'Conclusiones',
      title: 'Conclusiones e Impacto del Proyecto',
      render: () => (
        <div className="space-y-4 my-auto text-sm">
          <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200">
            <strong className="text-[#0b1f3b] block mb-1">Aporte Metodológico</strong>
            <p className="text-slate-700 text-xs sm:text-sm">
              La integración entre Ciencia de Datos e Inferencia Estadística demuestra que la
              calidad del preprocesamiento determina directamente la validez de cualquier parámetro
              estimado (λ, varianza, probabilidades posteriores o pruebas de hipótesis).
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <strong className="text-emerald-900 block mb-1">Utilidad Práctica</strong>
            <p className="text-emerald-950 text-xs sm:text-sm">
              La plataforma web convierte bases gubernamentales de más de 1.35 millones de filas en
              una herramienta interactiva de consulta territorial, detección de alertas semanales al
              5% y soporte académico de nivel universitario.
            </p>
          </div>
        </div>
      ),
    },
    {
      tag: 'Cierre',
      title: 'Agradecimientos y Espacio de Preguntas',
      render: () => (
        <div className="h-full flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#081529] via-[#0f294a] to-[#1d4ed8] text-white rounded-2xl p-8 space-y-5">
          <PresentationIcon className="w-12 h-12 text-sky-300" />
          <h3 className="text-3xl sm:text-4xl font-extrabold">¡Muchas Gracias!</h3>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl font-medium">
            {PROJECT_META.title}
          </p>
          <p className="text-xs text-sky-200">
            Docentes: Edith Janeth Potosi Estrada · Carlos Eduardo Ruiz Quiñones
          </p>
          <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-mono">
            Espacio abierto para preguntas del jurado y docentes
          </div>
        </div>
      ),
    },
  ];

  const current = slides[slideIdx];
  const assignment = SLIDE_ASSIGNMENTS[slideIdx];
  const progressPct = ((slideIdx + 1) / totalSlides) * 100;

  return (
    <div className="space-y-4">
      {/* Barra superior de control */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[#0b1f3b]">
            Presentación Académica Integrada
          </h2>
          <p className="text-xs text-slate-500">
            6 bloques consecutivos sin saltos · Teclas{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border">←</kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border">→</kbd> o{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border">F</kbd> (pantalla completa)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSchedule((s) => !s)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
              showSchedule
                ? 'bg-blue-50 border-blue-300 text-blue-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Orden de Expositores (15 min)
          </button>
          <span className="text-xs font-mono font-bold text-slate-700 px-3 py-1.5 rounded-xl bg-slate-100">
            Diapositiva {slideIdx + 1} / {totalSlides}
          </span>
          <button
            type="button"
            onClick={goPrev}
            disabled={slideIdx === 0}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            aria-label="Diapositiva anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={slideIdx === totalSlides - 1}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            aria-label="Diapositiva siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0f294a] to-[#1d4ed8] text-white text-xs font-bold hover:opacity-95 cursor-pointer shadow-xs"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" /> Salir
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" /> Pantalla completa
              </>
            )}
          </button>
        </div>
      </div>

      {/* Panel desplegable con los 6 bloques consecutivos */}
      {showSchedule && (
        <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold text-[#0b1f3b]">
              Orden Secuencial de Sustentación (Diapositivas Seguidas por Expositor)
            </h3>
            <span className="text-xs text-slate-500">
              Haz clic en un bloque para iniciar en su primera diapositiva
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {PROJECT_META.teamMembers.map((m) => (
              <button
                key={m.name}
                type="button"
                onClick={() => setSlideIdx(m.slideRange[0] - 1)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#0b1f3b]">
                    Turno {m.order} · {m.name}
                  </span>
                  <span className="text-[11px] font-mono text-blue-700 font-bold">
                    {m.duration}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-blue-700">
                  {m.slides} · {m.difficulty}
                </p>
                <p className="text-[11px] text-slate-600">{m.scope}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Escenario de diapositiva */}
      <div
        ref={stageRef}
        className={`bg-white rounded-3xl border border-slate-200/90 shadow-md flex flex-col justify-between overflow-hidden ${
          isFullscreen ? 'p-8 sm:p-12 h-screen' : 'p-6 sm:p-10 min-h-[560px]'
        }`}
      >
        <div className="space-y-3">
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0f294a] via-blue-600 to-sky-400 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {slideIdx > 0 && slideIdx < totalSlides - 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  {current.tag}
                </span>
                <h3 className="text-xl font-extrabold text-[#0b1f3b]">{current.title}</h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0b1f3b] font-bold">
                  <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                  Turno {assignment.blockOrder}/6 · {assignment.presenter}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-mono font-semibold">
                  <Clock className="w-3 h-3" />
                  {assignment.duration}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Contenido animado al cambiar de diapositiva */}
        <div key={slideIdx} className="flex-1 py-4 flex flex-col animate-slide-in">
          {current.render()}
        </div>

        {/* Pie con expositor y bloque */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <span>
            Turno {assignment.blockOrder}/6:{' '}
            <strong className="text-[#0b1f3b]">{assignment.presenter}</strong> ·{' '}
            <span className="text-blue-700 font-semibold">{assignment.level}</span>
          </span>
          {isFullscreen ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={slideIdx === 0}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={slideIdx === totalSlides - 1}
                className="px-3 py-1 rounded-lg bg-[#0f294a] text-white disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          ) : (
            <span className="font-mono">
              {slideIdx + 1} / {totalSlides}
            </span>
          )}
        </div>
      </div>

      {/* Índice rápido de diapositivas */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {slides.map((s, idx) => (
            <button
              key={s.tag}
              type="button"
              onClick={() => setSlideIdx(idx)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                idx === slideIdx
                  ? 'bg-[#0f294a] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {idx + 1}. {s.tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
