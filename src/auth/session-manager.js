// src/auth/session-manager.js
import { supabase } from '../js/supabase/supabaseClient.js';

/**
 * Protect pages that require a logged-in user
 */
export async function requireLogin(redirectTo = './auth/login.html') {
  const { data: { session } } = await supabase.auth.getSession();

  // Immediate session (works most of the time)
  if (session) return;

  // Wait briefly for Supabase to restore session (especially on page refresh)
  await new Promise((resolve) => setTimeout(resolve, 500)); // give Supabase time

  const checkAgain = await supabase.auth.getSession();
  if (!checkAgain.data.session) {
    window.location.href = redirectTo;
  }
}

/**
 * Redirect to dashboard if user is already logged in
 */
export async function redirectIfLoggedIn(to = '../index.html') {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    window.location.href = to;
  }
}