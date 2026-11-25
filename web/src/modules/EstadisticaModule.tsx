import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Calculator,
  CheckCircle2,
  FlaskConical,
  GitMerge,
  Scale,
  Sigma,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AllPlatformData } from '../types/analytics';
import {
  computeBayesPartition,
  computeHypothesisAndCi,
  computePoissonAnalysis,
  computePoissonClt,
  poissonCdf,
  poissonPmf,
  poissonSf,
} from '../lib/statistics';
import { formatDec, formatInt, formatPct, formatProb } from '../lib/format';

interface EstadisticaModuleProps {
  data: AllPlatformData;
}

type InfTab = 'experimento' | 'bayes' | 'poisson' | 'profundizacion';

export const EstadisticaModule: React.FC<EstadisticaModuleProps> = ({ data }) => {
  const [tab, setTab] = useState<InfTab>('poisson');

  const { inferential, weeklyPoisson } = data;

  // --- Estado Tab 1: Reglas de Probabilidad ---
  const [eventAMod, setEventAMod] = useState<string>(
    'ARTÍCULO 239. HURTO MOTOCICLETAS'
  );
  const [eventBArma, setEventBArma] = useState<string>('ARMA DE FUEGO');

  // --- Estado Tab 2: Bayes ---
  const [bayesMode, setBayesMode] = useState<'datos' | 'simulador'>('datos');
  const [bayesEvidenceType, setBayesEvidenceType] = useState<'arma' | 'depto'>('arma');
  const [bayesEvidenceVal, setBayesEvidenceVal] = useState<string>('LLAVE MAESTRA');
  const [simPrior, setSimPrior] = useState<number>(0.3675);
  const [simLikGivenA, setSimLikGivenA] = useState<number>(0.35);
  const [simLikGivenNotA, setSimLikGivenNotA] = useState<number>(0.12);

  // --- Estado Tab 3: Poisson ---
  const [poissonMode, setPoissonMode] = useState<'datos' | 'manual'>('datos');
  const [scopeId, setScopeId] = useState<string>('MUN::POPAYÁN (CT)');
  const [modPoisson, setModPoisson] = useState<string>('TODOS');
  const [yearPoisson, setYearPoisson] = useState<number>(2025);
  const [umbralPoisson, setUmbralPoisson] = useState<number>(40);
  const [manualLambda, setManualLambda] = useState<number>(12);
  const [manualK, setManualK] = useState<number>(15);
  const [cltWeeks, setCltWeeks] = useState<number>(7);
  const [cltCustomC, setCltCustomC] = useState<number | 'auto'>('auto');

  // --- Estado Tab 4: Profundización IC e Hipótesis ---
  const [yearHist, setYearHist] = useState<number>(2024);
  const [confLevel, setConfLevel] = useState<0.9 | 0.95 | 0.99>(0.95);
  const [marginErr, setMarginErr] = useState<number>(2.0);

  // Cálculos Tab 1: Reglas de Probabilidad
  const probRules = useMemo(() => {
    const N = inferential.total_hechos;
    const modEntry = inferential.modalidades.find((m) => m.key === eventAMod);
    const armaEntry = inferential.armas.find((a) => a.key === eventBArma);
    const nA = modEntry?.count ?? 0;
    const nB = armaEntry?.count ?? 0;
    const nAB = inferential.mod_x_arma[eventAMod]?.[eventBArma] ?? 0;

    const pA = N > 0 ? nA / N : 0;
    const pB = N > 0 ? nB / N : 0;
    const pAB = N > 0 ? nAB / N : 0;
    const pUnion = Math.min(1, pA + pB - pAB);
    const pAc = 1 - pA;
    const pBgivenA = nA > 0 ? nAB / nA : 0;
    const pAgivenB = nB > 0 ? nAB / nB : 0;
    const pIndepProd = pA * pB;
    const indepDiff = Math.abs(pAB - pIndepProd);

    // Segundo evento mutuamente excluyente para ejemplificar unión disjunta
    const altMod = inferential.modalidades.find((m) => m.key !== eventAMod) ?? inferential.modalidades[0];
    const pAlt = N > 0 ? altMod.count / N : 0;

    return {
      N,
      nA,
      nB,
      nAB,
      pA,
      pB,
      pAB,
      pUnion,
      pAc,
      pBgivenA,
      pAgivenB,
      pIndepProd,
      indepDiff,
      esIndependiente: indepDiff < 0.002,
      altMod,
      pAlt,
      pDisjointUnion: pA + pAlt,
    };
  }, [inferential, eventAMod, eventBArma]);

  // Cálculos Tab 2: Bayes
  const bayesReal = useMemo(() => {
    const N = inferential.total_hechos;
    const matrix =
      bayesEvidenceType === 'arma' ? inferential.mod_x_arma : inferential.mod_x_depto;

    const items = inferential.modalidades.map((m) => {
      const prior = N > 0 ? m.count / N : 0;
      const jointCount = matrix[m.key]?.[bayesEvidenceVal] ?? 0;
      const likelihood = m.count > 0 ? jointCount / m.count : 0;
      return {
        label: m.short,
        prior,
        likelihood,
      };
    });

    const res = computeBayesPartition(items);
    const chartData = res.results.map((r) => ({
      modalidad: r.label,
      PriorPct: Number((r.prior * 100).toFixed(2)),
      PosteriorPct: Number((r.posterior * 100).toFixed(2)),
    }));
    return { ...res, chartData };
  }, [inferential, bayesEvidenceType, bayesEvidenceVal]);

  const bayesSim = useMemo(() => {
    return computeBayesPartition([
      { label: 'Evento A (Hipótesis)', prior: simPrior, likelihood: simLikGivenA },
      { label: 'Evento Aᶜ (Complemento)', prior: 1 - simPrior, likelihood: simLikGivenNotA },
    ]);
  }, [simPrior, simLikGivenA, simLikGivenNotA]);

  // Series reales para Tab 3 & 4
  const availableModalitiesForScope = useMemo(() => {
    return weeklyPoisson.modalities.filter((m) => {
      const key = `${scopeId}||${m}`;
      const yrs = weeklyPoisson.series[key];
      if (!yrs) return false;
      const arr = yrs[String(yearPoisson)] ?? [];
      return arr.some((x) => x > 0);
    });
  }, [weeklyPoisson, scopeId, yearPoisson]);

  const activeModKey = availableModalitiesForScope.includes(modPoisson)
    ? modPoisson
    : availableModalitiesForScope[0] ?? 'TODOS';

  const weeklySeriesCurrent = useMemo(() => {
    const key = `${scopeId}||${activeModKey}`;
    return weeklyPoisson.series[key]?.[String(yearPoisson)] ?? [];
  }, [weeklyPoisson, scopeId, activeModKey, yearPoisson]);

  const weeklySeriesHist = useMemo(() => {
    const key = `${scopeId}||${activeModKey}`;
    return weeklyPoisson.series[key]?.[String(yearHist)] ?? [];
  }, [weeklyPoisson, scopeId, activeModKey, yearHist]);

  // Ajustar umbral sugerido cuando cambia el promedio de la serie
  const effectiveThreshold = useMemo(() => {
    if (poissonMode === 'manual') return manualK;
    return umbralPoisson;
  }, [poissonMode, manualK, umbralPoisson]);

  const poissonAnalysis = useMemo(() => {
    if (poissonMode === 'datos' && weeklySeriesCurrent.length > 0) {
      const mean = weeklySeriesCurrent.reduce((a, b) => a + b, 0) / weeklySeriesCurrent.length;
      const kPt = Math.max(1, Math.round(mean * 0.85));
      const kLo = Math.max(0, Math.floor(mean * 0.65));
      const kHi = Math.max(kLo + 2, Math.round(mean * 1.1));
      return computePoissonAnalysis(weeklySeriesCurrent, effectiveThreshold, kPt, kLo, kHi);
    }
    return null;
  }, [poissonMode, weeklySeriesCurrent, effectiveThreshold]);

  const manualPmfChart = useMemo(() => {
    const sd = Math.sqrt(Math.max(manualLambda, 1));
    const start = Math.max(0, Math.floor(manualLambda - 3.5 * sd));
    const end = Math.min(start + 70, Math.ceil(manualLambda + 3.5 * sd));
    const pts = [];
    for (let k = start; k <= end; k++) {
      pts.push({
        k,
        poisson: poissonPmf(k, manualLambda),
        acumulada: poissonCdf(k, manualLambda),
      });
    }
    return pts;
  }, [manualLambda]);

  const activeLambda =
    poissonMode === 'datos' && poissonAnalysis ? poissonAnalysis.lambda : manualLambda;

  const cltResult = useMemo(() => {
    const customVal = cltCustomC === 'auto' ? undefined : cltCustomC;
    return computePoissonClt(activeLambda, cltWeeks, customVal);
  }, [activeLambda, cltWeeks, cltCustomC]);

  const hypothesisResult = useMemo(() => {
    return computeHypothesisAndCi(weeklySeriesCurrent, weeklySeriesHist, confLevel, marginErr);
  }, [weeklySeriesCurrent, weeklySeriesHist, confLevel, marginErr]);

  const weeklyChartData = useMemo(
    () =>
      weeklySeriesCurrent.map((val, idx) => ({
        semana: `S${idx + 1}`,
        hurtos: val,
      })),
    [weeklySeriesCurrent]
  );

  const handleScopeChange = (newScope: string) => {
    setScopeId(newScope);
    const key = `${newScope}||TODOS`;
    const arr = weeklyPoisson.series[key]?.[String(yearPoisson)] ?? [];
    if (arr.length > 0) {
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      setUmbralPoisson(Math.max(1, Math.round(mean * 1.1)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Estadística Inferencial · Proyecto de Aula (Grupo 2: Distribución de Poisson)
            </span>
            <h2 className="text-2xl font-bold text-[#0f294a] mt-1">
              Modelado Probabilístico e Inferencia Estadística
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Ejercicios resueltos, fórmulas formales y calculadoras interactivas alimentadas con
              los {formatInt(inferential.total_hechos)} hechos reales de Colombia.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 self-start">
            <Sigma className="w-4 h-4" />
            Tema Asignado: Grupo 2 · Poisson
          </span>
        </div>

        {/* Sub-navegación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            { id: 'experimento' as InfTab, label: '1. Experimento y Reglas', sub: 'Ω, Unión, Intersección, Indep.' },
            { id: 'bayes' as InfTab, label: '2. Condicional y Bayes', sub: 'Prior → A Posteriori interactivo' },
            { id: 'poisson' as InfTab, label: '3. Poisson (Grupo 2) y TLC', sub: 'Lab. semanal real + Bondad χ²' },
            { id: 'profundizacion' as InfTab, label: '4. IC y Contraste (Opcional)', sub: 'Unidades 3 y 4 de la guía' },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-[#0f294a] text-white border-[#0f294a] shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50/50 hover:border-blue-200'
                }`}
              >
                <p className="text-xs font-bold">{t.label}</p>
                <p className={`text-[11px] mt-0.5 ${active ? 'text-sky-200' : 'text-slate-500'}`}>
                  {t.sub}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: Experimento Aleatorio y Reglas de Probabilidad */}
      {tab === 'experimento' && (
        <div className="space-y-6">
          {/* Formulación del Experimento */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-blue-700" />
              <h3 className="text-lg font-bold text-[#0f294a]">
                1. Formulación del Experimento Aleatorio
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-bold uppercase text-blue-700 mb-1">Fenómeno Aleatorio</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ocurrencia e intensidad de los hechos de hurto denunciados en Colombia según
                  modalidad, ubicación territorial, arma empleada y periodo de tiempo.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-bold uppercase text-sky-700 mb-1">
                  Experimentos (ε₁ y ε₂)
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>ε₁ (Conteo semanal):</strong> Observar una semana en un municipio y
                  contar hurtos X.<br />
                  <strong>ε₂ (Registro):</strong> Extraer al azar un hecho de la base (N ={' '}
                  {formatInt(inferential.total_hechos)}).
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-bold uppercase text-emerald-700 mb-1">
                  Espacio Muestral (Ω)
                </p>
                <p className="text-xs text-slate-600 leading-relaxed font-mono">
                  Ω₁ = {'{0, 1, 2, 3, ...}'} = ℤ≥₀
                  <br />
                  Ω₂ = {'{(mod, depto, arma, gen)}'} (|Ω₂| = 1,354,442)
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-bold uppercase text-orange-700 mb-1">Eventos de Interés</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A: Modalidad seleccionada<br />
                  B: Arma / medio empleado<br />
                  E: Semana con X ≥ umbral de alerta
                </p>
              </div>
            </div>
          </div>

          {/* Calculadora y desarrollo paso a paso de Reglas */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#0f294a]">
                  2. Reglas de Probabilidad Aplicadas a Datos Reales
                </h3>
                <p className="text-xs text-slate-500">
                  Selecciona un evento A (modalidad) y un evento B (arma/medio) para recalcular
                  todas las reglas paso a paso sobre N = {formatInt(probRules.N)} registros.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Evento A (Modalidad)
                  </label>
                  <select
                    value={eventAMod}
                    onChange={(e) => setEventAMod(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium"
                  >
                    {inferential.modalidades.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.short} ({formatInt(m.count)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Evento B (Arma/Medio)
                  </label>
                  <select
                    value={eventBArma}
                    onChange={(e) => setEventBArma(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium"
                  >
                    {inferential.armas.map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.key} ({formatInt(a.count)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Tarjetas resumen de conteos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                <p className="text-[11px] text-slate-500">P(A) = n(A)/N</p>
                <p className="text-lg font-bold font-mono text-[#0f294a]">
                  {formatProb(probRules.pA)}
                </p>
                <p className="text-[10px] text-slate-500">n(A) = {formatInt(probRules.nA)}</p>
              </div>
              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100">
                <p className="text-[11px] text-slate-500">P(B) = n(B)/N</p>
                <p className="text-lg font-bold font-mono text-[#0f294a]">
                  {formatProb(probRules.pB)}
                </p>
                <p className="text-[10px] text-slate-500">n(B) = {formatInt(probRules.nB)}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <p className="text-[11px] text-slate-500">P(A ∩ B) = n(A∩B)/N</p>
                <p className="text-lg font-bold font-mono text-emerald-800">
                  {formatProb(probRules.pAB)}
                </p>
                <p className="text-[10px] text-slate-500">n(A∩B) = {formatInt(probRules.nAB)}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-100">
                <p className="text-[11px] text-slate-500">P(B | A)</p>
                <p className="text-lg font-bold font-mono text-orange-800">
                  {formatProb(probRules.pBgivenA)}
                </p>
                <p className="text-[10px] text-slate-500">
                  {formatPct(probRules.pBgivenA * 100)} dentro de A
                </p>
              </div>
            </div>

            {/* 4 Reglas desarrolladas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Adición */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <p className="text-xs font-bold uppercase text-blue-700">
                  Regla de la Adición (Unión)
                </p>
                <p className="text-xs text-slate-600">
                  Probabilidad de que ocurra la modalidad A, el medio B, o ambos simultáneamente.
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-xs text-[#0f294a]">
                  P(A ∪ B) = P(A) + P(B) − P(A ∩ B)
                </div>
                <p className="text-xs font-mono text-slate-700">
                  = {formatProb(probRules.pA)} + {formatProb(probRules.pB)} −{' '}
                  {formatProb(probRules.pAB)} ={' '}
                  <strong className="text-blue-700">{formatProb(probRules.pUnion)}</strong> (
                  {formatPct(probRules.pUnion * 100)})
                </p>
                <p className="text-[11px] text-slate-500">
                  Nota: Entre dos modalidades distintas (ej. A y {probRules.altMod.short}), son
                  mutuamente excluyentes: P(A ∪ A₂) = {formatProb(probRules.pA)} +{' '}
                  {formatProb(probRules.pAlt)} = {formatProb(probRules.pDisjointUnion)}.
                </p>
              </div>

              {/* Multiplicación */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <p className="text-xs font-bold uppercase text-sky-700">
                  Regla de la Multiplicación (Intersección)
                </p>
                <p className="text-xs text-slate-600">
                  Probabilidad conjunta de seleccionar un hecho que sea de modalidad A y use el
                  medio B.
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-xs text-[#0f294a]">
                  P(A ∩ B) = P(A) · P(B | A)
                </div>
                <p className="text-xs font-mono text-slate-700">
                  = {formatProb(probRules.pA)} × {formatProb(probRules.pBgivenA)} ={' '}
                  <strong className="text-sky-700">{formatProb(probRules.pAB)}</strong> (
                  {formatInt(probRules.nAB)} casos)
                </p>
                <p className="text-[11px] text-slate-500">
                  Interpretación: El {formatPct(probRules.pAB * 100)} de todos los hurtos del país
                  combinan exactamente esta modalidad y este medio.
                </p>
              </div>

              {/* Complemento */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <p className="text-xs font-bold uppercase text-emerald-700">
                  Regla del Complemento
                </p>
                <p className="text-xs text-slate-600">
                  Probabilidad de que un hecho seleccionado NO pertenezca a la modalidad A.
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-xs text-[#0f294a]">
                  P(Aᶜ) = 1 − P(A)
                </div>
                <p className="text-xs font-mono text-slate-700">
                  = 1 − {formatProb(probRules.pA)} ={' '}
                  <strong className="text-emerald-700">{formatProb(probRules.pAc)}</strong> (
                  {formatPct(probRules.pAc * 100)})
                </p>
                <p className="text-[11px] text-slate-500">
                  Corresponde a {formatInt(probRules.N - probRules.nA)} registros distribuidos en las
                  otras 6 modalidades.
                </p>
              </div>

              {/* Independencia */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <p className="text-xs font-bold uppercase text-orange-700">
                  Evaluación de Independencia Estadística
                </p>
                <p className="text-xs text-slate-600">
                  Dos eventos son independientes si y solo si P(A ∩ B) = P(A) · P(B).
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-xs text-[#0f294a]">
                  P(A)·P(B) = {formatProb(probRules.pIndepProd)} vs P(A∩B) ={' '}
                  {formatProb(probRules.pAB)}
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  Diferencia absoluta: {formatProb(probRules.indepDiff)} →{' '}
                  <span
                    className={
                      probRules.esIndependiente ? 'text-emerald-700' : 'text-orange-700'
                    }
                  >
                    {probRules.esIndependiente
                      ? 'Cercanos a independencia'
                      : 'Eventos DEPENDIENTES (P(A∩B) ≠ P(A)·P(B))'}
                  </span>
                </p>
                <p className="text-[11px] text-slate-500">
                  En los datos reales, el tipo de arma utilizada depende fuertemente de la modalidad
                  del hurto (por ejemplo, llave maestra en vehículos vs palancas en residencias).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Probabilidad Condicional y Teorema de Bayes */}
      {tab === 'bayes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-blue-700" />
                  <h3 className="text-lg font-bold text-[#0f294a]">
                    3. Probabilidad Condicional y Teorema de Bayes
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Actualización de probabilidades previas P(Mᵢ) tras observar evidencia B mediante
                  P(Mᵢ | B) = [P(B | Mᵢ)·P(Mᵢ)] / Σ P(B | Mⱼ)·P(Mⱼ).
                </p>
              </div>

              <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start">
                <button
                  type="button"
                  onClick={() => setBayesMode('datos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    bayesMode === 'datos' ? 'bg-white text-[#0f294a] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Datos Reales (7 Modalidades)
                </button>
                <button
                  type="button"
                  onClick={() => setBayesMode('simulador')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    bayesMode === 'simulador'
                      ? 'bg-white text-[#0f294a] shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Simulador Interactivo
                </button>
              </div>
            </div>

            {bayesMode === 'datos' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Tipo de Evidencia Observada (B)
                    </label>
                    <select
                      value={bayesEvidenceType}
                      onChange={(e) => {
                        const t = e.target.value as 'arma' | 'depto';
                        setBayesEvidenceType(t);
                        setBayesEvidenceVal(
                          t === 'arma'
                            ? inferential.armas[0].key
                            : inferential.departamentos[0].key
                        );
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium"
                    >
                      <option value="arma">Arma o Medio Empleado</option>
                      <option value="depto">Departamento de Ocurrencia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Evidencia Específica (B)
                    </label>
                    <select
                      value={bayesEvidenceVal}
                      onChange={(e) => setBayesEvidenceVal(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium"
                    >
                      {bayesEvidenceType === 'arma'
                        ? inferential.armas.map((a) => (
                            <option key={a.key} value={a.key}>
                              {a.key} ({formatInt(a.count)} hechos)
                            </option>
                          ))
                        : inferential.departamentos.map((d) => (
                            <option key={d.key} value={d.key}>
                              {d.label} ({formatInt(d.count)} hechos)
                            </option>
                          ))}
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs sm:text-sm text-[#0f294a]">
                  <strong>Pregunta Bayesiana:</strong> Sabiendo que el hecho reportó{' '}
                  <span className="font-mono font-bold text-blue-700">{bayesEvidenceVal}</span>{' '}
                  (probabilidad marginal P(B) ={' '}
                  <strong className="font-mono">{formatProb(bayesReal.evidence)}</strong>), ¿cómo
                  cambia la probabilidad a posteriori de cada modalidad frente a su probabilidad
                  previa nacional?
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  <div className="xl:col-span-7 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2 pr-3 font-semibold">Modalidad (Mᵢ)</th>
                          <th className="py-2 pr-3 font-semibold text-right">Previa P(Mᵢ)</th>
                          <th className="py-2 pr-3 font-semibold text-right">Verosim. P(B|Mᵢ)</th>
                          <th className="py-2 pr-3 font-semibold text-right">Conjunta P(B∩Mᵢ)</th>
                          <th className="py-2 font-semibold text-right">Posteriori P(Mᵢ|B)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bayesReal.results.map((r) => (
                          <tr key={r.label} className="hover:bg-slate-50">
                            <td className="py-2.5 pr-3 font-medium text-[#0f294a]">{r.label}</td>
                            <td className="py-2.5 pr-3 text-right font-mono">
                              {formatProb(r.prior)}
                            </td>
                            <td className="py-2.5 pr-3 text-right font-mono">
                              {formatProb(r.likelihood)}
                            </td>
                            <td className="py-2.5 pr-3 text-right font-mono">
                              {formatProb(r.joint)}
                            </td>
                            <td className="py-2.5 text-right font-mono font-bold text-blue-700">
                              {formatProb(r.posterior)} ({formatPct(r.posterior * 100)})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="xl:col-span-5 h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={bayesReal.chartData}
                        layout="vertical"
                        margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <XAxis type="number" unit="%" tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="modalidad" width={115} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: number) => `${v}%`} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="PriorPct" name="Previa P(Mᵢ)" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="PosteriorPct" name="Posteriori P(Mᵢ|B)" fill="#1d4ed8" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Probabilidad Previa P(A)</span>
                      <span className="font-mono text-blue-700">{formatProb(simPrior, 3)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.01}
                      max={0.99}
                      step={0.01}
                      value={simPrior}
                      onChange={(e) => setSimPrior(Number(e.target.value))}
                      className="w-full accent-blue-700"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Verosimilitud P(B | A)</span>
                      <span className="font-mono text-blue-700">{formatProb(simLikGivenA, 3)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.01}
                      max={0.99}
                      step={0.01}
                      value={simLikGivenA}
                      onChange={(e) => setSimLikGivenA(Number(e.target.value))}
                      className="w-full accent-blue-700"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Falso positivo P(B | Aᶜ)</span>
                      <span className="font-mono text-orange-700">
                        {formatProb(simLikGivenNotA, 3)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.01}
                      max={0.99}
                      step={0.01}
                      value={simLikGivenNotA}
                      onChange={(e) => setSimLikGivenNotA(Number(e.target.value))}
                      className="w-full accent-orange-600"
                    />
                  </div>
                </div>

                <div className="lg:col-span-7 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="text-sm font-bold text-[#0f294a]">
                    Resultado de Actualización Bayesiana
                  </h4>
                  <div className="p-3 rounded-lg bg-slate-50 font-mono text-xs text-slate-700">
                    P(B) = P(B|A)·P(A) + P(B|Aᶜ)·P(Aᶜ) ={' '}
                    <strong>{formatProb(bayesSim.evidence)}</strong>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <p className="text-xs text-blue-700 font-semibold">Posteriori P(A | B)</p>
                      <p className="text-2xl font-bold font-mono text-[#0f294a] mt-1">
                        {formatPct(bayesSim.results[0].posterior * 100)}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Previa era {formatPct(simPrior * 100)}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-600 font-semibold">Posteriori P(Aᶜ | B)</p>
                      <p className="text-2xl font-bold font-mono text-slate-800 mt-1">
                        {formatPct(bayesSim.results[1].posterior * 100)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Complemento posterior
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Distribución de Poisson (Grupo 2) & TLC */}
      {tab === 'poisson' && (
        <div className="space-y-6">
          {/* Marco teórico de Poisson */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase text-emerald-700">
                  Distribución Asignada al Grupo 2 (Guía de Estadística Inferencial)
                </span>
                <h3 className="text-lg font-bold text-[#0f294a]">
                  Distribución de Poisson: Tasa de Ocurrencia Semanal de Hurtos
                </h3>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 text-sky-300 font-mono text-xs sm:text-sm">
                P(X = k) = (e⁻λ · λᵏ) / k! &nbsp;|&nbsp; E[X] = Var(X) = λ
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-[#0f294a] block mb-1">Concepto y Características</strong>
                Modela el conteo de eventos discretos (hurtos) en un intervalo fijo de tiempo (1
                semana) o espacio, parametrizado únicamente por la tasa media λ &gt; 0.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-[#0f294a] block mb-1">Condiciones de Aplicación</strong>
                (1) Tasa promedio λ estable en el periodo, (2) independencia entre semanas o
                subintervalos, (3) probabilidad proporcional a la longitud del intervalo.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong className="text-[#0f294a] block mb-1">Diagnóstico de Dispersión</strong>
                Si la razón s² / x̄ ≈ 1 hay equidispersión (ajuste Poisson ideal). Si s² / x̄ &gt; 1.5
                existe sobredispersión por estacionalidad o heterogeneidad.
              </div>
            </div>

            {/* Nota comparativa Popayán MDY vs DMY del notebook */}
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Trazabilidad con el notebook Colab (Popayán 2025):</strong> En el notebook
                original (parseo MM/DD/AAAA), Popayán 2025 arrojaba{' '}
                {weeklyPoisson.notebook_comparison_popayan_2025.notebook_mdy.hechos} hechos (λ ={' '}
                {weeklyPoisson.notebook_comparison_popayan_2025.notebook_mdy.lambda}, s²/x̄ ={' '}
                {weeklyPoisson.notebook_comparison_popayan_2025.notebook_mdy.dispersion}). Tras
                corregir el formato real DD/MM/AAAA, se recuperan los{' '}
                <strong>
                  {weeklyPoisson.notebook_comparison_popayan_2025.corregido_dmy.hechos} hechos reales
                </strong>{' '}
                (λ = {weeklyPoisson.notebook_comparison_popayan_2025.corregido_dmy.lambda}, s²/x̄ ={' '}
                {weeklyPoisson.notebook_comparison_popayan_2025.corregido_dmy.dispersion}). ¡Prueba
                seleccionar <em>Popayán (CT)</em> + <em>Hurto Automotores (2025)</em> abajo para
                observar equidispersión casi perfecta (s²/x̄ ≈ 0.96)!
              </div>
            </div>
          </div>

          {/* Laboratorio interactivo de Poisson */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-700" />
                <h3 className="text-base font-bold text-[#0f294a]">
                  Calculadora y Laboratorio de Poisson
                </h3>
              </div>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start">
                <button
                  type="button"
                  onClick={() => setPoissonMode('datos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    poissonMode === 'datos' ? 'bg-white text-[#0f294a] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Series Semanales Reales
                </button>
                <button
                  type="button"
                  onClick={() => setPoissonMode('manual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    poissonMode === 'manual' ? 'bg-white text-[#0f294a] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Parámetros Manuales (λ, k)
                </button>
              </div>
            </div>

            {poissonMode === 'datos' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Territorio / Municipio
                    </label>
                    <select
                      value={scopeId}
                      onChange={(e) => handleScopeChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium"
                    >
                      {weeklyPoisson.scopes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Modalidad
                    </label>
                    <select
                      value={activeModKey}
                      onChange={(e) => setModPoisson(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium"
                    >
                      {availableModalitiesForScope.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Año de Estudio
                    </label>
                    <select
                      value={yearPoisson}
                      onChange={(e) => setYearPoisson(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium"
                    >
                      {weeklyPoisson.years.map((y) => (
                        <option key={y} value={y}>
                          {y === 2026 ? '2026 (30 semanas ene–jul)' : y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Umbral de Alerta (k)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={umbralPoisson}
                      onChange={(e) => setUmbralPoisson(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-semibold"
                    />
                  </div>
                </div>

                {poissonAnalysis && (
                  <>
                    {/* Métricas reales */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Semanas (n)</span>
                        <strong className="text-lg font-mono text-[#0f294a]">
                          {poissonAnalysis.n}
                        </strong>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Total Hechos</span>
                        <strong className="text-lg font-mono text-[#0f294a]">
                          {formatInt(poissonAnalysis.totalHechos)}
                        </strong>
                      </div>
                      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                        <span className="text-[11px] text-blue-700 block">Tasa λ (x̄)</span>
                        <strong className="text-lg font-mono text-blue-800">
                          {formatDec(poissonAnalysis.lambda)}
                        </strong>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Varianza (s²)</span>
                        <strong className="text-lg font-mono text-[#0f294a]">
                          {formatDec(poissonAnalysis.varianza)}
                        </strong>
                      </div>
                      <div
                        className={`p-3.5 rounded-xl border ${
                          poissonAnalysis.sobredisperso
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-emerald-50 border-emerald-200'
                        }`}
                      >
                        <span className="text-[11px] text-slate-600 block">Razón s² / λ</span>
                        <strong
                          className={`text-lg font-mono ${
                            poissonAnalysis.sobredisperso ? 'text-orange-700' : 'text-emerald-700'
                          }`}
                        >
                          {formatDec(poissonAnalysis.dispersionRatio)}
                        </strong>
                      </div>
                      <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200">
                        <span className="text-[11px] text-sky-700 block">Alerta 5% (k*)</span>
                        <strong className="text-lg font-mono text-sky-900">
                          X ≥ {poissonAnalysis.kAlerta5}
                        </strong>
                      </div>
                    </div>

                    {/* Gráficos: Serie semanal y Observado vs Poisson PMF */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-bold text-[#0f294a] mb-2">
                          Serie Semanal Observada ({yearPoisson})
                        </h4>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weeklyChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="semana" minTickGap={16} tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <ReferenceLine
                                y={poissonAnalysis.lambda}
                                stroke="#1d4ed8"
                                strokeDasharray="4 4"
                                label={{
                                  value: `λ=${poissonAnalysis.lambda.toFixed(1)}`,
                                  fontSize: 10,
                                  fill: '#1d4ed8',
                                }}
                              />
                              <ReferenceLine
                                y={effectiveThreshold}
                                stroke="#f97316"
                                strokeDasharray="3 3"
                              />
                              <Line
                                type="monotone"
                                dataKey="hurtos"
                                name="Hurtos/semana"
                                stroke="#0f294a"
                                strokeWidth={2}
                                dot={{ r: 2 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-[#0f294a] mb-2">
                          Frecuencia Observada vs Modelo Poisson(λ = {formatDec(poissonAnalysis.lambda)})
                        </h4>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={poissonAnalysis.pmfComparativa}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="k" tick={{ fontSize: 10 }} />
                              <YAxis tickFormatter={(v) => v.toFixed(2)} tick={{ fontSize: 10 }} />
                              <Tooltip
                                formatter={(val: number, name: string) => [val.toFixed(4), name]}
                              />
                              <Legend wrapperStyle={{ fontSize: 11 }} />
                              <Bar
                                dataKey="observado"
                                name="Frecuencia observada"
                                fill="#93c5fd"
                                radius={[4, 4, 0, 0]}
                              />
                              <Line
                                type="monotone"
                                dataKey="poisson"
                                name="PMF Poisson teórica"
                                stroke="#0f294a"
                                strokeWidth={2.5}
                                dot={{ r: 2.5 }}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Tabla de eventos y prueba Chi2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-7 overflow-x-auto">
                        <h4 className="text-sm font-bold text-[#0f294a] mb-2">
                          Probabilidades Calculadas con Poisson(λ = {formatDec(poissonAnalysis.lambda)})
                        </h4>
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="py-2 pr-3 font-semibold">Evento</th>
                              <th className="py-2 pr-3 font-semibold">Interpretación</th>
                              <th className="py-2 font-semibold text-right">Probabilidad</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {poissonAnalysis.tablaEventos.map((ev) => (
                              <tr key={ev.evento}>
                                <td className="py-2.5 pr-3 font-mono font-bold text-[#0f294a]">
                                  {ev.evento}
                                </td>
                                <td className="py-2.5 pr-3 text-slate-600">{ev.descripcion}</td>
                                <td className="py-2.5 text-right font-mono font-bold text-blue-700">
                                  {formatProb(ev.probabilidad)} ({formatPct(ev.probabilidad * 100)})
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="text-xs text-slate-600 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <strong>Comparación empírica del umbral (X ≥ {effectiveThreshold}):</strong>{' '}
                          Proporción real de semanas ={' '}
                          <span className="font-mono font-bold">
                            {formatProb(poissonAnalysis.proporcionRealUmbral, 3)}
                          </span>{' '}
                          vs Modelo Poisson ={' '}
                          <span className="font-mono font-bold">
                            {formatProb(poissonAnalysis.probModeloUmbral, 3)}
                          </span>
                          .
                        </p>
                      </div>

                      <div className="lg:col-span-5 p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                        <h4 className="text-sm font-bold text-[#0f294a]">
                          Prueba χ² de Bondad de Ajuste (Celda 9.5)
                        </h4>
                        {poissonAnalysis.chi2Test.valido ? (
                          <>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                                <span className="text-[10px] text-slate-500 block">Clases</span>
                                <strong className="font-mono text-sm">
                                  {poissonAnalysis.chi2Test.clases}
                                </strong>
                              </div>
                              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                                <span className="text-[10px] text-slate-500 block">χ² (gl={poissonAnalysis.chi2Test.df})</span>
                                <strong className="font-mono text-sm">
                                  {formatDec(poissonAnalysis.chi2Test.chi2)}
                                </strong>
                              </div>
                              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                                <span className="text-[10px] text-slate-500 block">Valor-p</span>
                                <strong className="font-mono text-sm text-blue-700">
                                  {formatProb(poissonAnalysis.chi2Test.pValor)}
                                </strong>
                              </div>
                            </div>
                            <div
                              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                                poissonAnalysis.chi2Test.aceptaPoisson
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                  : 'bg-orange-50 border-orange-200 text-orange-900'
                              }`}
                            >
                              {poissonAnalysis.chi2Test.aceptaPoisson ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                              )}
                              <span>
                                {poissonAnalysis.chi2Test.aceptaPoisson
                                  ? 'Valor-p ≥ 0.05: No se rechaza H₀. El ajuste Poisson es estadísticamente aceptable para esta serie.'
                                  : 'Valor-p < 0.05: Se rechaza el ajuste Poisson puro (presencia de sobredispersión o heterogeneidad temporal).'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-slate-500">
                            No aplicable: {poissonAnalysis.chi2Test.motivo}.
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Modo manual */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Parámetro λ (media semanal)</span>
                      <span className="font-mono text-blue-700">{manualLambda}</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={60}
                      step={0.5}
                      value={manualLambda}
                      onChange={(e) => setManualLambda(Number(e.target.value))}
                      className="w-full accent-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Valor objetivo k</label>
                    <input
                      type="number"
                      min={0}
                      max={150}
                      value={manualK}
                      onChange={(e) => setManualK(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                    <div className="flex justify-between">
                      <span>P(X = {manualK})</span>
                      <strong className="font-mono text-[#0f294a]">
                        {formatProb(poissonPmf(manualK, manualLambda))}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>P(X ≤ {manualK})</span>
                      <strong className="font-mono text-[#0f294a]">
                        {formatProb(poissonCdf(manualK, manualLambda))}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>P(X ≥ {manualK})</span>
                      <strong className="font-mono text-blue-700">
                        {formatProb(poissonSf(manualK - 1, manualLambda))}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-8 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={manualPmfChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="k" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => v.toFixed(5)} />
                      <Bar dataKey="poisson" name="PMF P(X=k)" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Suma de m semanas y Teorema del Límite Central */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0f294a]">
                  Suma de Semanas Sₘ ~ Poisson(m·λ) y Aproximación Normal (TLC · Celda 9.3)
                </h3>
                <p className="text-xs text-slate-500">
                  Propiedad reproductiva de Poisson y Teorema del Límite Central con corrección de
                  continuidad
                </p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <label className="text-xs font-semibold text-slate-600">Semanas (m):</label>
                <input
                  type="number"
                  min={2}
                  max={52}
                  value={cltWeeks}
                  onChange={(e) => {
                    setCltWeeks(Math.max(2, Math.min(52, Number(e.target.value) || 7)));
                    setCltCustomC('auto');
                  }}
                  className="w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-mono"
                />
                <label className="text-xs font-semibold text-slate-600 ml-2">Umbral c:</label>
                <input
                  type="number"
                  value={cltCustomC === 'auto' ? cltResult.c : cltCustomC}
                  onChange={(e) => setCltCustomC(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Tasa acumulada m·λ</span>
                <strong className="text-lg font-mono text-[#0f294a]">
                  {formatDec(cltResult.lamM)}
                </strong>
                <span className="text-[11px] text-slate-400 block">
                  σ = √(m·λ) = {formatDec(cltResult.sigmaM)}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-blue-700 block">Exacta Poisson P(Sₘ &gt; {cltResult.c})</span>
                <strong className="text-lg font-mono text-blue-900">
                  {formatProb(cltResult.exacta)}
                </strong>
              </div>
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
                <span className="text-sky-700 block">Normal TLC (z = {formatDec(cltResult.z)})</span>
                <strong className="text-lg font-mono text-sky-900">
                  {formatProb(cltResult.normalAprox)}
                </strong>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-700 block">Error absoluto |Δ|</span>
                <strong className="text-lg font-mono text-emerald-900">
                  {formatProb(cltResult.diferencia)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Profundización Opcional (Unidades 3 y 4) */}
      {tab === 'profundizacion' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 mb-1">
                  Componente Opcional de Profundización (Unidades 3 y 4 de la Guía)
                </span>
                <h3 className="text-lg font-bold text-[#0f294a]">
                  Estimación por Intervalos de Confianza y Contraste de Hipótesis
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aplicado sobre la serie semanal real activa:{' '}
                  <strong>{weeklyPoisson.scopes.find((s) => s.id === scopeId)?.label}</strong> ·{' '}
                  <strong>{activeModKey}</strong>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={scopeId}
                  onChange={(e) => handleScopeChange(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium"
                >
                  {weeklyPoisson.scopes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <select
                  value={yearPoisson}
                  onChange={(e) => setYearPoisson(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium"
                >
                  {weeklyPoisson.years.map((y) => (
                    <option key={y} value={y}>
                      Evaluado: {y}
                    </option>
                  ))}
                </select>
                <select
                  value={yearHist}
                  onChange={(e) => setYearHist(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium"
                >
                  {weeklyPoisson.years.map((y) => (
                    <option key={y} value={y}>
                      Histórico (λ₀): {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Unidad 3: Intervalos de Confianza y Tamaño de Muestra */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-700" />
                    <h4 className="text-sm font-bold text-[#0f294a]">
                      Unidad 3 · Intervalo de Confianza para λ y Tamaño de Muestra
                    </h4>
                  </div>
                  <select
                    value={confLevel}
                    onChange={(e) => setConfLevel(Number(e.target.value) as 0.9 | 0.95 | 0.99)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold"
                  >
                    <option value={0.9}>NC 90%</option>
                    <option value={0.95}>NC 95%</option>
                    <option value={0.99}>NC 99%</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 font-mono text-xs text-[#0f294a]">
                  IC = x̄ ± z_(α/2) · √(x̄ / n) &nbsp;|&nbsp; n* = ⌈(z_(α/2) · s / E)²⌉
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-500 block">Estimación puntual (x̄)</span>
                    <strong className="text-lg font-mono text-[#0f294a]">
                      {formatDec(hypothesisResult.xBar)}
                    </strong>
                    <span className="text-[11px] text-slate-400 block">
                      n = {hypothesisResult.n} semanas ({yearPoisson})
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <span className="text-blue-700 block">
                      IC {Math.round(confLevel * 100)}% (Poisson)
                    </span>
                    <strong className="text-sm font-mono text-blue-900">
                      [{formatDec(hypothesisResult.icPoisson[0])} ;{' '}
                      {formatDec(hypothesisResult.icPoisson[1])}]
                    </strong>
                    <span className="text-[11px] text-slate-500 block">
                      Empírico: [{formatDec(hypothesisResult.icEmpirico[0])} ;{' '}
                      {formatDec(hypothesisResult.icEmpirico[1])}]
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block">
                      Margen de error deseado E (hurtos/sem):
                    </label>
                    <input
                      type="number"
                      min={0.5}
                      max={20}
                      step={0.5}
                      value={marginErr}
                      onChange={(e) => setMarginErr(Math.max(0.5, Number(e.target.value) || 1))}
                      className="mt-1 w-24 rounded-lg border border-slate-200 px-2 py-1 font-mono"
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block">Tamaño de muestra requerido</span>
                    <strong className="text-xl font-mono text-[#0f294a]">
                      n = {hypothesisResult.nRequerido} semanas
                    </strong>
                  </div>
                </div>
              </div>

              {/* Unidad 4: Contraste de Hipótesis */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-orange-600" />
                  <h4 className="text-sm font-bold text-[#0f294a]">
                    Unidad 4 · Contraste de Hipótesis sobre la Tasa (Celda 9.4)
                  </h4>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1 font-mono">
                  <p>
                    <strong>H₀:</strong> λ ({yearPoisson}) = λ₀ ({yearHist}) ={' '}
                    {formatDec(hypothesisResult.lam0)}
                  </p>
                  <p>
                    <strong>H₁:</strong> λ ({yearPoisson}) ≠ λ₀ ({yearHist}) &nbsp;(α = 0.05,
                    bilateral)
                  </p>
                  <p className="text-slate-600">
                    Estadístico: z = (x̄ − λ₀) / √(λ₀ / n) &nbsp;|&nbsp; Región crítica: |z| &gt;
                    1.96
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-500 block">λ₀ ({yearHist})</span>
                    <strong className="text-base font-mono text-[#0f294a]">
                      {formatDec(hypothesisResult.lam0)}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-500 block">Estadístico z</span>
                    <strong className="text-base font-mono text-blue-700">
                      {formatDec(hypothesisResult.zStat)}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-500 block">Valor-p</span>
                    <strong className="text-base font-mono text-[#0f294a]">
                      {hypothesisResult.pValor < 0.0001
                        ? '< 0.0001'
                        : formatProb(hypothesisResult.pValor)}
                    </strong>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    hypothesisResult.rechazaH0
                      ? 'bg-orange-50 border-orange-200 text-orange-950'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  }`}
                >
                  <strong className="block mb-1">
                    Decisión Estadística:{' '}
                    {hypothesisResult.rechazaH0
                      ? 'Se RECHAZA H₀ (p < 0.05)'
                      : 'NO se rechaza H₀ (p ≥ 0.05)'}
                  </strong>
                  {hypothesisResult.rechazaH0
                    ? `Existe evidencia estadística significativa de que la tasa semanal de hurtos en ${yearPoisson} (x̄ = ${formatDec(hypothesisResult.xBar)}) cambió respecto a ${yearHist} (λ₀ = ${formatDec(hypothesisResult.lam0)}).`
                    : `No existe evidencia estadística suficiente al 5% de significancia para afirmar que la tasa semanal en ${yearPoisson} difiera de ${yearHist}.`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
