// src/auth/auth-manager.js
import { supabase } from '../js/supabase/supabaseClient.js';

// 🔐 Sign in user with email/password
export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { ...data, error };
}

// 🆕 Sign up new user with email/password
export async function registerUser(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { ...data, error };
}

// 📬 Request a password reset email
export async function requestPasswordReset(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://jkmdale.github.io/SmartFinanceAI/auth/update-password.html',
  });
  return { ...data, error };
}

// 🔄 Update password after reset flow
export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { ...data, error };
}

// 🔁 Check if user is already logged in
export async function checkSessionAndRedirect() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Redirect to login if not authenticated
    window.location.href = '/SmartFinanceAI/auth/login.html';
  }
}

// 👋 Logout user
export async function logoutUser() {
  await supabase.auth.signOut();
  window.location.href = '/SmartFinanceAI/auth/login.html';
}
