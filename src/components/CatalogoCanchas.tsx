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

const AMENIDADES_CARD = ['parking', 'duchas', 'vestuarios', '+2 más'];
const AMENIDADES_MODAL = ['parking', 'duchas', 'vestuarios', 'Reflectores', 'Camarines'];

const WSP_DEFAULT_TEXT =
  'Hola,%20vengo%20de%20CanchaSearch%20Arequipa.%20Quisiera%20consultar%20disponibilidad%20y%20tarifa%20de%20la%20cancha.';

export const CatalogoCanchas: React.FC = () => {
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState<string>('');
  const [distritoSeleccionado, setDistritoSeleccionado] = useState<string>('Todos');
  const [soloWhatsapp, setSoloWhatsapp] = useState<boolean>(false);
  const [imagenesFallidas, setImagenesFallidas] = useState<Record<number, boolean>>({});

  // Estado para la ventana flotante (Modal de detalles)
  const [canchaActiva, setCanchaActiva] = useState<Cancha | null>(null);

  useEffect(() => {
    const handleHeroFilter = (e: Event) => {
      const customEvent = e as CustomEvent<{ distrito?: string; busqueda?: string }>;
      if (customEvent.detail) {
        if (typeof customEvent.detail.distrito === 'string') {
          setDistritoSeleccionado(customEvent.detail.distrito);
        }
        if (typeof customEvent.detail.busqueda === 'string') {
          setBusqueda(customEvent.detail.busqueda);
        }
      }
    };

    window.addEventListener('canchasearch:filter', handleHeroFilter);
    return () => window.removeEventListener('canchasearch:filter', handleHeroFilter);
  }, []);

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

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCanchaActiva(null);
    };
    if (canchaActiva) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canchaActiva]);

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

  const obtenerTarifa = (cancha: Cancha) => {
    return cancha.tarifa_hora && Number(cancha.tarifa_hora) > 0 ? Number(cancha.tarifa_hora) : 120;
  };

  const obtenerDeporte = (cancha: Cancha) => {
    if (!cancha.tipo_deporte || cancha.tipo_deporte.toLowerCase().includes('grass')) {
      return 'Fútbol 6';
    }
    return cancha.tipo_deporte;
  };

  const obtenerDescripcionDetallada = (cancha: Cancha) => {
    const base = `${cancha.nombre} es un complejo deportivo de grass sintético ubicado en ${cancha.distrito} (${cancha.direccion}). Cuenta con iluminación mediante reflectores LED para partidos nocturnos, malla perimetral completa, zonas de descanso, vestuarios, duchas y estacionamiento cercano.`;
    if (cancha.verificacion_nota) {
      return `${base} ${cancha.verificacion_nota}.`;
    }
    return base;
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Encabezado Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
            Directorio de Canchas Sintéticas en Arequipa
          </h2>
          <p className="text-sm sm:text-[15px] text-slate-600 mt-1">
            Explora complejos deportivos verificados, ubica su dirección en Google Maps y reserva directo por WhatsApp.
          </p>
        </div>

        <div className="self-start sm:self-center shrink-0 bg-white border border-slate-300 rounded-full px-4 py-1.5 text-sm text-slate-700 shadow-2xs">
          Mostrando <span className="font-extrabold text-slate-900">{canchasFiltradas.length} canchas</span>
        </div>
      </div>

      {/* Barra Blanca de Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 px-5 py-4 mb-7">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Buscador por nombre o referencia */}
          <div className="md:col-span-5">
            <label
              htmlFor="buscar-cancha"
              className="block text-xs font-extrabold text-slate-800 uppercase tracking-wide mb-1.5"
            >
              BUSCAR POR NOMBRE O REFERENCIA
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                </svg>
              </span>
              <input
                id="buscar-cancha"
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Ej. Bustamante, Dolores, Maracaná..."
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#16913f] focus:outline-none focus:ring-2 focus:ring-[#16913f]/20 transition"
              />
            </div>
          </div>

          {/* Selector de Distrito */}
          <div className="md:col-span-4">
            <label
              htmlFor="filtro-distrito"
              className="block text-xs font-extrabold text-slate-800 uppercase tracking-wide mb-1.5"
            >
              DISTRITO
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21s-7-5.686-7-11a7 7 0 1114 0c0 5.314-7 11-7 11z"
                  />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </span>
              <select
                id="filtro-distrito"
                value={distritoSeleccionado}
                onChange={(e) => setDistritoSeleccionado(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-9 py-2.5 text-sm text-slate-800 focus:border-[#16913f] focus:outline-none focus:ring-2 focus:ring-[#16913f]/20 transition cursor-pointer"
              >
                {DISTRITOS.map((distrito) => (
                  <option key={distrito} value={distrito}>
                    {distrito === 'Todos' ? 'Todos los distritos' : distrito}
                  </option>
                ))}
              </select>
              <span className="absolute inset-y-0 right-3.5 flex items-center text-slate-500 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
          </div>

          {/* Switch Toggle: Solo con WhatsApp directo */}
          <div className="md:col-span-3 flex items-center md:justify-center pb-1">
            <button
              type="button"
              role="switch"
              aria-checked={soloWhatsapp}
              onClick={() => setSoloWhatsapp((prev) => !prev)}
              className="inline-flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <span
                className={`relative inline-flex h-7 w-13 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
                  soloWhatsapp ? 'bg-[#16913f]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    soloWhatsapp ? 'translate-x-6 text-[#16913f]' : 'translate-x-0 text-slate-400'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2Z" />
                  </svg>
                </span>
              </span>
              <span className="text-sm font-bold text-slate-900 group-hover:text-[#16913f] transition">
                Solo con WhatsApp directo
              </span>
            </button>
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
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-6 bg-slate-200 rounded-full w-full" />
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="h-10 bg-slate-200 rounded-xl" />
                  <div className="h-10 bg-slate-200 rounded-xl" />
                </div>
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
            className="mt-4 inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-[#16913f] text-white hover:bg-[#127a34] transition cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        /* Grilla de Tarjetas (Diseño 1: "Tarjeta de búsqueda") */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {canchasFiltradas.map((cancha) => {
            const tieneTelefono = Boolean(
              cancha.telefono_contacto && cancha.telefono_contacto.trim().length > 0
            );
            const telefonoLimpio = cancha.telefono_contacto
              ? cancha.telefono_contacto.replace(/[^0-9]/g, '')
              : '';
            const sinImagenOriginal = !cancha.imagen_url || imagenesFallidas[cancha.id];
            const tarifa = obtenerTarifa(cancha);
            const deporte = obtenerDeporte(cancha);

            return (
              <article
                key={cancha.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgb(0,0,0,0.05)] hover:shadow-[0_8px_28px_rgb(0,0,0,0.09)] transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Imagen Superior con Badges Blancos Translúcidos */}
                  <div
                    onClick={() => setCanchaActiva(cancha)}
                    className="h-48 w-full overflow-hidden bg-slate-800 relative cursor-pointer group"
                  >
                    <img
                      src={sinImagenOriginal ? FALLBACK_IMAGE : cancha.imagen_url!}
                      alt={cancha.nombre}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={() => {
                        setImagenesFallidas((prev) => ({ ...prev, [cancha.id]: true }));
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Badge Izquierdo: Distrito */}
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-900 text-xs font-semibold px-3 py-1 rounded-lg shadow-xs">
                      {cancha.distrito}
                    </span>

                    {/* Badge Derecho: Formato de Deporte */}
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-slate-900 text-xs font-semibold px-3 py-1 rounded-lg shadow-xs">
                      {deporte}
                    </span>
                  </div>

                  {/* Cuerpo de la Tarjeta */}
                  <div className="p-5 pb-4">
                    <h3
                      onClick={() => setCanchaActiva(cancha)}
                      className="text-xl font-extrabold text-slate-900 leading-snug hover:text-[#16913f] transition cursor-pointer"
                    >
                      {cancha.nombre}
                    </h3>

                    {/* Dirección con pin */}
                    <p className="text-sm text-slate-600 mt-1.5 flex items-center gap-1.5">
                      <svg
                        className="w-4 h-4 text-slate-500 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 21s-7-5.686-7-11a7 7 0 1114 0c0 5.314-7 11-7 11z"
                        />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                      <span className="truncate">
                        {cancha.direccion}, {cancha.distrito}
                      </span>
                    </p>

                    {/* Rating + Precio por hora */}
                    <div className="mt-2.5 flex items-center gap-1.5 text-sm text-slate-800">
                      <span className="text-amber-400 text-base leading-none">★</span>
                      <span className="font-semibold">5.0</span>
                      <span className="text-slate-400">•</span>
                      <span>
                        <strong className="font-extrabold text-slate-900">S/ {tarifa}</strong> por hora
                      </span>
                    </div>

                    {/* Pills de amenidades */}
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {AMENIDADES_CARD.map((item) => (
                        <span
                          key={item}
                          className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pie de la Tarjeta: 2 Botones ("Ver detalles" y "Consultar") */}
                <div className="px-5 pb-5 pt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCanchaActiva(cancha)}
                    className="w-full rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm py-2.5 px-3 transition cursor-pointer"
                  >
                    Ver detalles
                  </button>

                  {tieneTelefono ? (
                    <a
                      href={`https://wa.me/51${telefonoLimpio}?text=${WSP_DEFAULT_TEXT}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2eb85c] hover:bg-[#249e4c] text-white font-semibold text-sm py-2.5 px-3 shadow-2xs transition"
                    >
                      <span>Consultar</span>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2Z" />
                      </svg>
                    </a>
                  ) : (
                    <a
                      href={cancha.maps_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2eb85c] hover:bg-[#249e4c] text-white font-semibold text-sm py-2.5 px-3 shadow-2xs transition"
                    >
                      <span>Ver Maps</span>
                      <span>🗺️</span>
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Ventana Flotante / Modal Detallado (Diseño 2: "Modal abierto") */}
      {canchaActiva && (
        <div
          onClick={() => setCanchaActiva(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Imagen Superior del Modal con botón X */}
            <div className="h-52 w-full bg-slate-800 relative overflow-hidden">
              <img
                src={
                  !canchaActiva.imagen_url || imagenesFallidas[canchaActiva.id]
                    ? FALLBACK_IMAGE
                    : canchaActiva.imagen_url
                }
                alt={canchaActiva.nombre}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setCanchaActiva(null)}
                aria-label="Cerrar modal"
                className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              {/* Fila de Título + Badges de Deporte y Tarifa */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-2xl font-extrabold text-slate-900 leading-tight">
                  {canchaActiva.nombre}
                </h3>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="bg-slate-100 border border-slate-200/80 text-slate-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {obtenerDeporte(canchaActiva)}
                  </span>
                  <span className="bg-slate-100 border border-slate-200/80 text-slate-800 text-xs font-semibold px-3 py-1 rounded-full">
                    S/ {obtenerTarifa(canchaActiva)} por hora
                  </span>
                </div>
              </div>

              {/* Dirección y Referencia */}
              <p className="text-sm text-slate-700 mt-2 flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-slate-500 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21s-7-5.686-7-11a7 7 0 1114 0c0 5.314-7 11-7 11z"
                  />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                <span>
                  {canchaActiva.direccion}, {canchaActiva.distrito}
                </span>
              </p>

              <p className="text-sm text-slate-600 mt-1">
                Ref: {canchaActiva.referencia || `Zona ${canchaActiva.distrito}`}
              </p>

              {/* Amenidades Completas */}
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {AMENIDADES_MODAL.map((item) => (
                  <span
                    key={item}
                    className="bg-slate-100 border border-slate-200/60 text-slate-700 text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {item}
                  </span>
                ))}
              </div>

              {/* Descripción Detallada del Lugar */}
              <div className="mt-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Descripción del lugar
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {obtenerDescripcionDetallada(canchaActiva)}
                </p>
                {canchaActiva.telefono_contacto && (
                  <div className="mt-2 pt-2 border-t border-slate-200/70 flex flex-wrap items-center gap-4 text-xs text-slate-700">
                    <span>
                      <strong>Contacto principal:</strong> {canchaActiva.telefono_contacto}
                    </span>
                    {canchaActiva.telefono_secundario && (
                      <span>
                        <strong>2do contacto:</strong> {canchaActiva.telefono_secundario}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Sección Ubicación con Mapa Visual Interactivo */}
              <div className="mt-4">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Ubicación</h4>
                <a
                  href={
                    canchaActiva.maps_url ||
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${canchaActiva.nombre} ${canchaActiva.direccion} Arequipa`
                    )}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative h-32 w-full rounded-xl overflow-hidden border border-slate-200 group"
                >
                  {/* Fondo estilizado estilo Google Maps */}
                  <div
                    className="absolute inset-0 bg-[#f1f3f4]"
                    style={{
                      backgroundImage: `
                        linear-gradient(25deg, transparent 42%, #ffffff 42%, #ffffff 46%, transparent 46%),
                        linear-gradient(-35deg, transparent 55%, #ffffff 55%, #ffffff 60%, transparent 60%),
                        linear-gradient(75deg, transparent 30%, #fde68a 30%, #fde68a 35%, transparent 35%),
                        linear-gradient(110deg, transparent 65%, #e2e8f0 65%, #e2e8f0 68%, transparent 68%),
                        radial-gradient(circle at 70% 30%, #dcfce7 0%, transparent 35%),
                        radial-gradient(circle at 25% 75%, #dcfce7 0%, transparent 30%)
                      `,
                    }}
                  />

                  {/* Pin central y etiqueta Arequipa */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <svg className="w-8 h-8 text-red-600 drop-shadow-sm -mb-0.5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span className="text-base font-extrabold text-slate-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                      Arequipa
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-white/90 px-2.5 py-0.5 rounded-full shadow-2xs mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition">
                      Abrir en Google Maps ↗
                    </span>
                  </div>

                  {/* Logos esquineros tipo Google Maps */}
                  <span className="absolute bottom-1.5 left-2.5 text-[11px] font-bold tracking-tight">
                    <span className="text-blue-600">G</span>
                    <span className="text-red-500">o</span>
                    <span className="text-amber-500">o</span>
                    <span className="text-blue-600">g</span>
                    <span className="text-emerald-600">l</span>
                    <span className="text-red-500">e</span>
                  </span>
                  <span className="absolute bottom-1.5 right-2.5 text-[10px] text-slate-500 bg-white/80 px-1.5 rounded">
                    Map data ©2026 Google
                  </span>
                </a>
              </div>

              {/* Botón Principal Inferior del Modal */}
              {canchaActiva.telefono_contacto ? (
                <a
                  href={`https://wa.me/51${canchaActiva.telefono_contacto.replace(
                    /[^0-9]/g,
                    ''
                  )}?text=${WSP_DEFAULT_TEXT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2eb85c] hover:bg-[#249e4c] text-white font-bold text-sm py-3.5 px-4 shadow-sm transition"
                >
                  Consultar por WhatsApp
                </a>
              ) : (
                <a
                  href={canchaActiva.maps_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2eb85c] hover:bg-[#249e4c] text-white font-bold text-sm py-3.5 px-4 shadow-sm transition"
                >
                  Ver ubicación en Google Maps
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
