// src/auth/register.js
import { supabase } from '../js/supabase/supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = form.email.value.trim();
    const password = form.password.value.trim();

    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({ email, password });

      if (error) {
        alert(error.message || 'Signup failed. Please try again.');
        return;
      }

      alert('✅ Signup successful! Please check your email to confirm.');
      window.location.href = '/SmartFinanceAI/index.html';
    } catch (err) {
      console.error('Signup error:', err);
      alert('Unexpected error. Please try again.');
    }
  });
});