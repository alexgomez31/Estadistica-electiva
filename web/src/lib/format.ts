export function formatInt(value: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.round(value));
}

export function formatDec(value: number, decimals = 2): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPct(value: number, decimals = 2): string {
  return `${formatDec(value, decimals)}%`;
}

export function formatProb(value: number, decimals = 4): string {
  return value.toFixed(decimals);
}

export const CHART_COLORS = [
  '#0f294a', // Azul profundo
  '#1d4ed8', // Azul medio
  '#0ea5e9', // Celeste
  '#10b981', // Verde suave
  '#f97316', // Naranja moderado
  '#6366f1', // Índigo
  '#64748b', // Gris pizarra
];
