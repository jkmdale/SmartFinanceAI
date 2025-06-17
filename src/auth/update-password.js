// src/auth/update-password.js
import { supabase } from '../js/supabase/supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('update-password-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const newPassword = form['new-password'].value.trim();
    if (!newPassword) {
      alert('Please enter a new password.');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        alert(error.message || 'Failed to update password.');
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        alert('Password updated, but session expired. Please log in again.');
        window.location.href = '/SmartFinanceAI/auth/login.html';
        return;
      }

      alert('✅ Password updated successfully!');
      window.location.href = '/SmartFinanceAI/index.html';
    } catch (err) {
      console.error('Error updating password:', err);
      alert('Something went wrong while updating your password.');
    }
  });
});