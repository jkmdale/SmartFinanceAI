// src/auth/auth-manager.js
import { supabase } from '../js/supabase/supabaseClient.js';

/**
 * Sign up a new user
 */
export async function signUpUser(email, password) {
  const { error } = await supabase.auth.signUp({ email, password });
  return { error };
}

/**
 * Log in an existing user
 */
export async function loginUser(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
}

/**
 * Log out the current user
 */
export async function signOutUser() {
  await supabase.auth.signOut();
}