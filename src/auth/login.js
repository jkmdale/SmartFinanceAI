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
      const { error } = await loginUser(email, password);

      if (error) {
        console.error('Login failed:', error.message);
        alert(error.message || 'Login failed. Please check your credentials.');
        return;
      }

      // ✅ Redirect on successful login
      window.location.href = '../index.html';
    } catch (err) {
      console.error('Unexpected login error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      // Optional: clear password field only
      form.password.value = '';
    }
  });
});