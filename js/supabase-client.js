// Cliente único de Supabase para toda la aplicación (patrón singleton).
// La clave publishable es segura de exponer en el frontend: los permisos
// reales los controla Row Level Security en la base de datos.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://ivsitbxbixqvllkcjbui.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_VkfErErpRg7sEeaKlFDuTw_wzd0GZhq';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
