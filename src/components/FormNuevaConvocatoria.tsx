import React, { useState, useEffect } from 'react';
import type { Cancha, CrearConvocatoriaPayload } from '../types/database';

interface Props {
  onConvocatoriaCreada?: () => void;
}

export const FormNuevaConvocatoria: React.FC<Props> = ({ onConvocatoriaCreada }) => {
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [loadingCanchas, setLoadingCanchas] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const [formData, setFormData] = useState<CrearConvocatoriaPayload>({
    cancha_id: 0,
    fecha: '',
    hora_inicio: '',
    cupos_totales: 2,
    organizador_nombre: '',
    organizador_telefono: '',
  });

  useEffect(() => {
    const fetchCanchas = async () => {
      try {
        const res = await fetch('/api/canchas');
        if (!res.ok) throw new Error('Error al cargar canchas');
        const data: Cancha[] = await res.json();
        setCanchas(data);
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, cancha_id: data[0].id }));
        }
      } catch (err: any) {
        setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los complejos deportivos.' });
      } finally {
        setLoadingCanchas(false);
      }
    };

    fetchCanchas();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'cancha_id' || name === 'cupos_totales' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMensaje(null);

    try {
      const res = await fetch('/api/convocatorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al publicar la convocatoria.');
      }

      setMensaje({ tipo: 'exito', texto: '¡Pichanga armada con éxito! Ya aparece en el tablero.' });

      // Limpiar campos de fecha, hora y cupos
      setFormData((prev) => ({
        ...prev,
        fecha: '',
        hora_inicio: '',
        cupos_totales: 2,
      }));

      if (onConvocatoriaCreada) {
        onConvocatoriaCreada();
      }
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-xl mx-auto mb-8">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-slate-900">Armar una Pichanga</h3>
        <p className="text-sm text-slate-500 mt-1">
          Publica los cupos que te faltan para completar tu equipo en Arequipa.
        </p>
      </div>

      {mensaje && (
        <div
          className={`rounded-xl px-4 py-3 mb-5 text-sm font-medium border ${
            mensaje.tipo === 'exito'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {loadingCanchas ? (
        <div className="py-6 text-center text-sm text-slate-500 animate-pulse">
          Cargando canchas disponibles...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Complejo / Cancha
            </label>
            <select
              name="cancha_id"
              value={formData.cancha_id}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
              required
            >
              {canchas.map((cancha) => (
                <option key={cancha.id} value={cancha.id}>
                  {`${cancha.nombre} (${cancha.distrito})`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Fecha
              </label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Hora
              </label>
              <input
                type="time"
                name="hora_inicio"
                value={formData.hora_inicio}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Cupos faltantes
            </label>
            <input
              type="number"
              name="cupos_totales"
              min="1"
              max="15"
              value={formData.cupos_totales}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Tu Nombre / Apodo
              </label>
              <input
                type="text"
                name="organizador_nombre"
                placeholder="Ej. Rodrigo"
                value={formData.organizador_nombre}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                WhatsApp de contacto
              </label>
              <input
                type="tel"
                name="organizador_telefono"
                placeholder="Ej. 953713569"
                value={formData.organizador_telefono}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 px-4 text-sm shadow-sm transition cursor-pointer"
          >
            {submitting ? 'Publicando...' : '⚽ Publicar Convocatoria'}
          </button>
        </form>
      )}
    </div>
  );
};
