// Módulo de autenticación: registro, inicio/cierre de sesión y estado global.
import { supabase } from './supabase-client.js';

// Estado actual del usuario (null = no autenticado)
export let currentUser = null;

const listeners = [];

// Suscribirse a cambios de sesión (login/logout)
export function onAuthChange(callback) {
  listeners.push(callback);
  callback(currentUser);
}

function notify() {
  listeners.forEach((cb) => cb(currentUser));
}

export async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  currentUser = session?.user ?? null;
  notify();

  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    notify();
  });
}

export async function registrar(email, password, nombreCompleto) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre_completo: nombreCompleto } },
  });
  if (error) throw error;
  return data.user;
}

export async function iniciarSesion(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Perfil del usuario autenticado (tabla perfil_usuario, protegida por RLS)
export async function obtenerPerfil() {
  if (!currentUser) return null;
  const { data, error } = await supabase
    .from('perfil_usuario')
    .select('*')
    .eq('id', currentUser.id)
    .single();
  if (error) throw error;
  return data;
}

export async function actualizarPerfil(cambios) {
  if (!currentUser) throw new Error('Debes iniciar sesión');
  const { data, error } = await supabase
    .from('perfil_usuario')
    .update(cambios)
    .eq('id', currentUser.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
