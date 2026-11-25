import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarRange,
  Filter,
  Info,
  Layers,
  MapPin,
  RotateCcw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AllPlatformData, DashboardFilters } from '../types/analytics';
import { aggregateDashboard, MONTH_NAMES_FULL } from '../lib/cubeEngine';
import { CHART_COLORS, formatInt, formatPct } from '../lib/format';
import { KpiCard } from '../components/KpiCard';
import { ColombiaMap } from '../components/ColombiaMap';

interface DashboardModuleProps {
  data: AllPlatformData;
}

const INITIAL_FILTERS: DashboardFilters = {
  anio: 'TODOS',
  mes: 'TODOS',
  departamento: 'TODOS',
  municipio: 'TODOS',
  modalidad: 'TODOS',
  arma: 'TODOS',
  genero: 'TODOS',
};

interface InterpretationBoxProps {
  represents: string;
  behavior: string;
  finding: string;
  limitation: string;
}

const InterpretationBox: React.FC<InterpretationBoxProps> = ({
  represents,
  behavior,
  finding,
  limitation,
}) => (
  <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-xl">
    <div>
      <span className="font-semibold text-[#0f294a]">Qué representa: </span>
      {represents}
    </div>
    <div>
      <span className="font-semibold text-[#0f294a]">Comportamiento observado: </span>
      {behavior}
    </div>
    <div>
      <span className="font-semibold text-blue-700">Hallazgo relevante: </span>
      {finding}
    </div>
    <div>
      <span className="font-semibold text-orange-700">Limitación: </span>
      {limitation}
    </div>
  </div>
);

export const DashboardModule: React.FC<DashboardModuleProps> = ({ data }) => {
  const [filters, setFilters] = useState<DashboardFilters>(INITIAL_FILTERS);
  const [timeView, setTimeView] = useState<'anual' | 'mensual'>('anual');

  const { cubeCore, cubeMun, colombiaMap } = data;

  // Lista dinámica de municipios filtrada por departamento seleccionado
  const availableMunicipios = useMemo(() => {
    if (filters.departamento === 'TODOS') {
      // Top 150 municipios por volumen para mantener ágil el selector
      const tot = new Map<number, number>();
      for (const r of cubeMun.rows) {
        tot.set(r[3], (tot.get(r[3]) ?? 0) + r[5]);
      }
      return Array.from(tot.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 150)
        .map(([idx]) => cubeMun.municipios[idx]);
    }
    const dIdx = cubeMun.departamentos.indexOf(filters.departamento);
    if (dIdx === -1) return [];
    const set = new Set<string>();
    for (const r of cubeMun.rows) {
      if (r[2] === dIdx) set.add(cubeMun.municipios[r[3]]);
    }
    return Array.from(set).sort();
  }, [cubeMun, filters.departamento]);

  const agg = useMemo(
    () => aggregateDashboard(cubeCore, cubeMun, filters),
    [cubeCore, cubeMun, filters]
  );

  const hasActiveFilters = Object.values(filters).some((v) => v !== 'TODOS');

  const updateFilter = <K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K]
  ) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'departamento') {
        next.municipio = 'TODOS';
      }
      if (key === 'municipio' && value !== 'TODOS') {
        // Arma y género no están desagregados en cubeMun, se restablecen para mantener coherencia exacta
        next.arma = 'TODOS';
        next.genero = 'TODOS';
      }
      return next;
    });
  };

  const deptoTop12 = agg.porDepartamento.slice(0, 12);
  const munTop12 = agg.porMunicipio.slice(0, 12);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#0f294a]">
            Dashboard Analítico de Hurtos en Colombia
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Fuente: Policía Nacional (DIJIN) · Datos Abiertos Colombia (2010 – julio de 2026)
          </p>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => setFilters(INITIAL_FILTERS)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-[#0f294a] hover:bg-slate-100 transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-blue-600" />
            Restablecer filtros
          </button>
        )}
      </div>

      {/* Panel de Filtros Interactivos */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-700" />
            <h3 className="text-sm font-bold text-[#0f294a]">Segmentadores Dinámicos</h3>
          </div>
          <span className="text-xs text-slate-500">
            Mostrando{' '}
            <strong className="text-[#0f294a] tabular-nums">
              {formatInt(agg.totalHechos)}
            </strong>{' '}
            hechos registrados
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {/* Año */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Año</label>
            <select
              value={filters.anio}
              onChange={(e) =>
                updateFilter('anio', e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todos (2010–2026)</option>
              {cubeCore.anios.map((a) => (
                <option key={a} value={a}>
                  {a === 2026 ? '2026 (ene–jul)' : a}
                </option>
              ))}
            </select>
          </div>

          {/* Mes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mes</label>
            <select
              value={filters.mes}
              onChange={(e) =>
                updateFilter('mes', e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todos los meses</option>
              {MONTH_NAMES_FULL.map((mName, idx) => (
                <option key={mName} value={idx + 1}>
                  {mName}
                </option>
              ))}
            </select>
          </div>

          {/* Departamento */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Departamento
            </label>
            <select
              value={filters.departamento}
              onChange={(e) => updateFilter('departamento', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todos (33 territorios)</option>
              {cubeCore.departamentos.map((d, idx) => (
                <option key={d} value={d}>
                  {cubeCore.departamentos_bonitos[idx]}
                </option>
              ))}
            </select>
          </div>

          {/* Municipio */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Municipio
            </label>
            <select
              value={filters.municipio}
              onChange={(e) => updateFilter('municipio', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">
                {filters.departamento === 'TODOS' ? 'Todos (Top 150)' : 'Todos del depto.'}
              </option>
              {availableMunicipios.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Modalidad */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Modalidad
            </label>
            <select
              value={filters.modalidad}
              onChange={(e) => updateFilter('modalidad', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todas (7 modalidades)</option>
              {cubeCore.modalidades.map((m, idx) => (
                <option key={m} value={m}>
                  {cubeCore.modalidades_cortas[idx]}
                </option>
              ))}
            </select>
          </div>

          {/* Arma / Medio */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Arma / Medio
            </label>
            <select
              value={filters.arma}
              disabled={agg.usaSoloMunicipio}
              onChange={(e) => updateFilter('arma', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todos los medios</option>
              {cubeCore.armas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Género */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Género</label>
            <select
              value={filters.genero}
              disabled={agg.usaSoloMunicipio}
              onChange={(e) => updateFilter('genero', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todos</option>
              {cubeCore.generos.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {agg.usaSoloMunicipio && (
          <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2">
            <Info className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Al filtrar por un municipio específico ({filters.municipio}), los paneles de Arma/Medio
              y Género se ocultan para preservar exactitud matemática sobre el cubo municipal.
            </span>
          </div>
        )}
      </section>

      {/* KPIs principales dinámicos */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard
          title="Total Hurtos"
          value={formatInt(agg.totalHechos)}
          subtitle={hasActiveFilters ? 'Bajo filtros aplicados' : 'Histórico nacional 2010–2026'}
          icon={ShieldAlert}
          accent="navy"
        />
        <KpiCard
          title="Modalidad Principal"
          value={agg.topModalidad ? agg.topModalidad.corta : 'Sin datos'}
          subtitle={
            agg.topModalidad ? `${formatInt(agg.topModalidad.hechos)} hechos` : undefined
          }
          badge={agg.topModalidad ? formatPct(agg.topModalidad.pct) : undefined}
          badgeTone="neutral"
          icon={Layers}
          accent="blue"
        />
        <KpiCard
          title="Mayor Concentración"
          value={agg.topDepto ? agg.topDepto.nombre : 'Sin datos'}
          subtitle={
            agg.topMunicipio
              ? `Mun. líder: ${agg.topMunicipio.nombre}`
              : undefined
          }
          badge={agg.topDepto ? formatPct(agg.topDepto.pct) : undefined}
          icon={MapPin}
          accent="sky"
        />
        <KpiCard
          title="Periodo Pico"
          value={agg.peakAnio ? String(agg.peakAnio.anio) : '—'}
          subtitle={agg.peakAnio ? `${formatInt(agg.peakAnio.hechos)} hechos` : undefined}
          icon={CalendarRange}
          accent="orange"
        />
        <KpiCard
          title="Variación Interanual"
          value={
            agg.variacionReciente
              ? `${agg.variacionReciente.pct > 0 ? '+' : ''}${formatPct(agg.variacionReciente.pct)}`
              : 'N/D'
          }
          subtitle={agg.variacionReciente?.nota ?? 'Selecciona otro periodo'}
          icon={
            agg.variacionReciente && agg.variacionReciente.pct < 0
              ? TrendingDown
              : TrendingUp
          }
          accent={
            agg.variacionReciente && agg.variacionReciente.pct < 0 ? 'emerald' : 'orange'
          }
          badge={
            agg.variacionReciente
              ? `${agg.variacionReciente.anioAnterior} → ${agg.variacionReciente.anioActual}`
              : undefined
          }
          badgeTone={
            agg.variacionReciente
              ? agg.variacionReciente.pct < 0
                ? 'positive'
                : 'negative'
              : 'neutral'
          }
        />
      </section>

      {agg.totalHechos === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-orange-500 mx-auto" />
          <p className="text-base font-bold text-[#0f294a]">
            No hay hechos registrados para esta combinación de filtros
          </p>
          <p className="text-sm text-slate-500">
            Prueba restablecer o ampliar alguno de los criterios seleccionados.
          </p>
        </div>
      ) : (
        <>
          {/* Fila 1: Modalidades (Barras + Dona) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0f294a]">
                  Comparación de Modalidades de Hurto
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Volumen total de hechos reportados por tipo de hurto (Art. 239 CP)
                </p>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={agg.porModalidad}
                      layout="vertical"
                      margin={{ top: 4, right: 24, left: 10, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => formatInt(v)}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="nombre"
                        width={140}
                        tick={{ fontSize: 11, fill: '#0f172a' }}
                      />
                      <Tooltip
                        formatter={(val: number) => [formatInt(val), 'Hechos']}
                        contentStyle={{ borderRadius: 12, borderColor: '#cbd5e1', fontSize: 12 }}
                      />
                      <Bar dataKey="hechos" radius={[0, 6, 6, 0]}>
                        {agg.porModalidad.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <InterpretationBox
                represents="Distribución absoluta de hechos por cada una de las 7 modalidades registradas."
                behavior="Se evidencia una alta asimetría: dos modalidades dominan el volumen total mientras piratería y entidades financieras representan una fracción menor."
                finding="Entidades Comerciales (583,312) y Motocicletas (497,736) explican cerca del 80% del total nacional."
                limitation="Agrupa denuncias ante la Policía Nacional; modalidades con menor tasa de denuncia pueden estar subrepresentadas."
              />
            </div>

            <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0f294a]">
                  Participación Porcentual por Modalidad
                </h3>
                <p className="text-xs text-slate-500 mb-2">
                  Peso relativo sobre el total filtrado ({formatInt(agg.totalHechos)} hechos)
                </p>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={agg.porModalidad}
                        dataKey="hechos"
                        nameKey="nombre"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={95}
                        paddingAngle={2}
                      >
                        {agg.porModalidad.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number, _name, item) => [
                          `${formatInt(val)} (${formatPct(item.payload.pct)})`,
                          item.payload.nombre,
                        ]}
                        contentStyle={{ borderRadius: 12, borderColor: '#cbd5e1', fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <InterpretationBox
                represents="Proporción porcentual de cada modalidad frente al total del subconjunto consultado."
                behavior="La estructura porcentual cambia drásticamente al filtrar por departamento rural frente a centros urbanos."
                finding="Automotores y Motocicletas superan conjuntamente el 48% de todos los hurtos registrados en la serie."
                limitation="No incluye hurto a personas ni hurto de celulares por no estar publicados en estos 3 recursos."
              />
            </div>
          </div>

          {/* Fila 2: Comportamiento Temporal */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#0f294a]">
                  Comportamiento Temporal de los Registros (2010 – julio 2026)
                </h3>
                <p className="text-xs text-slate-500">
                  Nota: el año 2026 incluye registros consolidados únicamente hasta el 31 de julio de
                  2026
                </p>
              </div>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start">
                <button
                  type="button"
                  onClick={() => setTimeView('anual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    timeView === 'anual'
                      ? 'bg-white text-[#0f294a] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Serie Anual
                </button>
                <button
                  type="button"
                  onClick={() => setTimeView('mensual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    timeView === 'mensual'
                      ? 'bg-white text-[#0f294a] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Serie Mensual (199 meses)
                </button>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {timeView === 'anual' ? (
                  <AreaChart
                    data={agg.porAnio}
                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorHechos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="anio" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis
                      tickFormatter={(v) => formatInt(v)}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <Tooltip
                      formatter={(val: number, _name, item) => [
                        `${formatInt(val)}${item.payload.parcial ? ' (ene–jul)' : ''}`,
                        'Hurtos',
                      ]}
                      contentStyle={{ borderRadius: 12, borderColor: '#cbd5e1', fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="hechos"
                      stroke="#1d4ed8"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorHechos)"
                    />
                  </AreaChart>
                ) : (
                  <LineChart
                    data={agg.porMesSerie}
                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="periodo"
                      minTickGap={28}
                      tick={{ fontSize: 11, fill: '#475569' }}
                    />
                    <YAxis
                      tickFormatter={(v) => formatInt(v)}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <Tooltip
                      formatter={(val: number) => [formatInt(val), 'Hurtos']}
                      contentStyle={{ borderRadius: 12, borderColor: '#cbd5e1', fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="hechos"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
            <InterpretationBox
              represents="Evolución cronológica de los hurtos registrados entre enero de 2010 y julio de 2026."
              behavior="Crecimiento sostenido hasta 2019 (111,632), descenso abrupto en 2020 (83,415) y recuperación progresiva hasta el pico histórico de 2024 (120,702)."
              finding="Entre 2024 y 2025 se observa una reducción del 19.53% a nivel nacional (de 120,702 a 97,123 hechos)."
              limitation="La caída visual de 2026 (54,302) obedece a que el corte oficial solo cubre hasta julio de 2026, no a una reducción anual completa."
            />
          </div>

          {/* Fila 3: Mapa Geográfico de Colombia + Top Departamentos */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0f294a]">
                  Mapa Geográfico de Colombia
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Distribución territorial sobre los 33 departamentos / Bogotá D.C. (DANE)
                </p>
                <ColombiaMap
                  mapData={colombiaMap}
                  countsByDepto={agg.porDepartamento}
                  totalHechos={agg.totalHechos}
                  selectedDepto={filters.departamento}
                  onSelectDepto={(d) => updateFilter('departamento', d)}
                />
              </div>
              <InterpretationBox
                represents="Intensidad de hurtos registrados por división político-administrativa departamental."
                behavior="Fuerte concentración en la región Andina central, el suroccidente (Valle y Cauca) y el Caribe (Atlántico)."
                finding="Bogotá, Antioquia y Valle concentran más del 51% de los hechos registrados."
                limitation="Refleja conteos absolutos y no tasas por cada 100,000 habitantes, por lo que territorios más poblados aparecen más oscuros."
              />
            </div>

            <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0f294a]">
                  Top 12 Departamentos con Mayor Cantidad de Registros
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Comparación directa entre entidades territoriales bajo el filtro activo
                </p>
                <div className="h-[420px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={deptoTop12}
                      layout="vertical"
                      margin={{ top: 4, right: 24, left: 10, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => formatInt(v)}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="nombre"
                        width={130}
                        tick={{ fontSize: 11, fill: '#0f172a' }}
                      />
                      <Tooltip
                        formatter={(val: number, _name, item) => [
                          `${formatInt(val)} (${formatPct(item.payload.pct)})`,
                          'Hechos',
                        ]}
                        contentStyle={{ borderRadius: 12, borderColor: '#cbd5e1', fontSize: 12 }}
                      />
                      <Bar
                        dataKey="hechos"
                        fill="#1d4ed8"
                        radius={[0, 6, 6, 0]}
                        className="cursor-pointer"
                        onClick={(entry) => {
                          if (entry?.key) updateFilter('departamento', entry.key);
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <InterpretationBox
                represents="Ranking departamental ordenado de mayor a menor volumen de hechos."
                behavior="Pendiente pronunciada entre los 3 primeros territorios y el resto del país; Cauca ocupa el puesto 6 nacional (49,812)."
                finding="La suma de los 12 primeros departamentos supera el 82% de todo el fenómeno en Colombia."
                limitation="La capacidad institucional de recepción de denuncias varía entre departamentos urbanos y rurales."
              />
            </div>
          </div>

          {/* Fila 4: Municipios + Evolución comparativa de modalidades */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0f294a]">
                  Top 12 Municipios con Mayor Incidencia
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Comparación municipal (el sufijo CT indica ciudad capital)
                </p>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={munTop12}
                      layout="vertical"
                      margin={{ top: 4, right: 20, left: 6, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => formatInt(v)}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="nombre"
                        width={138}
                        tick={{ fontSize: 10, fill: '#0f172a' }}
                      />
                      <Tooltip
                        formatter={(val: number, _name, item) => [
                          `${formatInt(val)} (${formatPct(item.payload.pct)})`,
                          'Hechos',
                        ]}
                        contentStyle={{ borderRadius: 12, borderColor: '#cbd5e1', fontSize: 12 }}
                      />
                      <Bar dataKey="hechos" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <InterpretationBox
                represents="Volumen de hurtos por municipio en el filtro seleccionado."
                behavior="Las capitales departamentales dominan el ranking; Popayán (CT) figura en el puesto 6 nacional con 23,578 hechos."
                finding="Entre 1,021 municipios, la mediana es 126 hechos frente a una media de 1,326.6, indicando fuerte sesgo positivo."
                limitation="No diferencia entre delitos ocurridos en zona urbana vs rural dispersa del municipio."
              />
            </div>

            <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0f294a]">
                  Evolución Comparativa de las Modalidades en el Tiempo
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Trayectoria anual comparada de las modalidades de hurto (2010–2026*)
                </p>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={agg.evolucionModalidades}
                      margin={{ top: 8, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="anio" tick={{ fontSize: 11, fill: '#475569' }} />
                      <YAxis
                        tickFormatter={(v) => formatInt(v)}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                      />
                      <Tooltip
                        formatter={(val: number) => formatInt(val)}
                        contentStyle={{ borderRadius: 12, borderColor: '#cbd5e1', fontSize: 11 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {agg.modalidadKeysCortas.map((modName, i) => (
                        <Line
                          key={modName}
                          type="monotone"
                          dataKey={modName}
                          stroke={CHART_COLORS[i % CHART_COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <InterpretationBox
                represents="Tendencia simultánea de cada modalidad año a año."
                behavior="Entidades Comerciales lideró con picos fuertes en 2017–2019 y 2024, mientras Motocicletas mantuvo una tendencia ascendente más estable."
                finding="En 2025 el hurto de Motocicletas superó o igualó el peso relativo de Entidades Comerciales en varias regiones."
                limitation="2026 presenta corte parcial a julio; no debe interpretarse como descenso definitivo."
              />
            </div>
          </div>

          {/* Fila 5: Armas/Medios y Género (si no hay municipio único) */}
          {!agg.usaSoloMunicipio && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                <h3 className="text-base font-bold text-[#0f294a]">
                  Distribución por Arma o Medio Empleado
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Top 10 armas o mecanismos reportados en los hechos filtrados
                </p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={agg.porArma.slice(0, 10)}
                      layout="vertical"
                      margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => formatInt(v)}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="nombre"
                        width={175}
                        tick={{ fontSize: 10, fill: '#0f172a' }}
                      />
                      <Tooltip
                        formatter={(val: number, _name, item) => [
                          `${formatInt(val)} (${formatPct(item.payload.pct)})`,
                          'Hechos',
                        ]}
                        contentStyle={{ borderRadius: 12, borderColor: '#cbd5e1', fontSize: 12 }}
                      />
                      <Bar dataKey="hechos" fill="#0f294a" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                <h3 className="text-base font-bold text-[#0f294a]">
                  Distribución por Género Registrado
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Nota: «NO REPORTADO» corresponde principalmente a hurtos contra entidades comerciales o financieras
                </p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={agg.porGenero}
                      margin={{ top: 8, right: 20, left: 10, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: '#0f172a' }} />
                      <YAxis
                        tickFormatter={(v) => formatInt(v)}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                      />
                      <Tooltip
                        formatter={(val: number, _name, item) => [
                          `${formatInt(val)} (${formatPct(item.payload.pct)})`,
                          'Hechos',
                        ]}
                        contentStyle={{ borderRadius: 12, borderColor: '#cbd5e1', fontSize: 12 }}
                      />
                      <Bar dataKey="hechos" radius={[6, 6, 0, 0]}>
                        {agg.porGenero.map((_, i) => (
                          <Cell
                            key={i}
                            fill={['#1d4ed8', '#64748b', '#0ea5e9', '#94a3b8'][i % 4]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
