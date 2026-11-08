import React, { useState } from 'react';
import { CatalogoCanchas } from './CatalogoCanchas';
import { FormNuevaConvocatoria } from './FormNuevaConvocatoria';
import { ListaConvocatorias } from './ListaConvocatorias';

type TabActiva = 'canchas' | 'partidos';

export const AppPichangas: React.FC = () => {
  const [tabActiva, setTabActiva] = useState<TabActiva>('canchas');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleConvocatoriaCreada = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Barra de navegación sticky con pestañas tipo píldora */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-center">
          <div className="inline-flex rounded-full bg-slate-100 p-1.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setTabActiva('canchas')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                tabActiva === 'canchas'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏟️ Directorio de Canchas (25)
            </button>
            <button
              type="button"
              onClick={() => setTabActiva('partidos')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                tabActiva === 'partidos'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚽ Pichangas Abiertas (Armar / Unirse)
            </button>
          </div>
        </div>
      </div>

      {/* Contenido dinámico según la pestaña activa */}
      {tabActiva === 'canchas' ? (
        <CatalogoCanchas />
      ) : (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1">
              <FormNuevaConvocatoria onConvocatoriaCreada={handleConvocatoriaCreada} />
            </div>
            <div className="lg:col-span-2">
              <ListaConvocatorias refreshTrigger={refreshKey} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
