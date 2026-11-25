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

const ACCENT_STYLES: Record<NonNullable<KpiCardProps['accent']>, string> = {
  navy: 'bg-[#0f294a]/10 text-[#0f294a]',
  blue: 'bg-blue-50 text-blue-700',
  sky: 'bg-sky-50 text-sky-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  orange: 'bg-orange-50 text-orange-600',
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
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-[#0f294a] tabular-nums leading-tight break-words">
            {value}
          </p>
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${ACCENT_STYLES[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {(subtitle || badge) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          {subtitle && <span className="text-xs text-slate-500 truncate">{subtitle}</span>}
          {badge && (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border tabular-nums ${BADGE_STYLES[badgeTone]}`}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
