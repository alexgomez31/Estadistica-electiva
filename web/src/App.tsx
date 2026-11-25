import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { ModuleId } from './types/analytics';
import { usePlatformData } from './lib/usePlatformData';
import { Layout } from './components/Layout';
import { InicioModule } from './modules/InicioModule';
import { DashboardModule } from './modules/DashboardModule';
import { CienciaDatosModule } from './modules/CienciaDatosModule';
import { EstadisticaModule } from './modules/EstadisticaModule';
import { PresentacionModule } from './modules/PresentacionModule';

const VALID_MODULES: ModuleId[] = [
  'inicio',
  'dashboard',
  'ciencia-datos',
  'estadistica-inferencial',
  'presentacion',
];

function getInitialModule(): ModuleId {
  const hash = window.location.hash.replace('#', '') as ModuleId;
  return VALID_MODULES.includes(hash) ? hash : 'inicio';
}

export const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>(getInitialModule);
  const { data, loading, error } = usePlatformData();

  useEffect(() => {
    window.location.hash = activeModule;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeModule]);

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#', '') as ModuleId;
      if (VALID_MODULES.includes(h)) setActiveModule(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 text-blue-700 animate-spin" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#0f294a]">
            Cargando Observatorio Analítico de Hurtos en Colombia
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Inicializando cubos multidimensionales (1,354,442 registros) y modelos estadísticos...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-red-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-red-700">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <h1 className="text-lg font-bold">Error al cargar los datos reales</h1>
          </div>
          <p className="text-sm text-slate-600">
            {error ?? 'No se pudieron inicializar los archivos JSON del directorio public/data.'}
          </p>
          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
            Ejecuta: python data_pipeline/build_artifacts.py
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout activeModule={activeModule} onSelectModule={setActiveModule}>
      {activeModule === 'inicio' && (
        <InicioModule data={data} onNavigate={setActiveModule} />
      )}
      {activeModule === 'dashboard' && <DashboardModule data={data} />}
      {activeModule === 'ciencia-datos' && <CienciaDatosModule data={data} />}
      {activeModule === 'estadistica-inferencial' && <EstadisticaModule data={data} />}
      {activeModule === 'presentacion' && <PresentacionModule data={data} />}
    </Layout>
  );
};

export default App;
