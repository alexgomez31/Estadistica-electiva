import React, { useState } from 'react';
import {
  BarChart3,
  ChevronRight,
  Database,
  Home,
  Menu,
  Presentation,
  Sigma,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import type { ModuleId } from '../types/analytics';

interface LayoutProps {
  activeModule: ModuleId;
  onSelectModule: (id: ModuleId) => void;
  breadcrumbSub?: string;
  children: React.ReactNode;
}

const NAV_ITEMS: {
  id: ModuleId;
  label: string;
  sublabel: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'inicio',
    label: 'Inicio',
    sublabel: 'Visión general y equipo',
    icon: Home,
  },
  {
    id: 'dashboard',
    label: 'Dashboard BI',
    sublabel: 'Mapa y filtros dinámicos',
    icon: BarChart3,
  },
  {
    id: 'ciencia-datos',
    label: 'Electiva III',
    sublabel: 'ETL, descriptivo y ML',
    icon: Database,
  },
  {
    id: 'estadistica-inferencial',
    label: 'Estadística Inferencial',
    sublabel: 'Bayes, Poisson, IC y prueba z',
    icon: Sigma,
  },
  {
    id: 'presentacion',
    label: 'Presentación',
    sublabel: '18 diapositivas · 15 min',
    icon: Presentation,
  },
];

export const Layout: React.FC<LayoutProps> = ({
  activeModule,
  onSelectModule,
  breadcrumbSub,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = NAV_ITEMS.find((n) => n.id === activeModule) ?? NAV_ITEMS[0];

  const handleNav = (id: ModuleId) => {
    onSelectModule(id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#09182e] via-[#0f294a] to-[#12335e] text-white border-r border-white/10">
      {/* Marca institucional */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-sky-950/50">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-300">
              Unimayor · Ing. Informática
            </p>
            <h1 className="text-sm font-extrabold leading-snug tracking-tight">
              Hurtos Colombia BI
            </h1>
          </div>
        </div>
      </div>

      {/* Navegación principal */}
      <nav
        className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto"
        aria-label="Módulos de la plataforma"
      >
        <p className="px-3.5 mb-2.5 text-[10px] font-bold uppercase tracking-widest text-sky-300/70">
          Navegación Principal
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeModule;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`group relative w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-950/40'
                  : 'text-slate-300 hover:bg-white/8 hover:text-white'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 transition-colors ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-300 group-hover:text-sky-300'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight">{item.label}</p>
                <p
                  className={`text-[11px] truncate mt-0.5 ${
                    isActive ? 'text-sky-100' : 'text-slate-400'
                  }`}
                >
                  {item.sublabel}
                </p>
              </div>
              {isActive && <span className="w-1.5 h-6 rounded-full bg-white/80 shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Tarjeta de estado de datos */}
      <div className="m-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs text-xs space-y-2">
        <div className="flex items-center gap-1.5 text-sky-300 font-bold text-[11px] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Dataset Verificado
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Registros</span>
          <span className="font-mono font-bold text-white">1,354,442</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Cobertura</span>
          <span className="font-mono text-slate-200">2010 – Jul 2026</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Modelo</span>
          <span className="font-semibold text-emerald-300">Poisson · Bayes</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-100 bg-grid-pattern text-slate-900">
      {/* Sidebar escritorio */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Drawer móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Barra superior */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              aria-label="Abrir navegación"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 min-w-0">
              <span className="hidden sm:inline font-medium text-slate-400">Observatorio</span>
              <ChevronRight className="hidden sm:inline w-4 h-4 text-slate-300 shrink-0" />
              <span className="font-bold text-[#0b1f3b] truncate">{activeItem.label}</span>
              {breadcrumbSub && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  <span className="text-blue-700 font-semibold truncate">{breadcrumbSub}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              DIJIN · datos.gov.co
            </span>
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
              Electiva III &amp; Estadística Inferencial
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto animate-slide-in">
          {children}
        </main>
      </div>
    </div>
  );
};
