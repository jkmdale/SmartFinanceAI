// src/auth/reset.js
import { supabase } from '../js/supabase/supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('reset-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = form.email.value.trim();
    if (!email) {
      alert('Please enter your email address.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://jkmdale.github.io/SmartFinanceAI/src/auth/update-password.html' // 
      });

      if (error) {
        alert(error.message || 'Could not send reset email.');
        return;
      }

      alert('✅ A reset link has been sent to your email.');
    } catch (err) {
      console.error('Reset error:', err);
      alert('Unexpected error. Please try again later.');
    }
  });
});