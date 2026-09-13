import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL en las variables de entorno.');
}

if (!supabaseKey) {
  throw new Error(
    'Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en las variables de entorno.'
  );
}

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseKey
);