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
      focus:
        'Pipeline ETL, auditoría de calidad de datos, análisis descriptivo, dashboard BI y componente predictivo.',
    },
    {
      name: 'Estadística Inferencial',
      professor: 'Edith Janeth Potosi Estrada',
      focus:
        'Experimento aleatorio, axiomas, Teorema de Bayes, Grupo 2 (Distribución de Poisson), TLC, IC y pruebas de hipótesis.',
    },
  ],
  teamMembers: [
    {
      order: 1,
      name: 'Jessica Vanesa Acosta Galíndez',
      slides: 'Diapositivas 1 – 3',
      slideRange: [1, 3] as [number, number],
      duration: '1 min 45 s',
      difficulty: 'Apertura y Contexto',
      scope:
        'Portada institucional, contextualización del hurto en Colombia y planteamiento del problema.',
    },
    {
      order: 2,
      name: 'Andrés Felipe Suaza Cerón',
      slides: 'Diapositivas 4 – 6',
      slideRange: [4, 6] as [number, number],
      duration: '2 min 00 s',
      difficulty: 'Diseño Metodológico',
      scope:
        'Objetivo general y específicos, fuentes oficiales Socrata (DIJIN) y metodología de 6 fases.',
    },
    {
      order: 3,
      name: 'Duban Alexander Gómez Hoyos',
      slides: 'Diapositivas 7 – 10',
      slideRange: [7, 10] as [number, number],
      duration: '3 min 00 s',
      difficulty: 'Ciencia de Datos (Electiva III)',
      scope:
        'Auditoría ETL (DD/MM/AAAA y nulos), análisis descriptivo, resultados del dashboard y modelo predictivo (Ridge vs HistGBR).',
    },
    {
      order: 4,
      name: 'Yeison Rengifo',
      slides: 'Diapositivas 11 – 12',
      slideRange: [11, 12] as [number, number],
      duration: '2 min 45 s',
      difficulty: 'Alta Complejidad · Solo Estadística Inferencial',
      scope:
        'Experimento aleatorio (Ω), axiomas y reglas de probabilidad, prueba matemática de dependencia y Teorema de Bayes paso a paso.',
    },
    {
      order: 5,
      name: 'Daniel Andrés Mera',
      slides: 'Diapositivas 13 – 15',
      slideRange: [13, 15] as [number, number],
      duration: '3 min 15 s',
      difficulty: 'Máxima Complejidad · Poisson y Ecuaciones',
      scope:
        'Modelo de Poisson (Grupo 2), ecuaciones PMF/CDF, sobredispersión, Teorema del Límite Central (S₇), bondad χ², IC 95% y contraste z.',
    },
    {
      order: 6,
      name: 'Santiago Alexis Ordoñez Segura',
      slides: 'Diapositivas 16 – 18',
      slideRange: [16, 18] as [number, number],
      duration: '2 min 15 s',
      difficulty: 'Síntesis y Cierre',
      scope:
        'Principales hallazgos cuantitativos, conclusiones interdisciplinarias y espacio de preguntas.',
    },
  ],
} as const;

export interface SlideAssignment {
  slideNumber: number;
  blockOrder: number;
  presenter: string;
  duration: string;
  level:
    | 'Apertura'
    | 'Metodológico'
    | 'Ciencia de Datos'
    | 'Alta Complejidad · Solo Estadística'
    | 'Máxima Complejidad · Poisson y Ecuaciones'
    | 'Cierre';
  notes: string;
}

export const SLIDE_ASSIGNMENTS: SlideAssignment[] = [
  { slideNumber: 1, blockOrder: 1, presenter: 'Jessica Vanesa Acosta Galíndez', duration: '30 s', level: 'Apertura', notes: 'Portada, título oficial, asignaturas, docentes e integrantes.' },
  { slideNumber: 2, blockOrder: 1, presenter: 'Jessica Vanesa Acosta Galíndez', duration: '35 s', level: 'Apertura', notes: 'Contextualización de la problemática e importancia del análisis.' },
  { slideNumber: 3, blockOrder: 1, presenter: 'Jessica Vanesa Acosta Galíndez', duration: '40 s', level: 'Apertura', notes: 'Planteamiento del problema y pregunta central de investigación.' },
  { slideNumber: 4, blockOrder: 2, presenter: 'Andrés Felipe Suaza Cerón', duration: '35 s', level: 'Metodológico', notes: 'Objetivo general y objetivos específicos.' },
  { slideNumber: 5, blockOrder: 2, presenter: 'Andrés Felipe Suaza Cerón', duration: '45 s', level: 'Metodológico', notes: 'Fuentes Socrata (9vha-vh9n, 6sqw-8cg5, d4fr-sbn2) y cobertura 2010–jul 2026.' },
  { slideNumber: 6, blockOrder: 2, presenter: 'Andrés Felipe Suaza Cerón', duration: '40 s', level: 'Metodológico', notes: 'Metodología de 6 fases integrando Electiva III y Estadística.' },
  { slideNumber: 7, blockOrder: 3, presenter: 'Duban Alexander Gómez Hoyos', duration: '45 s', level: 'Ciencia de Datos', notes: 'Auditoría ETL: corrección DD/MM/AAAA (recupera 60.20%) y nulos estructurales.' },
  { slideNumber: 8, blockOrder: 3, presenter: 'Duban Alexander Gómez Hoyos', duration: '45 s', level: 'Ciencia de Datos', notes: 'Estadística descriptiva: medias, medianas, asimetría municipal y frecuencias.' },
  { slideNumber: 9, blockOrder: 3, presenter: 'Duban Alexander Gómez Hoyos', duration: '45 s', level: 'Ciencia de Datos', notes: 'Resultados del dashboard: tendencia 2010–2026 y concentración territorial.' },
  { slideNumber: 10, blockOrder: 3, presenter: 'Duban Alexander Gómez Hoyos', duration: '45 s', level: 'Ciencia de Datos', notes: 'Componente predictivo: Ridge vs HistGBR vs Baseline, MAE/RMSE/R² y limitaciones.' },
  { slideNumber: 11, blockOrder: 4, presenter: 'Yeison Rengifo', duration: '75 s', level: 'Alta Complejidad · Solo Estadística', notes: 'Experimento aleatorio (ε₁, ε₂, Ω), reglas de unión/intersección/complemento e independencia.' },
  { slideNumber: 12, blockOrder: 4, presenter: 'Yeison Rengifo', duration: '90 s', level: 'Alta Complejidad · Solo Estadística', notes: 'Probabilidad condicional y Teorema de Bayes completo con actualización de Llave Maestra.' },
  { slideNumber: 13, blockOrder: 5, presenter: 'Daniel Andrés Mera', duration: '75 s', level: 'Máxima Complejidad · Poisson y Ecuaciones', notes: 'Modelo de Poisson (Grupo 2): ecuaciones PMF/CDF, λ y sobredispersión en Popayán.' },
  { slideNumber: 14, blockOrder: 5, presenter: 'Daniel Andrés Mera', duration: '60 s', level: 'Máxima Complejidad · Poisson y Ecuaciones', notes: 'Ecuación reproductiva S₇ ~ Poisson(7λ), Teorema del Límite Central y bondad de ajuste χ².' },
  { slideNumber: 15, blockOrder: 5, presenter: 'Daniel Andrés Mera', duration: '60 s', level: 'Máxima Complejidad · Poisson y Ecuaciones', notes: 'Unidades 3 y 4: Intervalo de Confianza 95%, tamaño de muestra y contraste bilateral z.' },
  { slideNumber: 16, blockOrder: 6, presenter: 'Santiago Alexis Ordoñez Segura', duration: '50 s', level: 'Cierre', notes: 'Síntesis de los cuatro hallazgos cuantitativos respaldados por los datos.' },
  { slideNumber: 17, blockOrder: 6, presenter: 'Santiago Alexis Ordoñez Segura', duration: '50 s', level: 'Cierre', notes: 'Conclusiones metodológicas y aporte práctico de la plataforma.' },
  { slideNumber: 18, blockOrder: 6, presenter: 'Santiago Alexis Ordoñez Segura', duration: '35 s', level: 'Cierre', notes: 'Agradecimientos y espacio abierto de preguntas.' },
];
