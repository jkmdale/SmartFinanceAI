import { supabase } from '/SmartFinanceAI/src/js/supabase/supabaseClient.js';

export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}