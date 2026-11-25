import React, { useState } from 'react';
import {
  BarChart3,
  ChevronRight,
  Database,
  Home,
  Menu,
  Presentation,
  Sigma,
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
    sublabel: 'Visión general y contexto',
    icon: Home,
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    sublabel: 'Análisis interactivo de hurtos',
    icon: BarChart3,
  },
  {
    id: 'ciencia-datos',
    label: 'Electiva III',
    sublabel: 'Ciencia de datos y ETL',
    icon: Database,
  },
  {
    id: 'estadistica-inferencial',
    label: 'Estadística Inferencial',
    sublabel: 'Bayes, Poisson, IC e hipótesis',
    icon: Sigma,
  },
  {
    id: 'presentacion',
    label: 'Presentación',
    sublabel: 'Diapositivas de sustentación',
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
    <div className="flex flex-col h-full bg-[#0f294a] text-white">
      {/* Marca institucional */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="bg-white rounded-2xl p-3 mb-4 flex justify-center shadow-md">
          <img
            src="/logos/Versiones_Logo_Unimayor-01.png"
            alt="Institución Universitaria Colegio Mayor del Cauca"
            className="h-28 w-auto"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-300">
              Unimayor · Ing. Informática
            </p>
            <h1 className="text-sm font-bold leading-snug truncate">
              Observatorio Hurtos CO
            </h1>
          </div>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto" aria-label="Módulos de la plataforma">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Módulos Académicos
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeModule;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950/30'
                  : 'text-slate-300 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-sky-200' : 'text-slate-400'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">{item.label}</p>
                <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                  {item.sublabel}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Pie informativo */}
      <div className="p-4 border-t border-white/10 text-xs text-slate-300 space-y-1.5 bg-black/15">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Registros reales</span>
          <span className="font-mono font-semibold text-sky-300">1,354,442</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Cobertura</span>
          <span className="font-mono text-slate-200">2010 – Jul 2026</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Modelo grupo</span>
          <span className="font-semibold text-emerald-300">Grupo 2 · Poisson</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar escritorio */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Drawer móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
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
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
              aria-label="Abrir navegación"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 min-w-0">
              <span className="hidden sm:inline font-medium text-slate-400">Plataforma</span>
              <ChevronRight className="hidden sm:inline w-4 h-4 text-slate-300 shrink-0" />
              <span className="font-semibold text-[#0f294a] truncate">{activeItem.label}</span>
              {breadcrumbSub && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  <span className="text-blue-700 font-medium truncate">{breadcrumbSub}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Datos Abiertos DIJIN
            </span>
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              Electiva III + Estadística Inferencial
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
