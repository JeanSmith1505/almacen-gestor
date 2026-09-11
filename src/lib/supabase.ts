import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copia .env.local.example a .env.local y completa los valores de tu proyecto Supabase.'
  );
}

// Cliente único para todo el frontend. Usa exclusivamente la clave anon
// (pública). La clave service_role NUNCA debe usarse en el navegador.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);