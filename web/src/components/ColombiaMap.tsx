import React, { useMemo, useState } from 'react';
import type { ColombiaMapData } from '../types/analytics';
import { formatInt, formatPct } from '../lib/format';

interface ColombiaMapProps {
  mapData: ColombiaMapData;
  countsByDepto: { key: string; nombre: string; hechos: number; pct: number }[];
  totalHechos: number;
  selectedDepto: string | 'TODOS';
  onSelectDepto: (deptoKey: string) => void;
}

function interpolateColor(ratio: number): string {
  // Escala limpia de celeste muy claro (#e0f2fe) -> azul medio (#2563eb) -> azul profundo (#0f294a)
  if (ratio <= 0) return '#f1f5f9';
  const t = Math.pow(Math.min(1, Math.max(0, ratio)), 0.45); // raíz para distinguir departamentos medianos de Bogotá/Antioquia
  const stops = [
    [224, 242, 254], // #e0f2fe
    [56, 189, 248],  // #38bdf8
    [29, 78, 216],   // #1d4ed8
    [15, 41, 74],    // #0f294a
  ];
  const scaled = t * (stops.length - 1);
  const idx = Math.min(stops.length - 2, Math.floor(scaled));
  const localT = scaled - idx;
  const c0 = stops[idx];
  const c1 = stops[idx + 1];
  const r = Math.round(c0[0] + (c1[0] - c0[0]) * localT);
  const g = Math.round(c0[1] + (c1[1] - c0[1]) * localT);
  const b = Math.round(c0[2] + (c1[2] - c0[2]) * localT);
  return `rgb(${r}, ${g}, ${b})`;
}

export const ColombiaMap: React.FC<ColombiaMapProps> = ({
  mapData,
  countsByDepto,
  totalHechos,
  selectedDepto,
  onSelectDepto,
}) => {
  const [hovered, setHovered] = useState<string | null>(null);

  const lookup = useMemo(() => {
    const m = new Map<string, { nombre: string; hechos: number; pct: number }>();
    for (const item of countsByDepto) {
      m.set(item.key, { nombre: item.nombre, hechos: item.hechos, pct: item.pct });
    }
    return m;
  }, [countsByDepto]);

  const maxCount = useMemo(() => {
    let max = 1;
    for (const item of countsByDepto) {
      if (item.hechos > max) max = item.hechos;
    }
    return max;
  }, [countsByDepto]);

  const activeInfo = useMemo(() => {
    const target = hovered ?? (selectedDepto !== 'TODOS' ? selectedDepto : null);
    if (!target) return null;
    const feat = mapData.features.find((f) => f.departamento === target);
    const stats = lookup.get(target);
    return {
      key: target,
      nombre: stats?.nombre ?? feat?.nombre ?? target,
      hechos: stats?.hechos ?? 0,
      pct: stats?.pct ?? 0,
    };
  }, [hovered, selectedDepto, mapData.features, lookup]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-2 px-1">
        <span className="text-xs text-slate-500">
          Haz clic en un departamento para filtrar el tablero
        </span>
        {selectedDepto !== 'TODOS' && (
          <button
            type="button"
            onClick={() => onSelectDepto('TODOS')}
            className="text-xs font-medium text-blue-700 hover:underline cursor-pointer"
          >
            Ver todo el país
          </button>
        )}
      </div>

      <div className="relative w-full max-w-[430px] aspect-[560/680] bg-slate-50/70 rounded-xl border border-slate-200/70 p-2">
        <svg viewBox={mapData.viewBox} className="w-full h-full select-none">
          {/* Recuadro de San Andrés */}
          <rect
            x={mapData.insetBox.x}
            y={mapData.insetBox.y}
            width={mapData.insetBox.width}
            height={mapData.insetBox.height}
            rx={8}
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <text
            x={mapData.insetBox.x + 6}
            y={mapData.insetBox.y + 14}
            fontSize={9}
            fill="#64748b"
            fontWeight={600}
          >
            San Andrés
          </text>

          {mapData.features.map((feat) => {
            const stat = lookup.get(feat.departamento);
            const count = stat?.hechos ?? 0;
            const isSelected = selectedDepto === feat.departamento;
            const isHover = hovered === feat.departamento;
            const fill =
              selectedDepto !== 'TODOS' && !isSelected
                ? '#e2e8f0'
                : interpolateColor(count / maxCount);

            return (
              <path
                key={feat.code}
                d={feat.d}
                fill={fill}
                stroke={isSelected ? '#f97316' : isHover ? '#0ea5e9' : '#ffffff'}
                strokeWidth={isSelected ? 2.2 : isHover ? 1.8 : 0.8}
                className="transition-colors duration-150 cursor-pointer"
                onMouseEnter={() => setHovered(feat.departamento)}
                onMouseLeave={() => setHovered(null)}
                onClick={() =>
                  onSelectDepto(
                    selectedDepto === feat.departamento ? 'TODOS' : feat.departamento
                  )
                }
              />
            );
          })}
        </svg>

        {/* Tarjeta flotante de inspección */}
        <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-sm flex items-center justify-between gap-3">
          {activeInfo ? (
            <>
              <div>
                <p className="text-xs font-bold text-[#0f294a]">{activeInfo.nombre}</p>
                <p className="text-[11px] text-slate-500">
                  {totalHechos > 0
                    ? `${formatPct(activeInfo.pct)} del filtro actual`
                    : 'Sin registros en filtro'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-blue-700 tabular-nums">
                  {formatInt(activeInfo.hechos)}
                </p>
                <p className="text-[10px] text-slate-400 uppercase">hechos</p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full text-xs text-slate-500">
              <span>Pasa el cursor sobre un departamento</span>
              <span className="font-mono text-[11px] text-slate-400">33 territorios</span>
            </div>
          )}
        </div>
      </div>

      {/* Escala cromática */}
      <div className="mt-3 w-full max-w-[340px] flex items-center gap-2 text-[11px] text-slate-500">
        <span>Menor</span>
        <div
          className="flex-1 h-2.5 rounded-full border border-slate-200"
          style={{
            background:
              'linear-gradient(90deg, #e0f2fe 0%, #38bdf8 35%, #1d4ed8 70%, #0f294a 100%)',
          }}
        />
        <span>Mayor ({formatInt(maxCount)})</span>
      </div>
    </div>
  );
};
