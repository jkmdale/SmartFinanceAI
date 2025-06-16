// src/auth/biometric.js
import { supabase } from '../js/supabase/supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
  const biometricBtn = document.getElementById('biometric-login');
  if (!biometricBtn) return;

  biometricBtn.addEventListener('click', async () => {
    try {
      // Start WebAuthn login
      const { data, error } = await supabase.auth.signInWithOtp({
        email: '', // optional — can be empty if stored in session
        options: {
          flowType: 'passkey'
        }
      });

      if (error) {
        console.error(error);
        alert('Biometric login failed.');
        return;
      }

      // Success
      window.location.href = '../dashboard/index.html';
    } catch (err) {
      console.error('Biometric error:', err);
      alert('Something went wrong with biometric login.');
    }
  });
});