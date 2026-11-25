import type { CubeCore, CubeMun, DashboardFilters } from '../types/analytics';

export const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export const MONTH_NAMES_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export interface AggregatedDashboard {
  totalHechos: number;
  topModalidad: { nombre: string; corta: string; hechos: number; pct: number } | null;
  topDepto: { key: string; nombre: string; hechos: number; pct: number } | null;
  topMunicipio: { nombre: string; hechos: number; pct: number } | null;
  peakAnio: { anio: number; hechos: number } | null;
  variacionReciente: {
    anioActual: number;
    anioAnterior: number;
    hechosActual: number;
    hechosAnterior: number;
    pct: number;
    nota: string;
  } | null;
  porModalidad: { key: string; nombre: string; hechos: number; pct: number }[];
  porAnio: { anio: number; hechos: number; parcial?: boolean }[];
  porMesSerie: { periodo: string; hechos: number }[];
  porDepartamento: { key: string; nombre: string; hechos: number; pct: number }[];
  porMunicipio: { nombre: string; hechos: number; pct: number }[];
  porArma: { nombre: string; hechos: number; pct: number }[];
  porGenero: { nombre: string; hechos: number; pct: number }[];
  evolucionModalidades: { anio: number; [modalidadCorta: string]: number }[];
  modalidadKeysCortas: string[];
  usaSoloMunicipio: boolean;
}

export function aggregateDashboard(
  cubeCore: CubeCore,
  cubeMun: CubeMun,
  filters: DashboardFilters
): AggregatedDashboard {
  const anioIdx = filters.anio === 'TODOS' ? -1 : cubeCore.anios.indexOf(filters.anio);
  const deptoIdx = filters.departamento === 'TODOS' ? -1 : cubeCore.departamentos.indexOf(filters.departamento);
  const modIdx = filters.modalidad === 'TODOS' ? -1 : cubeCore.modalidades.indexOf(filters.modalidad);
  const armaIdx = filters.arma === 'TODOS' ? -1 : cubeCore.armas.indexOf(filters.arma);
  const genIdx = filters.genero === 'TODOS' ? -1 : cubeCore.generos.indexOf(filters.genero);
  const munIdx = filters.municipio === 'TODOS' ? -1 : cubeMun.municipios.indexOf(filters.municipio);

  const hasMunFilter = munIdx !== -1;

  // Acumuladores
  let totalHechos = 0;
  const byMod = new Float64Array(cubeCore.modalidades.length);
  const byAnio = new Float64Array(cubeCore.anios.length);
  const byDepto = new Float64Array(cubeCore.departamentos.length);
  const byArma = new Float64Array(cubeCore.armas.length);
  const byGen = new Float64Array(cubeCore.generos.length);
  const byMun = new Map<number, number>();
  const byYM = new Map<string, number>();
  const byAnioMod: Float64Array[] = cubeCore.anios.map(() => new Float64Array(cubeCore.modalidades.length));

  if (!hasMunFilter) {
    // 1) Agregación exacta multidimensional desde cubeCore
    const rows = cubeCore.rows;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (anioIdx !== -1 && r[0] !== anioIdx) continue;
      if (filters.mes !== 'TODOS' && r[1] !== filters.mes) continue;
      if (deptoIdx !== -1 && r[2] !== deptoIdx) continue;
      if (modIdx !== -1 && r[3] !== modIdx) continue;
      if (armaIdx !== -1 && r[4] !== armaIdx) continue;
      if (genIdx !== -1 && r[5] !== genIdx) continue;

      const qty = r[6];
      totalHechos += qty;
      byAnio[r[0]] += qty;
      byDepto[r[2]] += qty;
      byMod[r[3]] += qty;
      byArma[r[4]] += qty;
      byGen[r[5]] += qty;
      byAnioMod[r[0]][r[3]] += qty;

      const ymKey = `${cubeCore.anios[r[0]]}-${String(r[1]).padStart(2, '0')}`;
      byYM.set(ymKey, (byYM.get(ymKey) ?? 0) + qty);
    }

    // 2) Top municipios usando cubeMun (respetando año, mes, depto, modalidad)
    const mRows = cubeMun.rows;
    for (let i = 0; i < mRows.length; i++) {
      const r = mRows[i];
      if (anioIdx !== -1 && r[0] !== anioIdx) continue;
      if (filters.mes !== 'TODOS' && r[1] !== filters.mes) continue;
      if (deptoIdx !== -1 && r[2] !== deptoIdx) continue;
      if (modIdx !== -1 && r[4] !== modIdx) continue;
      byMun.set(r[3], (byMun.get(r[3]) ?? 0) + r[5]);
    }
  } else {
    // Cuando hay un municipio específico seleccionado, cubeMun da totales exactos por año, mes y modalidad
    const mRows = cubeMun.rows;
    for (let i = 0; i < mRows.length; i++) {
      const r = mRows[i];
      if (anioIdx !== -1 && r[0] !== anioIdx) continue;
      if (filters.mes !== 'TODOS' && r[1] !== filters.mes) continue;
      if (deptoIdx !== -1 && r[2] !== deptoIdx) continue;
      if (r[3] !== munIdx) continue;
      if (modIdx !== -1 && r[4] !== modIdx) continue;

      const qty = r[5];
      totalHechos += qty;
      byAnio[r[0]] += qty;
      byDepto[r[2]] += qty;
      byMod[r[4]] += qty;
      byAnioMod[r[0]][r[4]] += qty;
      byMun.set(r[3], (byMun.get(r[3]) ?? 0) + qty);

      const ymKey = `${cubeMun.anios[r[0]]}-${String(r[1]).padStart(2, '0')}`;
      byYM.set(ymKey, (byYM.get(ymKey) ?? 0) + qty);
    }
  }

  const porModalidad = cubeCore.modalidades
    .map((key, idx) => ({
      key,
      nombre: cubeCore.modalidades_cortas[idx],
      hechos: byMod[idx],
      pct: totalHechos > 0 ? Number(((byMod[idx] / totalHechos) * 100).toFixed(2)) : 0,
    }))
    .filter((d) => d.hechos > 0)
    .sort((a, b) => b.hechos - a.hechos);

  const porDepartamento = cubeCore.departamentos
    .map((key, idx) => ({
      key,
      nombre: cubeCore.departamentos_bonitos[idx],
      hechos: byDepto[idx],
      pct: totalHechos > 0 ? Number(((byDepto[idx] / totalHechos) * 100).toFixed(2)) : 0,
    }))
    .filter((d) => d.hechos > 0)
    .sort((a, b) => b.hechos - a.hechos);

  const porMunicipio = Array.from(byMun.entries())
    .map(([idx, hechos]) => ({
      nombre: cubeMun.municipios[idx],
      hechos,
      pct: totalHechos > 0 ? Number(((hechos / totalHechos) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.hechos - a.hechos);

  const porArma = cubeCore.armas
    .map((nombre, idx) => ({
      nombre,
      hechos: byArma[idx],
      pct: totalHechos > 0 ? Number(((byArma[idx] / totalHechos) * 100).toFixed(2)) : 0,
    }))
    .filter((d) => d.hechos > 0)
    .sort((a, b) => b.hechos - a.hechos);

  const porGenero = cubeCore.generos
    .map((nombre, idx) => ({
      nombre,
      hechos: byGen[idx],
      pct: totalHechos > 0 ? Number(((byGen[idx] / totalHechos) * 100).toFixed(2)) : 0,
    }))
    .filter((d) => d.hechos > 0)
    .sort((a, b) => b.hechos - a.hechos);

  const porAnio = cubeCore.anios
    .map((anio, idx) => ({
      anio,
      hechos: byAnio[idx],
      parcial: anio === 2026,
    }))
    .filter((d) => d.hechos > 0);

  const porMesSerie = Array.from(byYM.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([periodo, hechos]) => ({ periodo, hechos }));

  const evolucionModalidades = cubeCore.anios
    .map((anio, aIdx) => {
      const row: { anio: number; [k: string]: number } = { anio };
      let sumRow = 0;
      cubeCore.modalidades_cortas.forEach((shortName, mIdx) => {
        const val = byAnioMod[aIdx][mIdx];
        row[shortName] = val;
        sumRow += val;
      });
      return sumRow > 0 ? row : null;
    })
    .filter((x): x is { anio: number; [k: string]: number } => x !== null);

  // Peak año
  const peakAnioItem = porAnio.reduce<{ anio: number; hechos: number } | null>(
    (best, cur) => (!best || cur.hechos > best.hechos ? { anio: cur.anio, hechos: cur.hechos } : best),
    null
  );

  // Variación interanual entre los dos últimos años completos (2024 vs 2025) cuando están disponibles
  const h2025 = byAnio[cubeCore.anios.indexOf(2025)] ?? 0;
  const h2024 = byAnio[cubeCore.anios.indexOf(2024)] ?? 0;
  let variacionReciente: AggregatedDashboard['variacionReciente'] = null;
  if (filters.anio === 'TODOS' && h2024 > 0 && h2025 > 0) {
    variacionReciente = {
      anioActual: 2025,
      anioAnterior: 2024,
      hechosActual: h2025,
      hechosAnterior: h2024,
      pct: Number((((h2025 - h2024) / h2024) * 100).toFixed(2)),
      nota: 'Comparación últimos años completos (2024 vs 2025)',
    };
  } else if (filters.anio !== 'TODOS') {
    const idxCur = cubeCore.anios.indexOf(filters.anio);
    if (idxCur > 0) {
      // Buscar el año anterior sin filtrar en el cubo para comparar
      let prevTotal = 0;
      const prevIdx = idxCur - 1;
      for (let i = 0; i < cubeCore.rows.length; i++) {
        const r = cubeCore.rows[i];
        if (r[0] !== prevIdx) continue;
        if (filters.mes !== 'TODOS' && r[1] !== filters.mes) continue;
        if (deptoIdx !== -1 && r[2] !== deptoIdx) continue;
        if (modIdx !== -1 && r[3] !== modIdx) continue;
        if (armaIdx !== -1 && r[4] !== armaIdx) continue;
        if (genIdx !== -1 && r[5] !== genIdx) continue;
        prevTotal += r[6];
      }
      if (prevTotal > 0) {
        variacionReciente = {
          anioActual: filters.anio,
          anioAnterior: cubeCore.anios[prevIdx],
          hechosActual: totalHechos,
          hechosAnterior: prevTotal,
          pct: Number((((totalHechos - prevTotal) / prevTotal) * 100).toFixed(2)),
          nota:
            filters.anio === 2026
              ? '2026 parcial (ene–jul) frente a año completo 2025'
              : `Variación ${cubeCore.anios[prevIdx]} → ${filters.anio}`,
        };
      }
    }
  }

  return {
    totalHechos,
    topModalidad: porModalidad[0]
      ? {
          nombre: porModalidad[0].key,
          corta: porModalidad[0].nombre,
          hechos: porModalidad[0].hechos,
          pct: porModalidad[0].pct,
        }
      : null,
    topDepto: porDepartamento[0] ?? null,
    topMunicipio: porMunicipio[0] ?? null,
    peakAnio: peakAnioItem,
    variacionReciente,
    porModalidad,
    porAnio,
    porMesSerie,
    porDepartamento,
    porMunicipio,
    porArma,
    porGenero,
    evolucionModalidades,
    modalidadKeysCortas: cubeCore.modalidades_cortas,
    usaSoloMunicipio: hasMunFilter,
  };
}
