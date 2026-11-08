import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabase
      .from('canchas')
      .select('*')
      .order('estado_contacto', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sortedData = (data ?? []).sort((a, b) => {
      const aCompleto = a.estado_contacto === 'Completo' ? 0 : 1;
      const bCompleto = b.estado_contacto === 'Completo' ? 0 : 1;
      if (aCompleto !== bCompleto) return aCompleto - bCompleto;
      return a.id - b.id;
    });

    return new Response(JSON.stringify(sortedData), {
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
