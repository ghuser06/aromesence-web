// CRUD sobre la tabla `perfumes`.
// Lectura: pública. Escritura: solo usuarios con es_admin = true (aplicado por RLS
// en la base de datos — aunque alguien salte el frontend, la BD rechaza la operación).
import { supabase } from './supabase-client.js';

export async function listarPerfumes() {
  const { data, error } = await supabase
    .from('perfumes')
    .select('*')
    .order('creado_en', { ascending: false });
  if (error) throw error;
  return data;
}

export async function crearPerfume(perfume) {
  const { data, error } = await supabase
    .from('perfumes')
    .insert(perfume)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function actualizarPerfume(id, cambios) {
  const { data, error } = await supabase
    .from('perfumes')
    .update(cambios)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function eliminarPerfume(id) {
  const { error } = await supabase.from('perfumes').delete().eq('id', id);
  if (error) throw error;
}
