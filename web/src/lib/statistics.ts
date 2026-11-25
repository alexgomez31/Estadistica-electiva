/**
 * Librería matemática y estadística pura para el proyecto de Estadística Inferencial.
 * Separada de los componentes visuales para garantizar trazabilidad y pruebas unitarias.
 */

/** Logaritmo natural de la función Gamma mediante aproximación de Lanczos. */
export function logGamma(z: number): number {
  const p = [
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  let x = z - 1;
  let a = 0.9999999999998099;
  for (let i = 0; i < p.length; i++) {
    a += p[i] / (x + i + 1);
  }
  const t = x + p.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Función de masa de probabilidad (PMF) de Poisson en espacio logarítmico. */
export function poissonPmf(k: number, lambda: number): number {
  if (k < 0 || !Number.isInteger(k)) return 0;
  if (lambda <= 0) return k === 0 ? 1 : 0;
  const logP = -lambda + k * Math.log(lambda) - logGamma(k + 1);
  return Math.exp(logP);
}

/** Función de distribución acumulada P(X <= k) de Poisson. */
export function poissonCdf(k: number, lambda: number): number {
  if (k < 0) return 0;
  if (lambda <= 0) return 1;
  const kFloor = Math.floor(k);
  let sum = 0;
  for (let i = 0; i <= kFloor; i++) {
    sum += poissonPmf(i, lambda);
    if (sum >= 1 - 1e-14) return 1;
  }
  return Math.min(1, sum);
}

/** Función de supervivencia P(X > k) = 1 - P(X <= k) de Poisson. */
export function poissonSf(k: number, lambda: number): number {
  return Math.max(0, 1 - poissonCdf(k, lambda));
}

/** Función de error gaussiana erf(x) (Abramowitz & Stegun 7.1.26). */
export function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t) *
      Math.exp(-ax * ax);
  return sign * y;
}

/** CDF de la Normal Estándar Phi(z) = P(Z <= z). */
export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/** Supervivencia de la Normal Estándar P(Z > z). */
export function normalSf(z: number): number {
  return 1 - normalCdf(z);
}

/** Gamma incompleta superior regularizada Q(a, x) para valor-p de chi-cuadrado. */
function regularizedGammaQ(a: number, x: number): number {
  if (x <= 0) return 1;
  if (a <= 0) return 0;
  if (x < a + 1) {
    // Serie de P(a, x)
    let ap = a;
    let sum = 1 / a;
    let del = sum;
    for (let n = 1; n <= 200; n++) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-12) break;
    }
    const p = sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
    return Math.max(0, Math.min(1, 1 - p));
  }
  // Fracción continua (Lentz modificado)
  let b = x + 1 - a;
  let c = 1 / 1e-30;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= 200; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-12) break;
  }
  return Math.max(0, Math.min(1, Math.exp(-x + a * Math.log(x) - logGamma(a)) * h));
}

/** Valor-p de prueba Chi-cuadrado dado estadístico y grados de libertad. */
export function chiSquarePValue(chi2: number, df: number): number {
  if (df <= 0 || chi2 < 0) return 1;
  return regularizedGammaQ(df / 2, chi2 / 2);
}

export interface PoissonAnalysisResult {
  n: number;
  totalHechos: number;
  lambda: number;
  varianza: number;
  desvEst: number;
  dispersionRatio: number;
  sobredisperso: boolean;
  kAlerta5: number;
  proporcionRealUmbral: number;
  probModeloUmbral: number;
  tablaEventos: { evento: string; probabilidad: number; descripcion: string }[];
  pmfComparativa: { k: number; observado: number; poisson: number; obsCount: number }[];
  chi2Test: {
    valido: boolean;
    clases: number;
    df: number;
    chi2: number;
    pValor: number;
    aceptaPoisson: boolean;
    motivo?: string;
  };
}

/** Ejecuta análisis completo de Poisson (Celdas 9.1, 9.2 y 9.5 del notebook). */
export function computePoissonAnalysis(
  weeklyCounts: number[],
  umbralAlerta: number,
  kPuntual = 10,
  kLow = 8,
  kHigh = 14
): PoissonAnalysisResult {
  const n = weeklyCounts.length;
  const totalHechos = weeklyCounts.reduce((a, b) => a + b, 0);
  const lambda = n > 0 ? totalHechos / n : 0;
  const varianza =
    n > 1
      ? weeklyCounts.reduce((acc, x) => acc + (x - lambda) ** 2, 0) / (n - 1)
      : 0;
  const desvEst = Math.sqrt(varianza);
  const dispersionRatio = lambda > 0 ? varianza / lambda : 0;

  // Menor k tal que P(X >= k) < 0.05
  let kAlerta5 = Math.max(1, Math.ceil(lambda));
  while (poissonSf(kAlerta5 - 1, lambda) >= 0.05 && kAlerta5 < lambda + 200) {
    kAlerta5 += 1;
  }

  const realAbove = n > 0 ? weeklyCounts.filter((x) => x >= umbralAlerta).length / n : 0;
  const modelAbove = poissonSf(umbralAlerta - 1, lambda);

  const tablaEventos = [
    {
      evento: `X = ${kPuntual}`,
      probabilidad: poissonPmf(kPuntual, lambda),
      descripcion: `Exactamente ${kPuntual} hurtos en una semana`,
    },
    {
      evento: `X ≤ ${kLow}`,
      probabilidad: poissonCdf(kLow, lambda),
      descripcion: `A lo sumo ${kLow} hurtos en una semana`,
    },
    {
      evento: `${kLow + 1} ≤ X ≤ ${kHigh}`,
      probabilidad: Math.max(0, poissonCdf(kHigh, lambda) - poissonCdf(kLow, lambda)),
      descripcion: `Rango intermedio entre ${kLow + 1} y ${kHigh} hurtos`,
    },
    {
      evento: `X ≥ ${umbralAlerta}`,
      probabilidad: modelAbove,
      descripcion: `Supera o iguala el umbral operativo (${umbralAlerta})`,
    },
    {
      evento: `X ≥ ${kAlerta5} (alerta 5%)`,
      probabilidad: poissonSf(kAlerta5 - 1, lambda),
      descripcion: `Umbral de evento raro P(X ≥ k) < 0.05`,
    },
  ];

  // Rango de soporte para gráfico observado vs teórico
  const minObs = Math.min(...weeklyCounts, Math.max(0, Math.floor(lambda - 3.5 * Math.sqrt(Math.max(lambda, 1)))));
  const maxObs = Math.max(...weeklyCounts, Math.ceil(lambda + 3.5 * Math.sqrt(Math.max(lambda, 1))));
  const kStart = Math.max(0, minObs);
  const kEnd = Math.min(kStart + 80, maxObs); // evita rangos excesivos en series nacionales

  const countsMap = new Map<number, number>();
  for (const x of weeklyCounts) {
    countsMap.set(x, (countsMap.get(x) ?? 0) + 1);
  }

  const pmfComparativa: { k: number; observado: number; poisson: number; obsCount: number }[] = [];
  if (maxObs - kStart <= 80) {
    for (let k = kStart; k <= kEnd; k++) {
      const cnt = countsMap.get(k) ?? 0;
      pmfComparativa.push({
        k,
        observado: n > 0 ? cnt / n : 0,
        poisson: poissonPmf(k, lambda),
        obsCount: cnt,
      });
    }
  } else {
    // Para series con valores muy grandes (ej. nacional) agrupamos en intervalos alrededor de la media
    const step = Math.ceil((maxObs - kStart) / 30);
    for (let k = kStart; k <= maxObs; k += step) {
      let cnt = 0;
      let pSum = 0;
      for (let j = k; j < k + step; j++) {
        cnt += countsMap.get(j) ?? 0;
        pSum += poissonPmf(j, lambda);
      }
      pmfComparativa.push({
        k,
        observado: n > 0 ? cnt / n : 0,
        poisson: pSum,
        obsCount: cnt,
      });
    }
  }

  // Bondad de ajuste Chi-cuadrado con fusión de clases esperadas < 5 (ddof = 1)
  let chi2Test: PoissonAnalysisResult['chi2Test'] = {
    valido: false,
    clases: 0,
    df: 0,
    chi2: 0,
    pValor: 1,
    aceptaPoisson: false,
    motivo: 'Muestra insuficiente',
  };

  if (n >= 10 && lambda > 0) {
    let lo = 0;
    while (poissonCdf(lo, lambda) < 0.05 && lo < lambda + 200) lo++;
    let hi = lo;
    while (poissonCdf(hi, lambda) < 0.95 && hi < lambda + 300) hi++;

    const obsBins: number[] = [];
    const espBins: number[] = [];

    obsBins.push(weeklyCounts.filter((x) => x < lo).length);
    espBins.push((lo > 0 ? poissonCdf(lo - 1, lambda) : 0) * n);

    for (let k = lo; k <= hi; k++) {
      obsBins.push(weeklyCounts.filter((x) => x === k).length);
      espBins.push(poissonPmf(k, lambda) * n);
    }

    obsBins.push(weeklyCounts.filter((x) => x > hi).length);
    espBins.push(poissonSf(hi, lambda) * n);

    const oMerged: number[] = [];
    const eMerged: number[] = [];
    let accO = 0;
    let accE = 0;
    for (let i = 0; i < obsBins.length; i++) {
      accO += obsBins[i];
      accE += espBins[i];
      if (accE >= 5) {
        oMerged.push(accO);
        eMerged.push(accE);
        accO = 0;
        accE = 0;
      }
    }
    if (accE > 0 && eMerged.length > 0) {
      oMerged[oMerged.length - 1] += accO;
      eMerged[eMerged.length - 1] += accE;
    }

    if (oMerged.length >= 3) {
      const sumE = eMerged.reduce((a, b) => a + b, 0);
      const scale = sumE > 0 ? n / sumE : 1;
      let chi2 = 0;
      for (let i = 0; i < oMerged.length; i++) {
        const ei = eMerged[i] * scale;
        chi2 += (oMerged[i] - ei) ** 2 / ei;
      }
      const df = oMerged.length - 1 - 1; // ddof = 1 por estimar lambda
      const pVal = chiSquarePValue(chi2, df);
      chi2Test = {
        valido: true,
        clases: oMerged.length,
        df,
        chi2,
        pValor: pVal,
        aceptaPoisson: pVal >= 0.05,
      };
    } else {
      chi2Test.motivo = 'Menos de 3 clases con frecuencia esperada ≥ 5';
    }
  }

  return {
    n,
    totalHechos,
    lambda,
    varianza,
    desvEst,
    dispersionRatio,
    sobredisperso: dispersionRatio > 1.5,
    kAlerta5,
    proporcionRealUmbral: realAbove,
    probModeloUmbral: modelAbove,
    tablaEventos,
    pmfComparativa,
    chi2Test,
  };
}

/** Suma de m semanas S_m ~ Poisson(m * lambda) y aproximación Normal (TLC) con corrección de continuidad. */
export function computePoissonClt(lambda: number, semanas: number, umbral?: number) {
  const lamM = semanas * lambda;
  const sigmaM = Math.sqrt(lamM);
  const c = umbral ?? Math.ceil(lamM + 2 * sigmaM);
  const exacta = poissonSf(c, lamM);
  const z = sigmaM > 0 ? (c + 0.5 - lamM) / sigmaM : 0;
  const normalAprox = normalSf(z);
  return {
    semanas,
    lamM,
    sigmaM,
    c,
    exacta,
    z,
    normalAprox,
    diferencia: Math.abs(exacta - normalAprox),
  };
}

/** Contraste de hipótesis z para tasa Poisson e Intervalo de Confianza (Celdas 9.4). */
export function computeHypothesisAndCi(
  seriesActual: number[],
  seriesHistorica: number[],
  confianza: 0.9 | 0.95 | 0.99 = 0.95,
  margenErrorDeseado = 2.0
) {
  const zCritMap: Record<number, number> = {
    0.9: 1.64485,
    0.95: 1.95996,
    0.99: 2.57583,
  };
  const zCrit = zCritMap[confianza] ?? 1.95996;

  const n = seriesActual.length;
  const nHist = seriesHistorica.length;
  const xBar = n > 0 ? seriesActual.reduce((a, b) => a + b, 0) / n : 0;
  const lam0 = nHist > 0 ? seriesHistorica.reduce((a, b) => a + b, 0) / nHist : 0;
  const sActual =
    n > 1 ? Math.sqrt(seriesActual.reduce((a, x) => a + (x - xBar) ** 2, 0) / (n - 1)) : 0;

  const sePoisson = n > 0 && xBar > 0 ? Math.sqrt(xBar / n) : 0;
  const seEmpirico = n > 0 ? sActual / Math.sqrt(n) : 0;

  const icPoisson: [number, number] = [
    Math.max(0, xBar - zCrit * sePoisson),
    xBar + zCrit * sePoisson,
  ];
  const icEmpirico: [number, number] = [
    Math.max(0, xBar - zCrit * seEmpirico),
    xBar + zCrit * seEmpirico,
  ];

  const denomZ = n > 0 && lam0 > 0 ? Math.sqrt(lam0 / n) : 0;
  const zStat = denomZ > 0 ? (xBar - lam0) / denomZ : 0;
  const pValor = 2 * normalSf(Math.abs(zStat));

  const nRequerido =
    margenErrorDeseado > 0 ? Math.ceil(((zCrit * sActual) / margenErrorDeseado) ** 2) : 0;

  return {
    n,
    nHist,
    xBar,
    lam0,
    sActual,
    zCrit,
    confianza,
    icPoisson,
    icEmpirico,
    zStat,
    pValor,
    rechazaH0: pValor < 0.05,
    nRequerido,
    margenErrorDeseado,
  };
}

export interface BayesResultItem {
  label: string;
  prior: number;
  likelihood: number;
  joint: number;
  posterior: number;
}

/** Actualización exacta mediante el Teorema de Bayes para partición de eventos. */
export function computeBayesPartition(
  items: { label: string; prior: number; likelihood: number }[]
): { evidence: number; results: BayesResultItem[] } {
  const priorSum = items.reduce((acc, it) => acc + it.prior, 0);
  const normItems = items.map((it) => ({
    ...it,
    prior: priorSum > 0 ? it.prior / priorSum : 0,
  }));
  const joints = normItems.map((it) => it.prior * it.likelihood);
  const evidence = joints.reduce((acc, j) => acc + j, 0);
  const results = normItems.map((it, idx) => ({
    label: it.label,
    prior: it.prior,
    likelihood: it.likelihood,
    joint: joints[idx],
    posterior: evidence > 0 ? joints[idx] / evidence : 0,
  }));
  return { evidence, results };
}
