import { useEffect, useState } from 'react';
import type {
  AllPlatformData,
  ColombiaMapData,
  CubeCore,
  CubeMun,
  DataScienceSummary,
  InferentialSummary,
  PredictiveModelData,
  WeeklyPoissonData,
} from '../types/analytics';

interface LoadState {
  data: AllPlatformData | null;
  loading: boolean;
  error: string | null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`No se pudo cargar ${url} (HTTP ${res.status})`);
  }
  return (await res.json()) as T;
}

export function usePlatformData(): LoadState {
  const [state, setState] = useState<LoadState>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [
          cubeCore,
          cubeMun,
          colombiaMap,
          weeklyPoisson,
          inferential,
          dataScience,
          predictive,
        ] = await Promise.all([
          fetchJson<CubeCore>('/data/cube_core.json'),
          fetchJson<CubeMun>('/data/cube_mun.json'),
          fetchJson<ColombiaMapData>('/data/colombia_map.json'),
          fetchJson<WeeklyPoissonData>('/data/weekly_poisson.json'),
          fetchJson<InferentialSummary>('/data/inferential_summary.json'),
          fetchJson<DataScienceSummary>('/data/data_science_summary.json'),
          fetchJson<PredictiveModelData>('/data/predictive_model.json'),
        ]);

        if (!cancelled) {
          setState({
            data: {
              cubeCore,
              cubeMun,
              colombiaMap,
              weeklyPoisson,
              inferential,
              dataScience,
              predictive,
            },
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error:
              err instanceof Error
                ? err.message
                : 'Error inesperado al cargar los conjuntos de datos.',
          });
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
