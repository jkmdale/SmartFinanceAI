// src/auth/session-manager.js
import { supabase } from '../js/supabase/supabaseClient.js';

export async function requireLogin(redirectTo = '/SmartFinanceAI/auth/login.html') {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) return;

  // Retry after short delay (for session restoration)
  await new Promise((resolve) => setTimeout(resolve, 500));

  const retry = await supabase.auth.getSession();
  if (!retry.data.session) {
    window.location.href = redirectTo;
  }
}

export async function redirectIfLoggedIn(to = '/SmartFinanceAI/index.html') {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    window.location.href = to;
  }
}