import { describe, expect, it } from 'vitest';
import {
  chiSquarePValue,
  computeBayesPartition,
  computeHypothesisAndCi,
  computePoissonAnalysis,
  computePoissonClt,
  normalCdf,
  poissonCdf,
  poissonPmf,
  poissonSf,
} from './statistics';

describe('Librería matemática y estadística', () => {
  it('calcula PMF, CDF y supervivencia de Poisson con precisión', () => {
    // Para lambda = 4, P(X = 0) = e^-4 = 0.0183156
    expect(poissonPmf(0, 4)).toBeCloseTo(Math.exp(-4), 6);
    // P(X = 4 | lambda = 4) = e^-4 * 4^4 / 24 = 0.1953668
    expect(poissonPmf(4, 4)).toBeCloseTo(0.1953668, 5);
    // CDF + SF = 1
    expect(poissonCdf(5, 4) + poissonSf(5, 4)).toBeCloseTo(1, 10);
  });

  it('calcula Normal Estándar y p-valor Chi-cuadrado correctamente', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.95996)).toBeCloseTo(0.975, 4);
    // Chi2(df=1) = 3.8415 -> p ≈ 0.05
    expect(chiSquarePValue(3.8415, 1)).toBeCloseTo(0.05, 3);
  });

  it('ejecuta análisis de Poisson y TLC coherente con el proyecto', () => {
    const sample52 = Array.from({ length: 52 }, (_, i) => (i % 4 === 0 ? 5 : 4));
    const res = computePoissonAnalysis(sample52, 5);
    expect(res.n).toBe(52);
    expect(res.lambda).toBeCloseTo(4.25, 4);
    expect(res.dispersionRatio).toBeLessThan(1.5);

    const clt = computePoissonClt(12, 7, 100);
    // 7*12 = 84; P(S7 > 100) ≈ 0.0376
    expect(clt.lamM).toBe(84);
    expect(clt.exacta).toBeGreaterThan(0.03);
    expect(clt.exacta).toBeLessThan(0.05);
    expect(clt.diferencia).toBeLessThan(0.01);
  });

  it('calcula prueba de hipótesis e intervalo de confianza y actualización de Bayes', () => {
    const actual = Array.from({ length: 52 }, () => 36);
    const hist = Array.from({ length: 52 }, () => 42);
    const hyp = computeHypothesisAndCi(actual, hist, 0.95, 2);
    expect(hyp.zStat).toBeLessThan(-2);
    expect(hyp.rechazaH0).toBe(true);
    expect(hyp.icPoisson[0]).toBeLessThan(36);
    expect(hyp.icPoisson[1]).toBeGreaterThan(36);

    const bayes = computeBayesPartition([
      { label: 'A', prior: 0.4, likelihood: 0.5 },
      { label: 'B', prior: 0.6, likelihood: 0.1 },
    ]);
    // evidence = 0.2 + 0.06 = 0.26; P(A|E) = 0.2/0.26 = 0.7692
    expect(bayes.evidence).toBeCloseTo(0.26, 6);
    expect(bayes.results[0].posterior).toBeCloseTo(0.76923, 4);
    expect(bayes.results[1].posterior).toBeCloseTo(0.23077, 4);
  });
});
