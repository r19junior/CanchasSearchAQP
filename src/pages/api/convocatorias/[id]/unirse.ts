import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import type { UnirseConvocatoriaPayload } from '../../../../types/database';

export const POST: APIRoute = async ({ params, request }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'ID de convocatoria no especificado' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload: UnirseConvocatoriaPayload = await request.json();

    if (!payload.nombre || !payload.telefono) {
      return new Response(
        JSON.stringify({ error: 'Nombre y teléfono son obligatorios.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Consultar estado y cupos de la convocatoria
    const { data: partido, error: fetchError } = await supabase
      .from('convocatorias')
      .select('cupos_totales, cupos_confirmados, estado')
      .eq('id', id)
      .single();

    if (fetchError || !partido) {
      return new Response(JSON.stringify({ error: 'Convocatoria no encontrada.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (partido.estado !== 'abierta' || partido.cupos_confirmados >= partido.cupos_totales) {
      return new Response(JSON.stringify({ error: 'Esta convocatoria ya está completa o cerrada.' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Registrar jugador
    const { error: insertJugadorError } = await supabase.from('jugadores').insert([
      {
        convocatoria_id: Number(id),
        nombre: payload.nombre,
        telefono: payload.telefono,
        posicion: payload.posicion || 'Volante',
      },
    ]);

    if (insertJugadorError) {
      return new Response(JSON.stringify({ error: insertJugadorError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Aumentar cupos confirmados y cerrar si se llenó
    const nuevosCupos = partido.cupos_confirmados + 1;
    const nuevoEstado = nuevosCupos >= partido.cupos_totales ? 'completa' : 'abierta';

    const { error: updateError } = await supabase
      .from('convocatorias')
      .update({
        cupos_confirmados: nuevosCupos,
        estado: nuevoEstado,
      })
      .eq('id', id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        message: '¡Te uniste con éxito a la pichanga!',
        cupos_restantes: partido.cupos_totales - nuevosCupos,
        estado: nuevoEstado,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error en la petición' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

