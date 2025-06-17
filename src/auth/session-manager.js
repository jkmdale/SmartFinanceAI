// src/auth/session-manager.js
import { supabase } from '../js/supabase/supabaseClient.js';

/**
 * Checks if the user is already logged in and redirects to the dashboard if so.
 * @param {string} to - The URL to redirect to. Defaults to the dashboard.
 */
export async function redirectIfLoggedIn(to = '../src/core/dashboard.html') {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    window.location.href = to;
  }
}

/**
 * Requires the user to be logged in. If not, redirects to login.
 */
export async function requireLogin(redirectTo = '../src/auth/login.html') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = redirectTo;
    throw new Error('User not logged in');
  }
}