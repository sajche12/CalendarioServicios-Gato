'use server';

import { createClient } from '@/lib/supabase-server';
import { Colaborador, Proveedor, PlantillaItinerario, ServicioDiario } from '@/types';
import { revalidatePath } from 'next/cache';

// --- COLABORADORES ---

export async function getColaboradores(): Promise<Colaborador[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('colaboradores')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error fetching colaboradores:', error);
    return [];
  }
  return data || [];
}

export async function saveColaborador(colaborador: Omit<Colaborador, 'id' | 'created_at'> & { id?: string }): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  let query;

  if (colaborador.id) {
    query = supabase.from('colaboradores').update(colaborador).eq('id', colaborador.id);
  } else {
    query = supabase.from('colaboradores').insert(colaborador);
  }

  const { error } = await query;
  if (error) {
    console.error('Error saving colaborador:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

// --- PROVEEDORES ---

export async function getProveedores(): Promise<Proveedor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error fetching proveedores:', error);
    return [];
  }
  return data || [];
}

export async function saveProveedor(proveedor: Omit<Proveedor, 'id' | 'created_at'> & { id?: string }): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  let query;

  if (proveedor.id) {
    query = supabase.from('proveedores').update(proveedor).eq('id', proveedor.id);
  } else {
    query = supabase.from('proveedores').insert(proveedor);
  }

  const { error } = await query;
  if (error) {
    console.error('Error saving proveedor:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

// --- PLANTILLAS ---

export async function getPlantillas(): Promise<PlantillaItinerario[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('plantillas_itinerario')
    .select('*')
    .order('titulo', { ascending: true });

  if (error) {
    console.error('Error fetching plantillas:', error);
    return [];
  }
  return data || [];
}

export async function savePlantilla(plantilla: Omit<PlantillaItinerario, 'id' | 'created_at'> & { id?: string }): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  let query;

  if (plantilla.id) {
    query = supabase.from('plantillas_itinerario').update(plantilla).eq('id', plantilla.id);
  } else {
    query = supabase.from('plantillas_itinerario').insert(plantilla);
  }

  const { error } = await query;
  if (error) {
    console.error('Error saving plantilla:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

// --- SERVICIOS DIARIOS ---

/**
 * Obtiene los servicios diarios dentro de un rango de fechas (opcional).
 * Carga las relaciones con colaboradores y proveedores asociadas.
 */
export async function getServicios(fechaInicio?: string, fechaFin?: string): Promise<ServicioDiario[]> {
  const supabase = await createClient();
  let query = supabase
    .from('servicios_diarios')
    .select(`
      *,
      colaborador:colaborador_id(*),
      proveedor:proveedor_id(*)
    `);

  if (fechaInicio) {
    query = query.gte('fecha', fechaInicio);
  }
  if (fechaFin) {
    query = query.lte('fecha', fechaFin);
  }

  const { data, error } = await query.order('fecha', { ascending: true }).order('hora', { ascending: true });

  if (error) {
    console.error('Error fetching servicios:', error);
    return [];
  }
  return data || [];
}

export async function saveServicio(servicio: Omit<ServicioDiario, 'id' | 'created_at' | 'colaborador' | 'proveedor'> & { id?: string }): Promise<{ success: boolean; data?: any; error?: string }> {
  const supabase = await createClient();
  let query;

  // Limpiar valores vacíos o nulos para evitar errores de tipo en UUIDs
  const formattedServicio: any = { ...servicio };
  if (!formattedServicio.colaborador_id) formattedServicio.colaborador_id = null;
  if (!formattedServicio.proveedor_id) formattedServicio.proveedor_id = null;
  if (!formattedServicio.hora) formattedServicio.hora = null;

  if (servicio.id) {
    query = supabase.from('servicios_diarios').update(formattedServicio).eq('id', servicio.id).select();
  } else {
    query = supabase.from('servicios_diarios').insert(formattedServicio).select();
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error saving servicio:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true, data: data?.[0] };
}

export async function deleteServicio(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('servicios_diarios').delete().eq('id', id);

  if (error) {
    console.error('Error deleting servicio:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}
