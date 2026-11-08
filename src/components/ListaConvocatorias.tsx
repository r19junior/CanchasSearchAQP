import React, { useState, useEffect } from 'react';
import type { ConvocatoriaConCancha, UnirseConvocatoriaPayload } from '../types/database';

interface Props {
  refreshTrigger?: number;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80';

export const ListaConvocatorias: React.FC<Props> = ({ refreshTrigger = 0 }) => {
  const [convocatorias, setConvocatorias] = useState<ConvocatoriaConCancha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distritoFiltro, setDistritoFiltro] = useState<string>('todos');

  // Estado para el modal de unirse
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<ConvocatoriaConCancha | null>(null);
  const [datosJugador, setDatosJugador] = useState<UnirseConvocatoriaPayload>({
    nombre: '',
    telefono: '',
    posicion: 'Volante',
  });
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [feedbackJoin, setFeedbackJoin] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(
    null
  );

  const fetchPartidos = async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        distritoFiltro === 'todos'
          ? '/api/convocatorias'
          : `/api/convocatorias?distrito=${encodeURIComponent(distritoFiltro)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al cargar partidos abiertos.');
      const data: ConvocatoriaConCancha[] = await res.json();
      setConvocatorias(data);
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartidos();
  }, [distritoFiltro, refreshTrigger]);

  const handleUnirseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partidoSeleccionado) return;

    setSubmittingJoin(true);
    setFeedbackJoin(null);

    try {
      const res = await fetch(`/api/convocatorias/${partidoSeleccionado.id}/unirse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosJugador),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo registrar la inscripción.');
      }

      setFeedbackJoin({
        tipo: 'exito',
        texto: '¡Inscripción exitosa! Coordina la llegada con el organizador.',
      });
      setTimeout(() => {
        setPartidoSeleccionado(null);
        setFeedbackJoin(null);
        setDatosJugador({ nombre: '', telefono: '', posicion: 'Volante' });
        fetchPartidos();
      }, 1500);
    } catch (err: any) {
      setFeedbackJoin({ tipo: 'error', texto: err.message });
    } finally {
      setSubmittingJoin(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Encabezado y filtro por distrito */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Pichangas Abiertas</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Encuentra partidos confirmados con cupos disponibles y súmate al instante.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Filtrar distrito:
          </label>
          <select
            value={distritoFiltro}
            onChange={(e) => setDistritoFiltro(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="todos">Todos los distritos</option>
            <option value="Cercado">Cercado</option>
            <option value="José Luis Bustamante y Rivero">José Luis Bustamante y Rivero</option>
            <option value="Miraflores">Miraflores</option>
            <option value="Cerro Colorado">Cerro Colorado</option>
            <option value="Yanahuara">Yanahuara</option>
            <option value="Cayma">Cayma</option>
            <option value="Sachaca">Sachaca</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse"
            >
              <div className="h-40 bg-slate-200 w-full" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-10 bg-slate-200 rounded-xl w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : convocatorias.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-base font-medium text-slate-700">
            No hay convocatorias abiertas en este distrito en este momento.
          </p>
          <p className="text-sm text-slate-500 mt-1">
            ¡Sé el primero en armar una pichanga usando el formulario de arriba!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {convocatorias.map((partido) => {
            const cuposLibres = partido.cupos_totales - partido.cupos_confirmados;
            const telefonoOrg = partido.organizador_telefono.replace(/[^0-9]/g, '');
            const wspHref = telefonoOrg.startsWith('51')
              ? `https://wa.me/${telefonoOrg}`
              : `https://wa.me/51${telefonoOrg}`;

            return (
              <article
                key={partido.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Miniatura de la cancha con badges */}
                  <div className="h-40 w-full overflow-hidden bg-slate-800 relative">
                    <img
                      src={partido.canchas?.imagen_url || FALLBACK_IMAGE}
                      alt={partido.canchas?.nombre || 'Cancha'}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== FALLBACK_IMAGE) {
                          target.src = FALLBACK_IMAGE;
                        }
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/30 pointer-events-none" />

                    <span className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      📍 {partido.canchas?.distrito || 'Arequipa'}
                    </span>

                    <span className="absolute top-3 right-3 bg-amber-400 text-slate-950 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                      🔥 Faltan {cuposLibres} {cuposLibres === 1 ? 'cupo' : 'cupos'}
                    </span>
                  </div>

                  {/* Cuerpo de la tarjeta */}
                  <div className="p-5">
                    <h4 className="text-lg font-bold text-slate-900 leading-snug mb-1">
                      {partido.canchas?.nombre || 'Complejo Deportivo'}
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">{partido.canchas?.direccion}</p>

                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 mb-3">
                      <span>📅 {partido.fecha}</span>
                      <span>⏰ {partido.hora_inicio.slice(0, 5)} hrs</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
                      <span>
                        Organiza:{' '}
                        <strong className="text-slate-900">{partido.organizador_nombre}</strong>
                      </span>

                      {partido.canchas?.maps_url && (
                        <a
                          href={partido.canchas.maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          🗺️ Ver Maps
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones de la tarjeta */}
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex flex-col gap-2">
                  <a
                    href={wspHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs py-2 px-3 transition"
                  >
                    💬 WhatsApp del Organizador
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setPartidoSeleccionado(partido);
                      setFeedbackJoin(null);
                    }}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 px-4 shadow-sm transition cursor-pointer"
                  >
                    Sumarme a este partido
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal interactivo de inscripción con backdrop-blur-sm */}
      {partidoSeleccionado && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Inscribirme a la Pichanga</h3>
            <p className="text-xs text-slate-600 mb-4">
              Lugar: <strong className="text-slate-900">{partidoSeleccionado.canchas?.nombre}</strong>{' '}
              ({partidoSeleccionado.fecha} a las {partidoSeleccionado.hora_inicio.slice(0, 5)})
            </p>

            {feedbackJoin && (
              <div
                className={`rounded-xl px-4 py-3 mb-4 text-sm font-medium border ${
                  feedbackJoin.tipo === 'exito'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {feedbackJoin.texto}
              </div>
            )}

            <form onSubmit={handleUnirseSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Tu Nombre / Apodo
                </label>
                <input
                  type="text"
                  placeholder="Ej. Rodrigo"
                  value={datosJugador.nombre}
                  onChange={(e) => setDatosJugador({ ...datosJugador, nombre: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Teléfono de contacto
                </label>
                <input
                  type="tel"
                  placeholder="Ej. 953713569"
                  value={datosJugador.telefono}
                  onChange={(e) => setDatosJugador({ ...datosJugador, telefono: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Posición en cancha
                </label>
                <select
                  value={datosJugador.posicion}
                  onChange={(e) => setDatosJugador({ ...datosJugador, posicion: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Volante">Volante</option>
                  <option value="Delantero">Delantero</option>
                  <option value="Defensa">Defensa</option>
                  <option value="Arquero">Arquero</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setPartidoSeleccionado(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={submittingJoin}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold shadow-sm transition cursor-pointer"
                >
                  {submittingJoin ? 'Guardando...' : 'Confirmar asistencia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
