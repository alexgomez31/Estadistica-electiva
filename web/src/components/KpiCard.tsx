import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  accent?: 'navy' | 'blue' | 'sky' | 'emerald' | 'orange';
  badge?: string;
  badgeTone?: 'positive' | 'negative' | 'neutral';
}

const TOP_BAR_STYLES: Record<NonNullable<KpiCardProps['accent']>, string> = {
  navy: 'from-[#0b1f3b] to-[#1e3a8a]',
  blue: 'from-blue-600 to-sky-500',
  sky: 'from-sky-500 to-cyan-400',
  emerald: 'from-emerald-600 to-teal-400',
  orange: 'from-orange-500 to-amber-400',
};

const ICON_BG_STYLES: Record<NonNullable<KpiCardProps['accent']>, string> = {
  navy: 'bg-[#0f294a] text-sky-300 shadow-sm',
  blue: 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm',
  sky: 'bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-sm',
  emerald: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm',
  orange: 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm',
};

const BADGE_STYLES: Record<NonNullable<KpiCardProps['badgeTone']>, string> = {
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  negative: 'bg-orange-50 text-orange-700 border-orange-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'blue',
  badge,
  badgeTone = 'neutral',
}) => {
  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
      {/* Barra superior de acento */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${TOP_BAR_STYLES[accent]}`}
      />

      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-2xl sm:text-[26px] font-extrabold text-[#0b1f3b] tabular-nums leading-tight break-words tracking-tight">
            {value}
          </p>
        </div>
        <div
          className={`p-2.5 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-105 ${ICON_BG_STYLES[accent]}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || badge) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          {subtitle && (
            <span className="text-xs text-slate-500 truncate font-medium">{subtitle}</span>
          )}
          {badge && (
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border tabular-nums ${BADGE_STYLES[badgeTone]}`}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
