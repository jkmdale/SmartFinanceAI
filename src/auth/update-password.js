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
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password update failed:', error.message);
        alert(error.message || 'Failed to update password.');
        return;
      }

      alert('✅ Password updated successfully!');
      window.location.href = '../index.html'; // Redirect to dashboard
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Something went wrong while updating your password.');
    }
  });
});