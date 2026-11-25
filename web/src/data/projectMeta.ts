export const PROJECT_META = {
  title:
    'ANÁLISIS PROBABILÍSTICO DEL HURTO EN COLOMBIA CON DATOS ABIERTOS DE LA POLICÍA NACIONAL: MODELO DE POISSON, TEOREMA DE BAYES',
  shortTitle: 'Análisis Probabilístico del Hurto en Colombia',
  institution: 'Institución Universitaria Colegio Mayor del Cauca',
  program: 'Ingeniería Informática',
  subjects: [
    {
      name: 'Electiva III – Introducción a la Ciencia de Datos',
      professor: 'Carlos Eduardo Ruiz Quiñones',
      focus: 'Pipeline ETL, auditoría de calidad de datos, análisis descriptivo, dashboard BI y componente predictivo.',
    },
    {
      name: 'Estadística Inferencial',
      professor: 'Edith Janeth Potosi Estrada',
      focus: 'Experimento aleatorio, axiomas, Teorema de Bayes, Grupo 2 (Distribución de Poisson), TLC, IC y pruebas de hipótesis.',
    },
  ],
  teamMembers: [
    {
      name: 'Jessica Vanesa Acosta Galíndez',
      slides: 'Diapositivas 1, 2 y 3',
      duration: '1 min 45 s',
      difficulty: 'Introductorio',
      scope: 'Portada, contextualización del hurto en Colombia y planteamiento del problema.',
    },
    {
      name: 'Andrés Felipe Suaza Cerón',
      slides: 'Diapositivas 4, 5 y 6',
      duration: '2 min 00 s',
      difficulty: 'Metodológico',
      scope: 'Objetivos, fuentes oficiales de Datos Abiertos (DIJIN) y metodología interdisciplinaria.',
    },
    {
      name: 'Duban Alexander Gómez Hoyos',
      slides: 'Diapositivas 8, 9 y 16',
      duration: '2 min 45 s',
      difficulty: 'Analítico',
      scope: 'Análisis descriptivo, resultados del dashboard interactivo y principales hallazgos.',
    },
    {
      name: 'Santiago Alexis Ordoñez Segura',
      slides: 'Diapositivas 10, 11, 17 y 18',
      duration: '2 min 30 s',
      difficulty: 'Intermedio',
      scope: 'Experimento aleatorio (Ω), reglas de probabilidad, conclusiones y cierre.',
    },
    {
      name: 'Daniel Andrés Mera',
      slides: 'Diapositivas 7, 12 y 15',
      duration: '3 min 00 s',
      difficulty: 'Alta complejidad',
      scope: 'Auditoría ETL crítica (error DD/MM vs MM/DD), Teorema de Bayes paso a paso y modelado predictivo (Ridge vs HistGBR).',
    },
    {
      name: 'Yeison Rengifo',
      slides: 'Diapositivas 13 y 14',
      duration: '3 min 00 s',
      difficulty: 'Máxima complejidad · Solo Estadística Inferencial',
      scope: 'Distribución de Poisson (Grupo 2), sobredispersión, prueba χ², Teorema del Límite Central (S₇), IC 95% y contraste de hipótesis z.',
    },
  ],
} as const;

export interface SlideAssignment {
  slideNumber: number;
  presenter: string;
  duration: string;
  level: 'Base' | 'Analítico' | 'Alta Dificultad' | 'Máxima Dificultad (Solo Estadística)';
  notes: string;
}

export const SLIDE_ASSIGNMENTS: SlideAssignment[] = [
  { slideNumber: 1, presenter: 'Jessica Vanesa Acosta Galíndez', duration: '30 s', level: 'Base', notes: 'Presentación institucional, título, asignaturas, docentes e integrantes.' },
  { slideNumber: 2, presenter: 'Jessica Vanesa Acosta Galíndez', duration: '35 s', level: 'Base', notes: 'Contextualización de la problemática e importancia del análisis.' },
  { slideNumber: 3, presenter: 'Jessica Vanesa Acosta Galíndez', duration: '40 s', level: 'Base', notes: 'Planteamiento del problema y pregunta central de investigación.' },
  { slideNumber: 4, presenter: 'Andrés Felipe Suaza Cerón', duration: '35 s', level: 'Base', notes: 'Objetivo general y objetivos específicos.' },
  { slideNumber: 5, presenter: 'Andrés Felipe Suaza Cerón', duration: '45 s', level: 'Base', notes: 'Fuentes Socrata (9vha-vh9n, 6sqw-8cg5, d4fr-sbn2) y cobertura 2010–jul 2026.' },
  { slideNumber: 6, presenter: 'Andrés Felipe Suaza Cerón', duration: '40 s', level: 'Base', notes: 'Metodología de 6 fases integrando Electiva III y Estadística.' },
  { slideNumber: 7, presenter: 'Daniel Andrés Mera', duration: '60 s', level: 'Alta Dificultad', notes: 'Auditoría técnica ETL: recuperación del 60.20% de fechas (MM/DD→DD/MM), nulos estructurales en género y preservación de 474,880 filas.' },
  { slideNumber: 8, presenter: 'Duban Alexander Gómez Hoyos', duration: '55 s', level: 'Analítico', notes: 'Estadística descriptiva: medias, medianas, asimetría municipal y frecuencias.' },
  { slideNumber: 9, presenter: 'Duban Alexander Gómez Hoyos', duration: '60 s', level: 'Analítico', notes: 'Lectura de tendencias temporales, pico 2024 y concentración departamental.' },
  { slideNumber: 10, presenter: 'Santiago Alexis Ordoñez Segura', duration: '35 s', level: 'Analítico', notes: 'Formulación de experimentos aleatorios ε₁ y ε₂ y espacios muestrales Ω₁ y Ω₂.' },
  { slideNumber: 11, presenter: 'Santiago Alexis Ordoñez Segura', duration: '50 s', level: 'Analítico', notes: 'Reglas de adición, multiplicación, complemento y dependencia estadística.' },
  { slideNumber: 12, presenter: 'Daniel Andrés Mera', duration: '60 s', level: 'Alta Dificultad', notes: 'Teorema de Bayes aplicado: verosimilitudes, evidencia marginal P(B) y actualización previa→posteriori.' },
  { slideNumber: 13, presenter: 'Yeison Rengifo', duration: '100 s', level: 'Máxima Dificultad (Solo Estadística)', notes: 'Núcleo Grupo 2 (Poisson): PMF, Popayán total vs Automotores (s²/λ=0.96), bondad de ajuste χ² y aproximación Normal TLC (S₇).' },
  { slideNumber: 14, presenter: 'Yeison Rengifo', duration: '80 s', level: 'Máxima Dificultad (Solo Estadística)', notes: 'Unidades 3 y 4: Intervalo de Confianza 95% para λ, tamaño muestral y contraste bilateral z (2024 vs 2025).' },
  { slideNumber: 15, presenter: 'Daniel Andrés Mera', duration: '60 s', level: 'Alta Dificultad', notes: 'Modelado predictivo: Regresión Ridge vs HistGBR vs Baseline, rezagos, MAE/RMSE/R² y limitaciones.' },
  { slideNumber: 16, presenter: 'Duban Alexander Gómez Hoyos', duration: '50 s', level: 'Analítico', notes: 'Síntesis de los cuatro hallazgos cuantitativos principales.' },
  { slideNumber: 17, presenter: 'Santiago Alexis Ordoñez Segura', duration: '40 s', level: 'Base', notes: 'Conclusiones metodológicas y aporte práctico de la plataforma.' },
  { slideNumber: 18, presenter: 'Santiago Alexis Ordoñez Segura', duration: '25 s', level: 'Base', notes: 'Agradecimientos y apertura a preguntas del jurado.' },
];
