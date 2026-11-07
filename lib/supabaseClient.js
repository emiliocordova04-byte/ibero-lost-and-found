import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// no-store: the staff page must always show the current rows, never a cached answer
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: (url, options = {}) => fetch(url, { ...options, cache: "no-store" }) },
});
