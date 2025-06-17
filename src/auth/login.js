// src/auth/login.js
import { loginUser } from './auth-manager.js';
import { supabase } from '../js/supabase/supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = form.email.value.trim();
    const password = form.password.value.trim();

    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }

    try {
      const { error, data } = await loginUser(email, password);
      console.log('🔐 Login response:', { error, data });

      if (error) {
        alert(error.message || 'Login failed. Please check your credentials.');
        return;
      }

      // Confirm session after login
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('🔐 Session after login:', sessionData);

      if (!sessionData.session) {
        alert('Login succeeded but session not established. Please try again.');
        return;
      }

      // Redirect to dashboard (absolute path to avoid broken redirects)
      window.location.href = '/SmartFinanceAI/src/core/dashboard.html';
    } catch (err) {
      console.error('⚠️ Login error:', err);
      alert('Unexpected error during login. Please try again.');
    }
  });
});