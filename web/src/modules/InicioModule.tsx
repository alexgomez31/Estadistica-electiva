import React from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  Database,
  FileSpreadsheet,
  GraduationCap,
  Layers,
  MapPin,
  Presentation,
  ShieldCheck,
  Sigma,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import type { AllPlatformData, ModuleId } from '../types/analytics';
import { PROJECT_META } from '../data/projectMeta';
import { formatInt } from '../lib/format';
import { KpiCard } from '../components/KpiCard';

interface InicioModuleProps {
  data: AllPlatformData;
  onNavigate: (id: ModuleId) => void;
}

export const InicioModule: React.FC<InicioModuleProps> = ({ data, onNavigate }) => {
  const { auditoria_etl, fuentes_socrata } = data.dataScience;

  return (
    <div className="space-y-8">
      {/* Hero arquitectónico de alto impacto */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#081529] via-[#0f294a] to-[#1d4ed8] text-white p-6 sm:p-10 shadow-xl border border-blue-900/40">
        {/* Efectos ambientales sutiles */}
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-sky-400/20 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute left-1/3 -bottom-28 w-80 h-80 rounded-full bg-blue-400/15 blur-3xl pointer-events-none"
        />

        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-8 items-center">
          <div className="xl:col-span-8 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-400/20 border border-sky-300/30 text-sky-100">
                <Sparkles className="w-3.5 h-3.5 text-sky-300" />
                Asignaturas: Electiva III y Estadística Inferencial
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 border border-emerald-300/30 text-emerald-100">
                {PROJECT_META.institution} · {PROJECT_META.program}
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight leading-snug">
              {PROJECT_META.title}
            </h2>

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-3xl">
              Plataforma analítica interdisciplinaria que integra Ciencia de Datos e Inferencia
              Estadística sobre{' '}
              <span className="font-bold text-sky-200">
                {formatInt(auditoria_etl.hechos_totales)} registros reales
              </span>{' '}
              de la Policía Nacional (DIJIN), unificando limpieza ETL reproducible, exploración
              geográfica, modelado de Poisson, Teorema de Bayes y presentación académica.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-[#0b1f3b] font-bold text-sm hover:bg-sky-50 transition-all cursor-pointer shadow-lg shadow-slate-950/25"
              >
                <BarChart3 className="w-4 h-4 text-blue-700" />
                Explorar Dashboard BI
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('estadistica-inferencial')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-500/25 border border-sky-300/40 text-white font-semibold text-sm hover:bg-sky-500/35 transition-all cursor-pointer"
              >
                <Sigma className="w-4 h-4 text-sky-200" />
                Laboratorio Poisson &amp; Bayes
              </button>
              <button
                type="button"
                onClick={() => onNavigate('presentacion')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-all cursor-pointer"
              >
                <Presentation className="w-4 h-4 text-amber-300" />
                Sustentación (18 Diapositivas)
              </button>
            </div>
          </div>

          {/* Tarjeta lateral de telemetría real */}
          <div className="xl:col-span-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 space-y-3.5 shadow-inner">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-200 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-300" />
                Síntesis Cuantitativa
              </span>
              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                100% Real
              </span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Modalidad líder</span>
                <span className="font-bold text-white">Comerciales (43.07%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">2ª Modalidad</span>
                <span className="font-bold text-white">Motocicletas (36.75%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Territorio líder</span>
                <span className="font-bold text-sky-200">Bogotá D.C. (21.54%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Caso regional Cauca</span>
                <span className="font-bold text-white">49,812 hechos (Popayán: 23,578)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Modelo asignado</span>
                <span className="font-bold text-emerald-300">Grupo 2 · Poisson</span>
              </div>
            </div>
            <div className="pt-2 border-t border-white/15 text-[11px] text-slate-300 flex items-center justify-between">
              <span>Corte oficial DIJIN</span>
              <span className="font-mono text-white">01/01/2010 – 31/07/2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* Indicadores generales reales */}
      <section aria-label="Indicadores generales del conjunto de datos">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Registros Analizados"
            value={formatInt(auditoria_etl.hechos_totales)}
            subtitle="100% verificados tras ETL DD/MM/AAAA"
            icon={Database}
            accent="navy"
            badge="3 recursos API"
            badgeTone="positive"
          />
          <KpiCard
            title="Modalidades de Hurto"
            value={String(auditoria_etl.modalidades_count)}
            subtitle="Comerciales, motos, autos, residencias y más"
            icon={Layers}
            accent="blue"
            badge="Art. 239 CP"
          />
          <KpiCard
            title="Periodo Disponible"
            value="2010 – Jul 2026"
            subtitle={`${auditoria_etl.fecha_min} al ${auditoria_etl.fecha_max}`}
            icon={Calendar}
            accent="sky"
            badge="199 meses"
          />
          <KpiCard
            title="Cobertura Territorial"
            value={`${auditoria_etl.departamentos_count} Deptos`}
            subtitle={`${formatInt(auditoria_etl.municipios_count - 1)} municipios + 1 sin reportar`}
            icon={MapPin}
            accent="emerald"
            badge="Todo el país"
            badgeTone="positive"
          />
        </div>
      </section>

      {/* Contexto y Objetivos */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#0b1f3b]">
              Contextualización del Problema
            </h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            El delito de hurto contra el patrimonio económico constituye uno de los fenómenos de
            mayor impacto sobre la seguridad ciudadana, el sector comercial y la movilidad en
            Colombia. Sin embargo, analizar cifras agregadas sin distinguir entre modalidades,
            territorios, medios utilizados y dinámicas temporales oculta diferencias críticas
            entre grandes urbes y ciudades intermedias como Popayán.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            A partir de los registros públicos de la <strong>DIJIN – Policía Nacional</strong> en{' '}
            <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">datos.gov.co</code>, este
            proyecto transforma tres conjuntos de datos crudos en conocimiento verificable mediante
            limpieza reproducible, estadística descriptiva, modelado predictivo y análisis
            inferencial basado en la <strong>Distribución de Poisson</strong> y el{' '}
            <strong>Teorema de Bayes</strong>.
          </p>
        </div>

        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#0b1f3b]">Objetivos del Proyecto</h3>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200/80">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-1">
              Objetivo General
            </p>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              Analizar probabilística y descriptivamente las siete modalidades de hurto registradas
              en Colombia (2010–2026) mediante Ciencia de Datos, Modelo de Poisson y Teorema de
              Bayes en una plataforma web interactiva.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Ejecutar un flujo ETL reproducible sobre los tres recursos Socrata (
                <code className="text-xs">9vha-vh9n</code>,{' '}
                <code className="text-xs">6sqw-8cg5</code>,{' '}
                <code className="text-xs">d4fr-sbn2</code>), documentando calidad y saneamiento de
                fechas y valores nulos.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Caracterizar tendencias, concentraciones departamentales/municipales y medios
                empleados mediante indicadores y visualizaciones dinámicas con filtros cruzados.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Aplicar axiomas de probabilidad, Teorema de Bayes, Distribución de Poisson (Grupo 2),
                intervalos de confianza y contraste de hipótesis sobre series semanales reales.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Asignaturas, Docentes y Fuentes Oficiales */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#0b1f3b]">Asignaturas y Docentes</h3>
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-white">
              <p className="text-[11px] font-bold uppercase text-blue-700">Electiva III</p>
              <p className="text-sm font-bold text-[#0b1f3b] mt-0.5">
                {PROJECT_META.subjects[0].name}
              </p>
              <p className="text-xs text-slate-700 mt-1">
                Docente: <strong>{PROJECT_META.subjects[0].professor}</strong>
              </p>
              <p className="text-xs text-slate-600 mt-1">{PROJECT_META.subjects[0].focus}</p>
            </div>
            <div className="p-4 rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50/70 to-white">
              <p className="text-[11px] font-bold uppercase text-sky-700">Estadística Inferencial</p>
              <p className="text-sm font-bold text-[#0b1f3b] mt-0.5">
                {PROJECT_META.subjects[1].name} ({PROJECT_META.program})
              </p>
              <p className="text-xs text-slate-700 mt-1">
                Docente: <strong>{PROJECT_META.subjects[1].professor}</strong>
              </p>
              <p className="text-xs text-slate-600 mt-1">{PROJECT_META.subjects[1].focus}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-100 text-[#0b1f3b]">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0b1f3b]">
                Fuentes Oficiales (Datos Abiertos Colombia)
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              datos.gov.co · Socrata API
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-3 font-semibold">ID Recurso</th>
                  <th className="py-2.5 pr-3 font-semibold">Modalidades Cubiertas</th>
                  <th className="py-2.5 pr-3 font-semibold text-right">Registros</th>
                  <th className="py-2.5 font-semibold">Entidad Emisora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fuentes_socrata.map((src) => (
                  <tr key={src.recurso} className="hover:bg-slate-50/80">
                    <td className="py-3 pr-3 font-mono text-xs font-bold text-blue-700">
                      {src.recurso}
                    </td>
                    <td className="py-3 pr-3 text-slate-700">{src.descripcion_corta}</td>
                    <td className="py-3 pr-3 text-right font-mono font-bold text-[#0b1f3b] tabular-nums">
                      {formatInt(src.filas)}
                    </td>
                    <td className="py-3 text-xs text-slate-500">{src.atribucion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('ciencia-datos')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all cursor-pointer"
            >
              <p className="text-xs font-bold text-[#0b1f3b]">1. Auditoría ETL →</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Corrección DD/MM/AAAA y nulos
              </p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all cursor-pointer"
            >
              <p className="text-xs font-bold text-[#0b1f3b]">2. Explorar Datos →</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mapa de Colombia y filtros dinámicos
              </p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('estadistica-inferencial')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all cursor-pointer"
            >
              <p className="text-xs font-bold text-[#0b1f3b]">3. Poisson &amp; Bayes →</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Calculadoras y contraste χ² / z
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* Orden Secuencial de Exposición (bloques consecutivos) */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#0f294a] text-sky-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0b1f3b]">
                Integrantes del Equipo y Orden Secuencial de Exposición (15 min)
              </h3>
              <p className="text-xs text-slate-500">
                Cada integrante expone un bloque continuo de diapositivas seguidas (1 → 18) sin
                saltos ni interrupciones.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('presentacion')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0f294a] to-[#1d4ed8] text-white text-xs font-bold hover:opacity-95 cursor-pointer self-start shadow-sm"
          >
            <Presentation className="w-4 h-4" />
            Abrir Presentación
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {PROJECT_META.teamMembers.map((member) => {
            const isPoisson = member.name === 'Daniel Andrés Mera';
            const isStatsOnly = member.name === 'Yeison Rengifo';
            return (
              <div
                key={member.name}
                className={`relative p-5 rounded-2xl border transition-all space-y-2.5 ${
                  isPoisson
                    ? 'bg-gradient-to-br from-blue-50 via-white to-sky-50 border-blue-300 shadow-xs'
                    : isStatsOnly
                      ? 'bg-gradient-to-br from-orange-50/70 via-white to-amber-50/40 border-orange-200 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200/90'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0f294a] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {member.order}
                    </span>
                    <p className="text-sm font-bold text-[#0b1f3b]">{member.name}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shrink-0">
                    <Clock className="w-3 h-3 text-blue-600" />
                    {member.duration}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#0f294a] text-sky-200">
                    {member.slides}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                      isPoisson
                        ? 'bg-blue-100 text-blue-900 border-blue-200'
                        : isStatsOnly
                          ? 'bg-orange-100 text-orange-900 border-orange-200'
                          : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {member.difficulty}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{member.scope}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
