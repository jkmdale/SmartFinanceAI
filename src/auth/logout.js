// src/auth/logout.js
import { signOutUser } from './auth-manager.js';

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    try {
      await signOutUser();
      window.location.href = '/SmartFinanceAI/auth/login.html';
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Something went wrong during logout.');
    }
  });
});