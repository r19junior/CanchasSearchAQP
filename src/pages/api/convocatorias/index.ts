import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import type { CrearConvocatoriaPayload } from '../../../types/database';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const distrito = url.searchParams.get('distrito');

    let query = supabase
      .from('convocatorias')
      .select(`
        id,
        cancha_id,
        fecha,
        hora_inicio,
        cupos_totales,
        cupos_confirmados,
        organizador_nombre,
        organizador_telefono,
        estado,
        canchas (
          nombre,
          distrito,
          direccion,
          tipo_deporte,
          tarifa_hora,
          maps_url,
          imagen_url,
          telefono_contacto
        )
      `)
      .eq('estado', 'abierta')
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (distrito) {
      query = query.eq('canchas.distrito', distrito);
    }

    const { data, error } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload: CrearConvocatoriaPayload = await request.json();

    // Validaciones básicas de entrada
    if (
      !payload.cancha_id ||
      !payload.fecha ||
      !payload.hora_inicio ||
      !payload.cupos_totales ||
      !payload.organizador_nombre ||
      !payload.organizador_telefono
    ) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos obligatorios para registrar la convocatoria.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('convocatorias')
      .insert([
        {
          cancha_id: payload.cancha_id,
          fecha: payload.fecha,
          hora_inicio: payload.hora_inicio,
          cupos_totales: payload.cupos_totales,
          cupos_confirmados: 0,
          organizador_nombre: payload.organizador_nombre,
          organizador_telefono: payload.organizador_telefono,
          estado: 'abierta',
        },
      ])
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

