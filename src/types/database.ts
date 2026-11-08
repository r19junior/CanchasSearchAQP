export interface Cancha {
  id: number;
  nombre: string;
  distrito: string;
  direccion: string;
  referencia?: string | null;
  tipo_deporte: string;
  tarifa_hora: number;
  telefono_contacto?: string | null;
  telefono_secundario?: string | null;
  estado_contacto?: string | null;
  maps_url?: string | null;
  imagen_url?: string | null;
  verificacion_nota?: string | null;
  created_at?: string;
}

export type EstadoConvocatoria = 'abierta' | 'completa' | 'cancelada';

export interface Convocatoria {
  id: number;
  cancha_id: number;
  fecha: string;
  hora_inicio: string;
  cupos_totales: number;
  cupos_confirmados: number;
  organizador_nombre: string;
  organizador_telefono: string;
  estado: EstadoConvocatoria;
  created_at?: string;
}

export interface ConvocatoriaConCancha extends Convocatoria {
  canchas: Pick<Cancha, 'nombre' | 'distrito' | 'direccion' | 'tipo_deporte' | 'tarifa_hora' | 'maps_url' | 'imagen_url' | 'telefono_contacto'> | null;
}

export interface CrearConvocatoriaPayload {
  cancha_id: number;
  fecha: string;
  hora_inicio: string;
  cupos_totales: number;
  organizador_nombre: string;
  organizador_telefono: string;
}

export interface UnirseConvocatoriaPayload {
  nombre: string;
  telefono: string;
  posicion?: string;
}
