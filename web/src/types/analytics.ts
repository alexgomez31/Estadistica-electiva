export type ModuleId =
  | 'inicio'
  | 'dashboard'
  | 'ciencia-datos'
  | 'estadistica-inferencial'
  | 'presentacion';

export interface CubeCore {
  anios: number[];
  departamentos: string[];
  departamentos_bonitos: string[];
  modalidades: string[];
  modalidades_cortas: string[];
  armas: string[];
  generos: string[];
  // [anio_idx, mes_num, depto_idx, mod_idx, arma_idx, gen_idx, cantidad]
  rows: [number, number, number, number, number, number, number][];
}

export interface CubeMun {
  anios: number[];
  departamentos: string[];
  municipios: string[];
  modalidades: string[];
  // [anio_idx, mes_num, depto_idx, mun_idx, mod_idx, cantidad]
  rows: [number, number, number, number, number, number][];
}

export interface ColombiaMapFeature {
  code: string;
  geoName: string;
  departamento: string;
  nombre: string;
  d: string;
  cx: number;
  cy: number;
  isInset: boolean;
}

export interface ColombiaMapData {
  viewBox: string;
  insetBox: { x: number; y: number; width: number; height: number };
  features: ColombiaMapFeature[];
}

export interface WeeklyPoissonData {
  scopes: { id: string; label: string; kind: 'municipio' | 'departamento' | 'nacional' }[];
  modalities: string[];
  years: number[];
  series: Record<string, Record<string, number[]>>;
  notebook_comparison_popayan_2025: {
    notebook_mdy: {
      semanas: number;
      hechos: number;
      lambda: number;
      varianza: number;
      dispersion: number;
    };
    corregido_dmy: {
      semanas: number;
      hechos: number;
      lambda: number;
      varianza: number;
      dispersion: number;
    };
  };
}

export interface InferentialSummary {
  total_hechos: number;
  modalidades: { key: string; short: string; count: number }[];
  armas: { key: string; count: number }[];
  mod_x_arma: Record<string, Record<string, number>>;
  departamentos: { key: string; label: string; count: number }[];
  mod_x_depto: Record<string, Record<string, number>>;
  generos: { key: string; count: number }[];
  mod_x_genero: Record<string, Record<string, number>>;
}

export interface SocrataSourceMeta {
  recurso: string;
  descripcion_corta: string;
  nombre: string;
  atribucion: string;
  descripcion: string;
  rowsUpdatedAt: number;
  filas: number;
  columnas: string[];
}

export interface NullColumnAudit {
  columna: string;
  nulos_antes: number;
  pct_antes: number;
  nulos_despues: number;
  pct_despues: number;
  tratamiento: string;
}

export interface DescStatsBlock {
  n: number;
  suma: number;
  media: number;
  mediana: number;
  desv_est: number;
  min: number;
  q1: number;
  q3: number;
  max: number;
}

export interface DataScienceSummary {
  fuentes_socrata: SocrataSourceMeta[];
  auditoria_etl: {
    registros_originales: number;
    registros_limpios: number;
    hechos_totales: number;
    fecha_min: string;
    fecha_max: string;
    departamentos_count: number;
    municipios_count: number;
    modalidades_count: number;
    armas_count: number;
    duplicados_atributos: number;
    duplicados_atributos_pct: number;
    notebook_parse_mdy: {
      fechas_validas: number;
      fechas_nulas: number;
      fechas_nulas_pct: number;
    };
    etl_corregido_dmy: {
      fechas_validas: number;
      fechas_nulas: number;
      fechas_nulas_pct: number;
    };
    nulos_originales: NullColumnAudit[];
    nulos_por_modalidad: {
      modalidad: string;
      modalidad_corta: string;
      registros: number;
      genero_nulos: number;
      genero_nulos_pct: number;
      grupo_etario_nulos: number;
      grupo_etario_nulos_pct: number;
    }[];
    municipio_nulo_detalle: Record<string, string>[];
  };
  estadisticas_descriptivas: {
    serie_anual_completa_2010_2025: DescStatsBlock;
    serie_mensual_2010_2026: DescStatsBlock;
    totales_municipales: DescStatsBlock;
    moda_modalidad: string;
    moda_arma: string;
    moda_departamento: string;
    moda_anio: number;
    moda_anio_hechos: number;
  };
  frecuencias: {
    modalidades: { categoria: string; corta: string; frecuencia: number; relativa: number; porcentaje: number }[];
    armas: { categoria: string; frecuencia: number; relativa: number; porcentaje: number }[];
    generos: { categoria: string; frecuencia: number; relativa: number; porcentaje: number }[];
  };
  preguntas_analisis: {
    pregunta: string;
    respuesta: string;
    dato_clave: string;
  }[];
}

export interface PredictiveModelData {
  objetivo: string;
  division_temporal: {
    entrenamiento: string;
    prueba: string;
    nota_2026: string;
  };
  variables_predictoras: string[];
  modelos: {
    nombre: string;
    descripcion: string;
    mae: number;
    rmse: number;
    r2: number;
  }[];
  mejor_modelo: string;
  coeficientes_numericos_ridge: { variable: string; coeficiente: number }[];
  serie_nacional_prueba: { periodo: string; real: number; ridge: number; hgbr: number }[];
  series_departamentos_prueba: Record<string, { periodo: string; real: number; ridge: number; hgbr: number }[]>;
  limitaciones: string[];
}

export interface DashboardFilters {
  anio: number | 'TODOS';
  mes: number | 'TODOS';
  departamento: string | 'TODOS';
  municipio: string | 'TODOS';
  modalidad: string | 'TODOS';
  arma: string | 'TODOS';
  genero: string | 'TODOS';
}

export interface AllPlatformData {
  cubeCore: CubeCore;
  cubeMun: CubeMun;
  colombiaMap: ColombiaMapData;
  weeklyPoisson: WeeklyPoissonData;
  inferential: InferentialSummary;
  dataScience: DataScienceSummary;
  predictive: PredictiveModelData;
}
