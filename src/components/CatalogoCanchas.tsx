import React, { useState, useEffect, useMemo } from 'react';
import type { Cancha } from '../types/database';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80';

const DISTRITOS = [
  'Todos',
  'Cercado',
  'José Luis Bustamante y Rivero',
  'Miraflores',
  'Cerro Colorado',
  'Yanahuara',
  'Cayma',
  'Sachaca',
];

const WSP_DEFAULT_TEXT =
  'Hola,%20vengo%20de%20Pichangas%20Arequipa.%20Quisiera%20consultar%20disponibilidad%20y%20tarifa%20de%20la%20cancha.';

export const CatalogoCanchas: React.FC = () => {
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState<string>('');
  const [distritoSeleccionado, setDistritoSeleccionado] = useState<string>('Todos');
  const [soloWhatsapp, setSoloWhatsapp] = useState<boolean>(false);

  useEffect(() => {
    const fetchCanchas = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/canchas');
        if (!res.ok) throw new Error('No se pudo cargar el directorio de canchas.');
        const data: Cancha[] = await res.json();
        setCanchas(data);
      } catch (err: any) {
        setError(err.message || 'Error al conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchCanchas();
  }, []);

  const canchasFiltradas = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    return canchas.filter((cancha) => {
      const coincideTexto =
        !query ||
        cancha.nombre?.toLowerCase().includes(query) ||
        cancha.direccion?.toLowerCase().includes(query) ||
        (cancha.referencia && cancha.referencia.toLowerCase().includes(query));

      const coincideDistrito =
        distritoSeleccionado === 'Todos' ||
        cancha.distrito?.toLowerCase().includes(distritoSeleccionado.toLowerCase());

      const tieneWhatsapp = Boolean(
        cancha.telefono_contacto && cancha.telefono_contacto.trim().length > 0
      );
      const coincideWhatsapp = !soloWhatsapp || tieneWhatsapp;

      return coincideTexto && coincideDistrito && coincideWhatsapp;
    });
  }, [canchas, busqueda, distritoSeleccionado, soloWhatsapp]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Encabezado y controles de filtrado */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Directorio de Canchas Sintéticas en Arequipa
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Explora complejos deportivos verificados, ubica su dirección en Google Maps y reserva directo por WhatsApp.
            </p>
          </div>
          <div className="text-sm font-medium text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl self-start md:self-auto">
            Mostrando <span className="font-bold text-emerald-600">{canchasFiltradas.length}</span> de{' '}
            {canchas.length} canchas
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Buscador por texto */}
          <div className="md:col-span-5">
            <label htmlFor="buscar-cancha" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Buscar por nombre, dirección o referencia
            </label>
            <input
              id="buscar-cancha"
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej. Bustamante, Dolores, Maracaná, Umacollo..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>

          {/* Selector de Distrito */}
          <div className="md:col-span-4">
            <label htmlFor="filtro-distrito" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Distrito
            </label>
            <select
              id="filtro-distrito"
              value={distritoSeleccionado}
              onChange={(e) => setDistritoSeleccionado(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
            >
              {DISTRITOS.map((distrito) => (
                <option key={distrito} value={distrito}>
                  {distrito === 'Todos' ? 'Todos los distritos' : distrito}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Solo con WhatsApp directo */}
          <div className="md:col-span-3 flex items-end h-full pt-2 md:pt-6">
            <label className="inline-flex items-center gap-3 cursor-pointer select-none bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 w-full transition">
              <input
                type="checkbox"
                checked={soloWhatsapp}
                onChange={(e) => setSoloWhatsapp(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-emerald-950">
                Solo con WhatsApp directo
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse"
            >
              <div className="h-48 w-full bg-slate-200" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-10 bg-slate-200 rounded-xl w-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : canchasFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-base font-medium text-slate-700">
            No encontramos canchas que coincidan con tu búsqueda.
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Prueba cambiando el distrito o desactivando el filtro de WhatsApp directo.
          </p>
          <button
            type="button"
            onClick={() => {
              setBusqueda('');
              setDistritoSeleccionado('Todos');
              setSoloWhatsapp(false);
            }}
            className="mt-4 inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        /* Grilla de tarjetas */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {canchasFiltradas.map((cancha) => {
            const tieneTelefono = Boolean(
              cancha.telefono_contacto && cancha.telefono_contacto.trim().length > 0
            );
            const telefonoLimpio = cancha.telefono_contacto
              ? cancha.telefono_contacto.replace(/[^0-9]/g, '')
              : '';
            const telefonoSecundarioLimpio = cancha.telefono_secundario
              ? cancha.telefono_secundario.replace(/[^0-9]/g, '')
              : '';

            return (
              <article
                key={cancha.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Contenedor de imagen con badges */}
                  <div className="h-48 w-full overflow-hidden bg-slate-800 relative">
                    <img
                      src={cancha.imagen_url || FALLBACK_IMAGE}
                      alt={cancha.nombre}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== FALLBACK_IMAGE) {
                          target.src = FALLBACK_IMAGE;
                        }
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/30 pointer-events-none" />

                    {/* Badge Superior Izquierdo: Distrito */}
                    <span className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                      📍 {cancha.distrito}
                    </span>

                    {/* Badge Superior Derecho: Estado de contacto */}
                    {tieneTelefono ? (
                      <span className="absolute top-3 right-3 bg-emerald-600/95 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                        WhatsApp Directo
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 bg-amber-500/95 backdrop-blur-sm text-slate-950 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                        Ver en Maps
                      </span>
                    )}
                  </div>

                  {/* Cuerpo de la tarjeta */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-slate-900 leading-snug">
                        {cancha.nombre}
                      </h3>
                      <span className="shrink-0 inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        ⚽ {cancha.tipo_deporte || 'Fútbol'}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 mb-1.5">
                      <span className="font-medium text-slate-800">Dirección:</span>{' '}
                      {cancha.direccion}
                    </p>

                    {cancha.referencia && (
                      <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mt-2">
                        <span className="font-semibold text-slate-700">Ref:</span>{' '}
                        {cancha.referencia}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pie de la tarjeta con botones */}
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex flex-col gap-2.5">
                  {tieneTelefono && (
                    <div className="flex flex-col gap-1.5">
                      <a
                        href={`https://wa.me/51${telefonoLimpio}?text=${WSP_DEFAULT_TEXT}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-2.5 px-4 shadow-sm transition"
                      >
                        💬 Consultar por WhatsApp
                      </a>

                      {telefonoSecundarioLimpio && (
                        <a
                          href={`https://wa.me/51${telefonoSecundarioLimpio}?text=${WSP_DEFAULT_TEXT}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-center text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline py-0.5"
                        >
                          📞 2do WhatsApp / Teléfono alternativo ({cancha.telefono_secundario})
                        </a>
                      )}
                    </div>
                  )}

                  {cancha.maps_url && (
                    <a
                      href={cancha.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm py-2.5 px-4 transition"
                    >
                      🗺️ Ubicación en Maps
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

