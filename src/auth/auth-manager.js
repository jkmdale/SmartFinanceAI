// src/auth/auth-manager.js
import { supabase } from '../js/supabase/supabaseClient.js';

/**
 * Sign up a new user with email and password
 */
export async function signUpUser(email, password) {
  const { error } = await supabase.auth.signUp({
    email,
    password
  });
  return { error };
}

/**
 * Log in a user with email and password
 */
export async function loginUser(email, password) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { error };
}

/**
 * Sign out the currently logged-in user
 */
export async function signOutUser() {
  await supabase.auth.signOut();
}