// src/js/supabase/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gzznuwtxyyaqlbbrxsuz.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6em51d3R4eXlhcWxiYnJ4c3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5ODE1NzgsImV4cCI6MjA2NTU1NzU3OH0.u-9MqMTAvSIf2V6qnt8oriNH-Sx-UXU0R6K3gsj5MSw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage, // Ensures login persists across reloads
  },
});