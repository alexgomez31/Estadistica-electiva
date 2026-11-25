import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { aggregateDashboard } from './cubeEngine';
import { computePoissonAnalysis } from './statistics';
import type { CubeCore, CubeMun, WeeklyPoissonData } from '../types/analytics';

const dataDir = resolve(__dirname, '../../public/data');
const cubeCore = JSON.parse(readFileSync(resolve(dataDir, 'cube_core.json'), 'utf-8')) as CubeCore;
const cubeMun = JSON.parse(readFileSync(resolve(dataDir, 'cube_mun.json'), 'utf-8')) as CubeMun;
const weeklyPoisson = JSON.parse(
  readFileSync(resolve(dataDir, 'weekly_poisson.json'), 'utf-8')
) as WeeklyPoissonData;

describe('Motor OLAP y verificación contra datos reales', () => {
  it('reproduce exactamente el total nacional, Cauca, Popayán y años clave', () => {
    const baseFilters = {
      anio: 'TODOS' as const,
      mes: 'TODOS' as const,
      departamento: 'TODOS' as const,
      municipio: 'TODOS' as const,
      modalidad: 'TODOS' as const,
      arma: 'TODOS' as const,
      genero: 'TODOS' as const,
    };

    const nacional = aggregateDashboard(cubeCore, cubeMun, baseFilters);
    expect(nacional.totalHechos).toBe(1354442);
    expect(nacional.topModalidad?.corta).toBe('Entidades Comerciales');
    expect(nacional.topDepto?.key).toBe('BOGOTA');

    const cauca = aggregateDashboard(cubeCore, cubeMun, {
      ...baseFilters,
      departamento: 'CAUCA',
    });
    expect(cauca.totalHechos).toBe(49812);

    const popayan = aggregateDashboard(cubeCore, cubeMun, {
      ...baseFilters,
      municipio: 'POPAYÁN (CT)',
    });
    expect(popayan.totalHechos).toBe(23578);

    const y2024 = aggregateDashboard(cubeCore, cubeMun, { ...baseFilters, anio: 2024 });
    const y2025 = aggregateDashboard(cubeCore, cubeMun, { ...baseFilters, anio: 2025 });
    expect(y2024.totalHechos).toBe(120702);
    expect(y2025.totalHechos).toBe(97123);
  });

  it('valida el modelo de Poisson sobre Popayán 2025 (todas vs automotores)', () => {
    const allPop = weeklyPoisson.series['MUN::POPAYÁN (CT)||TODOS']['2025'];
    const resAll = computePoissonAnalysis(allPop, 40);
    expect(resAll.n).toBe(52);
    expect(resAll.totalHechos).toBe(1896);
    expect(resAll.lambda).toBeCloseTo(36.46, 2);
    expect(resAll.sobredisperso).toBe(true);

    const autoPop =
      weeklyPoisson.series['MUN::POPAYÁN (CT)||ARTÍCULO 239. HURTO AUTOMOTORES']['2025'];
    const resAuto = computePoissonAnalysis(autoPop, 6);
    expect(resAuto.n).toBe(52);
    expect(resAuto.totalHechos).toBe(204);
    expect(resAuto.lambda).toBeCloseTo(3.92, 2);
    expect(resAuto.dispersionRatio).toBeCloseTo(0.96, 1);
    expect(resAuto.chi2Test.aceptaPoisson).toBe(true);
  });
});
