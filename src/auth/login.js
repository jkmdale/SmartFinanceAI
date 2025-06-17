// src/auth/login.js
import { loginUser } from './auth-manager.js';

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
      const { error, session } = await loginUser(email, password);

      if (error) {
        alert(error.message || 'Login failed. Please check your credentials.');
        return;
      }

      if (!session) {
        alert('Login failed: no active session returned.');
        return;
      }

      // ✅ Clear only after success
      form.password.value = '';

      // ✅ Redirect safely
      window.location.href = '/SmartFinanceAI/index.html';
    } catch (err) {
      console.error('Login error:', err);
      alert('Something went wrong. Please try again.');
    }
  });
});
