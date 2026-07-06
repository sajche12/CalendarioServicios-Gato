import { createClient as createClientJS } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente del lado del cliente (para componentes marcados con 'use client' que corren en el navegador)
export const supabase = createClientJS(supabaseUrl, supabaseAnonKey);
