// src/auth/biometric.js
import { loginUser } from './auth-manager.js';

document.addEventListener('DOMContentLoaded', () => {
  const biometricBtn = document.getElementById('biometric-login');
  if (!biometricBtn) return;

  biometricBtn.addEventListener('click', async () => {
    try {
      const email = localStorage.getItem('biometricEmail');
      const password = localStorage.getItem('biometricPassword');

      if (!email || !password) {
        alert('No saved credentials found. Please login manually first.');
        return;
      }

      const { error } = await loginUser(email, password);
      if (error) {
        alert('Biometric login failed.');
      } else {
        window.location.href = '../dashboard/index.html';
      }
    } catch (err) {
      console.error('Biometric login error:', err);
      alert('Biometric login error');
    }
  });
});