// src/auth/session-manager.js
import { supabase } from '../js/supabase/supabaseClient.js';

// Call this at the top of pages that require login
export async function requireLogin(redirectTo = '../auth/login.html') {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = redirectTo;
  }
}

// Call this at the top of login/register pages to redirect if already logged in
export async function redirectIfLoggedIn(to = '../src/dashboard/index.html') {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    window.location.href = to;
  }
}