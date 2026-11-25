import React from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  Database,
  FileSpreadsheet,
  Layers,
  MapPin,
  Presentation,
  ShieldCheck,
  Sigma,
  Target,
} from 'lucide-react';
import type { AllPlatformData, ModuleId } from '../types/analytics';
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
      {/* Hero académico */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f294a] via-[#133663] to-[#1d4ed8] text-white p-6 sm:p-10 shadow-lg">
        <div className="relative z-10 max-w-4xl space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-400/20 border border-sky-300/30 text-sky-100">
              Proyecto Académico Interdisciplinario · Ingeniería Informática
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 border border-emerald-300/30 text-emerald-100">
              Institución Universitaria Colegio Mayor del Cauca
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Análisis Estadístico de las Diferentes Modalidades de Hurto en Colombia
          </h2>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-3xl">
            Plataforma integral de analítica de datos y modelado probabilístico que articula los
            contenidos de <strong>Electiva III (Introducción a la Ciencia de Datos)</strong> y{' '}
            <strong>Estadística Inferencial</strong> sobre{' '}
            <span className="font-semibold text-sky-200">
              {formatInt(auditoria_etl.hechos_totales)} hechos reales
            </span>{' '}
            publicados por la Policía Nacional (DIJIN) en el portal oficial de Datos Abiertos de
            Colombia.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#0f294a] font-semibold text-sm hover:bg-sky-50 transition-colors cursor-pointer shadow-sm"
            >
              <BarChart3 className="w-4 h-4" />
              Explorar Dashboard Interactivo
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('estadistica-inferencial')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500/25 border border-sky-300/40 text-white font-semibold text-sm hover:bg-sky-500/35 transition-colors cursor-pointer"
            >
              <Sigma className="w-4 h-4" />
              Laboratorio de Poisson y Bayes
            </button>
            <button
              type="button"
              onClick={() => onNavigate('presentacion')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-colors cursor-pointer"
            >
              <Presentation className="w-4 h-4" />
              Iniciar Sustentación (18 Diapositivas)
            </button>
          </div>
        </div>

        {/* Patrón decorativo sutil */}
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-sky-400/15 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute right-12 -bottom-24 w-72 h-72 rounded-full bg-blue-300/10 blur-2xl pointer-events-none"
        />
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
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#0f294a]">
              Contextualización del Problema
            </h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            El delito de hurto contra el patrimonio económico constituye uno de los fenómenos de
            mayor impacto sobre la seguridad ciudadana, el sector comercial y la movilidad en
            Colombia. Sin embargo, analizar cifras agregadas sin distinguir entre modalidades,
            territorios, medios utilizados y dinámicas temporales oculta diferencias críticas
            entre grandes urbes (como Bogotá, Medellín y Cali) y ciudades intermedias (como
            Popayán).
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            A partir de los registros públicos de la <strong>DIJIN – Policía Nacional</strong> en{' '}
            <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">datos.gov.co</code>, este
            proyecto transforma tres conjuntos de datos crudos en conocimiento verificable mediante
            limpieza reproducible, estadística descriptiva, modelado predictivo y análisis
            inferencial basado en la <strong>Distribución de Poisson</strong>.
          </p>
        </div>

        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#0f294a]">Objetivos del Proyecto</h3>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
              Objetivo General
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              Analizar el comportamiento estadístico, territorial y temporal de las siete modalidades
              de hurto registradas en Colombia (2010–2026) integrando técnicas de Ciencia de Datos y
              modelos de Estadística Inferencial en una plataforma web interactiva.
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

      {/* Asignaturas y Fuentes Oficiales */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-[#0f294a]">Asignaturas Integradas</h3>
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50">
              <p className="text-xs font-bold uppercase text-blue-700">Asignatura 1</p>
              <p className="text-sm font-bold text-[#0f294a] mt-0.5">
                Electiva III – Introducción a la Ciencia de Datos
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Docente: <strong>Carlos E. Ruiz</strong> · Ciclo CRISP-DM/ETL, calidad de datos,
                análisis descriptivo, tablero BI y componente predictivo.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/50">
              <p className="text-xs font-bold uppercase text-sky-700">Asignatura 2</p>
              <p className="text-sm font-bold text-[#0f294a] mt-0.5">
                Estadística Inferencial (Ingeniería Informática)
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Proyecto de Aula · Experimento aleatorio, axiomas, Teorema de Bayes,{' '}
                <strong>Grupo 2: Distribución de Poisson</strong>, TLC, intervalos de confianza y
                pruebas de hipótesis.
              </p>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Nota de trazabilidad académica: La documentación fuente del proyecto no registra una
              lista nominal de estudiantes ni docente de Estadística Inferencial, por lo que no se
              incluyen nombres ficticios.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-slate-100 text-[#0f294a]">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0f294a]">
                Fuentes Oficiales (Datos Abiertos Colombia)
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">datos.gov.co · API Socrata</span>
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
                    <td className="py-3 pr-3 font-mono text-xs font-semibold text-blue-700">
                      {src.recurso}
                    </td>
                    <td className="py-3 pr-3 text-slate-700">{src.descripcion_corta}</td>
                    <td className="py-3 pr-3 text-right font-mono font-semibold text-[#0f294a] tabular-nums">
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
              className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-colors cursor-pointer"
            >
              <p className="text-xs font-bold text-[#0f294a]">1. Auditoría ETL →</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ver hallazgo de fechas DD/MM/AAAA y nulos
              </p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-colors cursor-pointer"
            >
              <p className="text-xs font-bold text-[#0f294a]">2. Explorar Datos →</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mapa de Colombia y filtros dinámicos
              </p>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('estadistica-inferencial')}
              className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-colors cursor-pointer"
            >
              <p className="text-xs font-bold text-[#0f294a]">3. Modelo Poisson →</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Calculadora interactiva y prueba χ²
              </p>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
